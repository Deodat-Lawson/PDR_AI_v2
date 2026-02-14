/**
 * Inngest Document Processing Function
 * Background job handler for the document ingestion pipeline.
 *
 * V2: Supports the new Source Adapter ingestion layer for non-PDF files,
 * optional sidecar embedding with fan-out, and optional entity extraction
 * for Graph RAG.
 */

import { inngest } from "../client";
import {
  routeDocument,
  normalizeDocument,
  chunkPages,
  vectorizeChunks,
  storeDocument,
  isKnownOfficeDocument,
  type RouterDecisionResult,
  type NormalizationResult,
  type StoredSection,
} from "~/lib/ocr/processor";
import { getTotalChunkSize } from "~/lib/ocr/chunker";

import type {
  ProcessDocumentEventData,
  PipelineResult,
  VectorizedChunk,
  DocumentChunk,
  OCRProvider,
} from "~/lib/ocr/types";

export type { ProcessDocumentEventData, PipelineResult, VectorizedChunk };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIDECAR_URL = process.env.SIDECAR_URL;
const SIDECAR_BATCH_SIZE = 50;

/** Check whether the sidecar is available (env var set). */
function isSidecarEnabled(): boolean {
  return !!SIDECAR_URL;
}

/** Split an array into batches of `size`. */
function splitIntoBatches<T>(arr: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}

// ---------------------------------------------------------------------------
// Inngest Function
// ---------------------------------------------------------------------------

// Inngest client is always available (required in production, created in dev)
export const uploadDocument = inngest.createFunction(
  {
    id: "process-document",
    name: "Document Ingestion Pipeline (V2)",
    retries: 5,
    onFailure: async ({ error, event }) => {
      console.error(`[ProcessDocument] Pipeline failed for job ${JSON.stringify(event.data)}:`, error);
    },
  },
  { event: "document/process.requested" },
  async ({ event, step }) => {
    const eventData = event.data as ProcessDocumentEventData;
    const { jobId, documentUrl, documentId, documentName, companyId, mimeType, options } = eventData;
    const pipelineStartTime = Date.now();

    // Determine if we should use the new ingestion layer or the original PDF pipeline.
    // Office extensions always use ingestion (even when mimeType is missing).
    const isPdf =
      !isKnownOfficeDocument(documentName) &&
      (!mimeType ||
        mimeType === "application/pdf" ||
        documentName.toLowerCase().endsWith(".pdf"));

    // ====================================================================
    // Steps A+B: Route + Normalize
    // ====================================================================

    let normalizationResult: NormalizationResult;

    if (isPdf) {
      // --- Original PDF pipeline ---
      const routerDecision = await step.run(
        "step-a-router",
        async (): Promise<RouterDecisionResult> => {
          return routeDocument(documentUrl, options);
        },
      );

      normalizationResult = await step.run(
        "step-b-normalize",
        async (): Promise<NormalizationResult> => {
          return normalizeDocument(documentUrl, routerDecision);
        },
      );
    } else {
      // --- New ingestion layer for non-PDF files ---
      normalizationResult = await step.run(
        "step-ab-ingest",
        async (): Promise<NormalizationResult> => {
          const { ingestToNormalized } = await import("~/lib/ingestion");
          const normalizedDoc = await ingestToNormalized(documentUrl, {
            mimeType,
            filename: documentName,
            forceOCR: options?.forceOCR,
          });
          return {
            pages: normalizedDoc.pages,
            provider: normalizedDoc.metadata.provider,
            processingTimeMs: normalizedDoc.metadata.processingTimeMs,
            confidenceScore: normalizedDoc.metadata.confidenceScore,
          };
        },
      );
    }

    // ====================================================================
    // Step C: Chunking
    // ====================================================================

    const chunks = await step.run(
      "step-c-chunking",
      async (): Promise<DocumentChunk[]> => {
        return chunkPages(normalizationResult.pages);
      },
    );

    // ====================================================================
    // Step D: Vectorize (sidecar fan-out or OpenAI fallback)
    // ====================================================================

    let vectorizedChunks: VectorizedChunk[];

    if (isSidecarEnabled() && chunks.length > 0) {
      // Fan-out: embed in parallel batches via sidecar
      const batches = splitIntoBatches(chunks, SIDECAR_BATCH_SIZE);
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < batches.length; i++) {
        const batchResult = await step.run(
          `step-d-embed-batch-${i}`,
          async (): Promise<number[][]> => {
            const texts = batches[i]!.map((c) => c.content);
            const resp = await fetch(`${SIDECAR_URL}/embed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ texts }),
            });
            if (!resp.ok) {
              throw new Error(
                `Sidecar /embed failed (batch ${i}): ${resp.status} ${await resp.text()}`,
              );
            }
            const data = (await resp.json()) as { embeddings: number[][] };
            return data.embeddings;
          },
        );
        allEmbeddings.push(...batchResult);
      }

      // Merge embeddings with chunks
      vectorizedChunks = chunks.map((chunk, idx) => ({
        content: chunk.content,
        metadata: chunk.metadata,
        vector: allEmbeddings[idx]!,
      }));
    } else {
      // Fallback: use OpenAI embeddings (existing behaviour)
      vectorizedChunks = await step.run(
        "step-d-vectorize",
        async (): Promise<VectorizedChunk[]> => {
          return vectorizeChunks(chunks);
        },
      );
    }

    // ====================================================================
    // Step E: Storage (returns section IDs for downstream Graph RAG)
    // ====================================================================

    const storedSections = await step.run(
      "step-e-storage",
      async (): Promise<StoredSection[]> => {
        return storeDocument(
          documentId,
          jobId,
          vectorizedChunks,
          normalizationResult,
          pipelineStartTime,
        );
      },
    );

    // ====================================================================
    // Step F: Entity extraction + Graph RAG storage
    // Auto-enabled when sidecar is available (SIDECAR_URL set)
    // ====================================================================

    if (isSidecarEnabled() && storedSections.length > 0) {
      await step.run("step-f-graph-rag", async () => {
        // Health check: avoid wasting an Inngest retry on a flaky sidecar
        const sidecarHealthy = await fetch(`${SIDECAR_URL}/health`)
          .then((r) => r.ok)
          .catch(() => false);

        if (!sidecarHealthy) {
          console.warn(
            "[ProcessDocument] Step F skipped: sidecar unhealthy",
          );
          return null;
        }

        const { extractAndStoreEntities } = await import(
          "~/lib/ingestion/entity-extraction"
        );

        const result = await extractAndStoreEntities(
          storedSections,
          documentId,
          BigInt(companyId),
        );

        console.log(
          `[ProcessDocument] Graph RAG: ${result.totalEntities} entities, ` +
            `${result.totalRelationships} relationships stored`,
        );
        return result;
      });
    }

    // ====================================================================
    // Final Result
    // ====================================================================

    const stats = getTotalChunkSize(chunks);
    const totalProcessingTime = Date.now() - pipelineStartTime;

    const pipelineResult: PipelineResult = {
      success: true,
      jobId,
      documentId,
      chunks: vectorizedChunks,
      metadata: {
        totalChunks: vectorizedChunks.length,
        textChunks: stats.textChunks,
        tableChunks: stats.tableChunks,
        totalPages: normalizationResult.pages.length,
        provider: normalizationResult.provider,
        processingTimeMs: normalizationResult.processingTimeMs,
        embeddingTimeMs: totalProcessingTime - normalizationResult.processingTimeMs,
      },
    };

    return pipelineResult;
  },
);
