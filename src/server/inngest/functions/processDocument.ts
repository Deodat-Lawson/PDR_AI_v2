import { inngest } from "../client";
// Lazy import complexity module to prevent bundling HuggingFace dependencies
// import { determineDocumentRouting, type RoutingDecision } from "~/lib/ocr/complexity";
import type { RoutingDecision } from "~/lib/ocr/complexity";
import { createAzureAdapter, createLandingAIAdapter } from "~/lib/ocr/adapters";
import { chunkDocument, mergeWithEmbeddings, prepareForEmbedding, getTotalChunkSize } from "~/lib/ocr/chunker";
import { generateEmbeddings } from "~/lib/ai/embeddings";
import { db } from "~/server/db";
import {
  documentSections,
  documentStructure,
  documentMetadata,
  document as documentTable,
  ocrJobs,
} from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

import type {
  ProcessDocumentEventData,
  PipelineResult,
  PageContent,
  OCRProvider,
  NormalizedDocument,
  VectorizedChunk,
} from "~/lib/ocr/types";

export type { ProcessDocumentEventData, PipelineResult, VectorizedChunk };

/**
 * Step A Result: Router decision
 */
interface RouterDecisionResult {
  isNativePDF: boolean;
  pageCount: number;
  selectedProvider: OCRProvider;
  confidence: number;
  reason: string;
  visionLabel?: string;
}

/**
 * Step B Result: Normalized document
 */
interface NormalizationResult {
  pages: PageContent[];
  provider: OCRProvider;
  processingTimeMs: number;
  confidenceScore?: number;
}

/**
 * Main uploadDocument Inngest function
 */
export const uploadDocument = inngest.createFunction(
  {
    id: "process-document",
    name: "OCR-to-Vector Document Pipeline",
    retries: 4,
    onFailure: async ({ error, event }) => {
      console.error(`[ProcessDocument] Pipeline failed for job ${JSON.stringify(event.data)}:`, error);
    },
  },
  { event: "document/process.requested" },
  async ({ event, step }) => {
    const eventData = event.data as ProcessDocumentEventData;
    const { jobId, documentUrl, documentId, options } = eventData;
    const pipelineStartTime = Date.now();

    // ========================================================================
    // STEP A: Router Decision
    // ========================================================================
    const routerDecision = await step.run("step-a-router", async (): Promise<RouterDecisionResult> => {
      // Lazy import complexity module to avoid bundling heavy ML dependencies
      const { determineDocumentRouting } = await import("~/lib/ocr/complexity");
      const decision: RoutingDecision = await determineDocumentRouting(documentUrl);

      const isNativePDF = decision.provider === "NATIVE_PDF";

      if (options?.forceOCR === true && isNativePDF) {
        const isComplex = decision.visionResult?.label 
          ? ["handwritten", "complex", "blurry", "messy"].some(k => decision.visionResult?.label.includes(k))
          : false;

        const ocrProvider: OCRProvider = isComplex ? "LANDING_AI" : "AZURE";

        return {
          isNativePDF: false,
          pageCount: decision.pageCount,
          selectedProvider: ocrProvider,
          confidence: decision.confidence,
          reason: `Force OCR enabled (Original: ${decision.provider}), switching to ${ocrProvider}`,
          visionLabel: decision.visionResult?.label,
        };
      }

      return {
        isNativePDF,
        pageCount: decision.pageCount,
        selectedProvider: decision.provider,
        confidence: decision.confidence,
        reason: decision.reason,
        visionLabel: decision.visionResult?.label,
      };
    });

    // ========================================================================
    // STEP B: Execution & Normalization
    // ========================================================================
    const normalizationResult = await step.run("step-b-normalize", async (): Promise<NormalizationResult> => {
      console.log(`[Step B] Processing with provider: ${routerDecision.selectedProvider}`);

      let normalizedDoc: NormalizedDocument;

      if (routerDecision.isNativePDF) {
        normalizedDoc = await processNativePDF(documentUrl);
      } else {
        switch (routerDecision.selectedProvider) {
          case "AZURE":
            normalizedDoc = await processWithAzure(documentUrl);
            break;
          case "LANDING_AI":
            normalizedDoc = await processWithLandingAI(documentUrl);
            break;
          default:
            normalizedDoc = await processWithAzure(documentUrl);
        }
      }

      console.log(`[Step B] Extracted ${normalizedDoc.pages.length} pages`);

      return {
        pages: normalizedDoc.pages,
        provider: normalizedDoc.metadata.provider,
        processingTimeMs: normalizedDoc.metadata.processingTimeMs,
        confidenceScore: normalizedDoc.metadata.confidenceScore,
      };
    });

    // ========================================================================
    // STEP C: Intelligent Chunking
    // ========================================================================
    const chunks = await step.run("step-c-chunking", async () => {
      // Log page content sizes for debugging
      const pageSizes = normalizationResult.pages.map((page, idx) => {
        const textLength = page.textBlocks.join("").length;
        return `Page ${idx + 1}: ${textLength} chars, ${page.textBlocks.length} blocks, ${page.tables.length} tables`;
      });
      console.log(`[Step C] Page content sizes:\n${pageSizes.join("\n")}`);

      const documentChunks = chunkDocument(normalizationResult.pages, {
        maxTokens: 500,
        overlapTokens: 50,
        includePageContext: true,
      });
      console.log(`[Step C] Created ${documentChunks.length} chunks`);

      // Log chunk details
      documentChunks.forEach((chunk, idx) => {
        console.log(`[Step C] Chunk ${idx}: ${chunk.content.length} chars, page ${chunk.metadata.pageNumber}, type ${chunk.type}`);
      });

      return documentChunks;
    });

    // ========================================================================
    // STEP D: Vectorization
    // ========================================================================
    const vectorizedChunks = await step.run("step-d-vectorize", async (): Promise<VectorizedChunk[]> => {
      if (chunks.length === 0) return [];

      const contentStrings = prepareForEmbedding(chunks);
      const embeddingResult = await generateEmbeddings(contentStrings, {
        batchSize: 20,
        model: "text-embedding-3-large",
        dimensions: 1536,
      });

      return mergeWithEmbeddings(chunks, embeddingResult.embeddings);
    });

    // ========================================================================
    // STEP E: Storage (RLM Schema)
    // ========================================================================
    await step.run("step-e-storage", async () => {
      if (vectorizedChunks.length === 0) {
        console.log("[Step E] No chunks to store");
        return;
      }

      const docId = typeof documentId === 'number' ? documentId : Number(documentId);
      console.log(`[Step E] Starting insertion of ${vectorizedChunks.length} chunks into RLM schema...`);

      // 1. Create root document structure node
      const rootStructure = await db.insert(documentStructure).values({
        documentId: BigInt(docId),
        parentId: null,
        contentType: "section",
        path: "/",
        title: "Document Root",
        level: 0,
        ordering: 0,
        startPage: 1,
        endPage: normalizationResult.pages.length,
        tokenCount: Math.ceil(vectorizedChunks.reduce((sum, c) => sum + (c.content.length / 4), 0)),
        childCount: 0,
      }).returning({ id: documentStructure.id });

      const rootId = rootStructure[0]?.id;
      if (!rootId) {
        throw new Error("Failed to create root document structure");
      }

      // 2. Insert document sections with embeddings
      for (const chunk of vectorizedChunks) {
        const contentHash = crypto.createHash("sha256").update(chunk.content).digest("hex");
        const isTable = chunk.metadata.isTable;

        await db.insert(documentSections).values({
          documentId: BigInt(docId),
          structureId: BigInt(rootId),
          content: chunk.content,
          tokenCount: Math.ceil(chunk.content.length / 4), // Approximate tokens
          charCount: chunk.content.length,
          embedding: sql`${JSON.stringify(chunk.vector)}::vector(1536)`,
          pageNumber: chunk.metadata.pageNumber,
          semanticType: isTable ? "tabular" : "narrative",
          contentHash,
        });
      }

      // 3. Create document metadata for planning layer
      const fullText = vectorizedChunks.map(c => c.content).join("\n\n");
      const summaryPreview = fullText.substring(0, 500) + (fullText.length > 500 ? "..." : "");

      await db.insert(documentMetadata).values({
        documentId: BigInt(docId),
        summary: summaryPreview,
        outline: normalizationResult.pages.map((_, i) => ({
          id: i + 1,
          title: `Page ${i + 1}`,
          level: 1,
          path: `/${i + 1}`,
          pageRange: { start: i + 1, end: i + 1 },
        })),
        totalTokens: vectorizedChunks.reduce((sum, c) => sum + Math.ceil(c.content.length / 4), 0),
        totalPages: normalizationResult.pages.length,
        totalSections: vectorizedChunks.length,
        topicTags: [],
        entities: {},
      });

      // 4. Update document record with OCR metadata
      await db
        .update(documentTable)
        .set({
          ocrProcessed: true,
          ocrJobId: jobId,
          ocrProvider: normalizationResult.provider,
          ocrConfidenceScore: normalizationResult.confidenceScore,
          ocrMetadata: {
            totalPages: normalizationResult.pages.length,
            totalChunks: vectorizedChunks.length,
            processingTimeMs: normalizationResult.processingTimeMs,
            processedAt: new Date().toISOString(),
          },
        })
        .where(eq(documentTable.id, docId));

      // 5. Update OCR job status to completed
      await db
        .update(ocrJobs)
        .set({
          status: "completed",
          completedAt: new Date(),
          processingDurationMs: Date.now() - pipelineStartTime,
          pageCount: normalizationResult.pages.length,
          actualProvider: normalizationResult.provider,
          confidenceScore: normalizationResult.confidenceScore,
        })
        .where(eq(ocrJobs.id, jobId));

      console.log(`[Step E] Successfully stored ${vectorizedChunks.length} sections for document ${documentId}`);
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Process native PDF using pdf-parse (Node.js native)
 */
async function processNativePDF(documentUrl: string): Promise<NormalizedDocument> {
  const startTime = Date.now();

  // Dynamic import to avoid pdf-parse test file issues at module load time
  const { default: pdfParse } = await import("pdf-parse");

  // 1. Fetch PDF data
  const response = await fetch(documentUrl);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Parse PDF with page-level extraction
  const data = await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent();
      const text = textContent.items.map((item) => item.str).join(' ');
      return text;
    }
  });

  // 3. Build page structure
  const pages: PageContent[] = [];
  const totalPages = data.numpages;

  // Split text by pages if available, otherwise create single page
  if (data.text && data.text.trim().length > 0) {
    // For now, treat entire document as one page
    // pdf-parse doesn't provide easy page-by-page text separation
    // For better page separation, would need pdf-lib to detect page breaks
    pages.push({
      pageNumber: 1,
      textBlocks: [data.text],
      tables: []
    });
  }

  return {
    pages,
    metadata: {
      totalPages,
      provider: "NATIVE_PDF",
      processingTimeMs: Date.now() - startTime,
      confidenceScore: 95, // Slightly lower since we don't preserve exact page boundaries
    },
  };
}

async function processWithAzure(documentUrl: string): Promise<NormalizedDocument> {
  const adapter = createAzureAdapter();
  return adapter.uploadDocument(documentUrl);
}

async function processWithLandingAI(documentUrl: string): Promise<NormalizedDocument> {
  const adapter = createLandingAIAdapter();
  return adapter.uploadDocument(documentUrl);
}