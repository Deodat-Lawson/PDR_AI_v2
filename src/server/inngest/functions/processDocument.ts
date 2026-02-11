/**
 * Inngest Document Processing Function
 * Background job handler for OCR-to-Vector pipeline
 * 
 * Uses shared processor module for core logic
 */

import { inngest } from "../client";
import {
  routeDocument,
  normalizeDocument,
  chunkPages,
  vectorizeChunks,
  storeDocument,
  type RouterDecisionResult,
  type NormalizationResult,
} from "~/lib/ocr/processor";
import { getTotalChunkSize } from "~/lib/ocr/chunker";

import type {
  ProcessDocumentEventData,
  PipelineResult,
  VectorizedChunk,
  DocumentChunk,
} from "~/lib/ocr/types";

export type { ProcessDocumentEventData, PipelineResult, VectorizedChunk };

// Only create the function if inngest client is available
export const uploadDocument = inngest?.createFunction(
  {
    id: "process-document",
    name: "OCR-to-Vector Document Pipeline",
    retries: 5,
    onFailure: async ({ error, event }) => {
      console.error(`[ProcessDocument] Pipeline failed for job ${JSON.stringify(event.data)}:`, error);
    },
  },
  { event: "document/process.requested" },
  async ({ event, step }) => {
    const eventData = event.data as ProcessDocumentEventData;
    const { jobId, documentUrl, documentId, options } = eventData;
    const pipelineStartTime = Date.now();

    // Step A: Router - determine document routing
    const routerDecision = await step.run("step-a-router", async (): Promise<RouterDecisionResult> => {
      return routeDocument(documentUrl, options);
    });

    // Step B: Normalize - run OCR or native extraction
    const normalizationResult = await step.run("step-b-normalize", async (): Promise<NormalizationResult> => {
      return normalizeDocument(documentUrl, routerDecision);
    });

    // Step C: Chunking
    const chunks = await step.run("step-c-chunking", async (): Promise<DocumentChunk[]> => {
      return chunkPages(normalizationResult.pages);
    });

    // Step D: Vectorize
    const vectorizedChunks = await step.run("step-d-vectorize", async (): Promise<VectorizedChunk[]> => {
      return vectorizeChunks(chunks);
    });

    // Step E: Storage
    await step.run("step-e-storage", async () => {
      await storeDocument(
        documentId,
        jobId,
        vectorizedChunks,
        normalizationResult,
        pipelineStartTime
      );
    });

    // ========================================================================
    // Final Result
    // ========================================================================
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
  }
);
