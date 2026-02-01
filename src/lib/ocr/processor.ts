/**
 * Document Processor Module
 * Shared processing logic for OCR-to-Vector pipeline
 * Can be used by both Inngest background jobs and synchronous processing
 */

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
  DocumentChunk,
} from "~/lib/ocr/types";

export type { ProcessDocumentEventData, PipelineResult, VectorizedChunk };

/**
 * Router decision result from Step A
 */
export interface RouterDecisionResult {
  isNativePDF: boolean;
  pageCount: number;
  selectedProvider: OCRProvider;
  confidence: number;
  reason: string;
  visionLabel?: string;
}

/**
 * Normalization result from Step B
 */
export interface NormalizationResult {
  pages: PageContent[];
  provider: OCRProvider;
  processingTimeMs: number;
  confidenceScore?: number;
}

// ============================================================================
// Step A: Router - Determine document routing
// ============================================================================

/**
 * Determine how to route the document for processing
 */
export async function routeDocument(
  documentUrl: string,
  options?: { forceOCR?: boolean }
): Promise<RouterDecisionResult> {
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
}

// ============================================================================
// Step B: Normalize - Run OCR or native extraction
// ============================================================================

/**
 * Normalize document content using the appropriate provider
 */
export async function normalizeDocument(
  documentUrl: string,
  routerDecision: RouterDecisionResult
): Promise<NormalizationResult> {
  console.log(`[Normalize] Processing with provider: ${routerDecision.selectedProvider}`);

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

  return {
    pages: normalizedDoc.pages,
    provider: normalizedDoc.metadata.provider,
    processingTimeMs: normalizedDoc.metadata.processingTimeMs,
    confidenceScore: normalizedDoc.metadata.confidenceScore,
  };
}

// ============================================================================
// Step C: Chunking
// ============================================================================

/**
 * Chunk the normalized document pages
 */
export function chunkPages(pages: PageContent[]): DocumentChunk[] {
  const pageSizes = pages.map((page, idx) => {
    const textLength = page.textBlocks.join("").length;
    return `Page ${idx + 1}: ${textLength} chars, ${page.textBlocks.length} blocks, ${page.tables.length} tables`;
  });
  console.log(`[Chunking] Page content sizes:\n${pageSizes.join("\n")}`);

  const documentChunks = chunkDocument(pages, {
    maxTokens: 500,
    overlapTokens: 50,
    includePageContext: true,
  });
  console.log(`[Chunking] Created ${documentChunks.length} chunks`);

  documentChunks.forEach((chunk, idx) => {
    console.log(`[Chunking] Chunk ${idx}: ${chunk.content.length} chars, page ${chunk.metadata.pageNumber}, type ${chunk.type}`);
  });

  return documentChunks;
}

// ============================================================================
// Step D: Vectorize
// ============================================================================

/**
 * Generate embeddings for document chunks
 */
export async function vectorizeChunks(chunks: DocumentChunk[]): Promise<VectorizedChunk[]> {
  if (chunks.length === 0) return [];

  const contentStrings = prepareForEmbedding(chunks);
  const embeddingResult = await generateEmbeddings(contentStrings, {
    batchSize: 20,
    model: "text-embedding-3-large",
    dimensions: 1536,
  });

  return mergeWithEmbeddings(chunks, embeddingResult.embeddings);
}

// ============================================================================
// Step E: Storage
// ============================================================================

/**
 * Store vectorized chunks in the database
 */
export async function storeDocument(
  documentId: number,
  jobId: string,
  vectorizedChunks: VectorizedChunk[],
  normalizationResult: NormalizationResult,
  pipelineStartTime: number
): Promise<void> {
  if (vectorizedChunks.length === 0) {
    console.log("[Storage] No chunks to store");
    return;
  }

  // 1. Create root document structure
  const rootStructure = await db.insert(documentStructure).values({
    documentId: BigInt(documentId),
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
      documentId: BigInt(documentId),
      structureId: BigInt(rootId),
      content: chunk.content,
      tokenCount: Math.ceil(chunk.content.length / 4),
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
    documentId: BigInt(documentId),
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
    .where(eq(documentTable.id, documentId));

  // 5. Update OCR job status
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

  console.log(`[Storage] Successfully stored ${vectorizedChunks.length} sections for document ${documentId}`);
}

/**
 * Mark OCR job as failed
 */
export async function markJobFailed(jobId: string, error: Error): Promise<void> {
  await db
    .update(ocrJobs)
    .set({
      status: "failed",
      completedAt: new Date(),
      errorMessage: error.message,
    })
    .where(eq(ocrJobs.id, jobId));
}

// ============================================================================
// Full Pipeline - Synchronous Processing
// ============================================================================

/**
 * Process a document synchronously (all steps in sequence)
 * Used when Inngest is disabled
 */
export async function processDocumentSync(
  eventData: ProcessDocumentEventData
): Promise<PipelineResult> {
  const { jobId, documentUrl, documentId, options } = eventData;
  const pipelineStartTime = Date.now();

  try {
    // Update job status to processing
    await db
      .update(ocrJobs)
      .set({
        status: "processing",
        startedAt: new Date(),
      })
      .where(eq(ocrJobs.id, jobId));

    // Step A: Router
    console.log(`[ProcessDocumentSync] Step A: Routing document ${documentId}`);
    const routerDecision = await routeDocument(documentUrl, options);

    // Step B: Normalize
    console.log(`[ProcessDocumentSync] Step B: Normalizing with ${routerDecision.selectedProvider}`);
    const normalizationResult = await normalizeDocument(documentUrl, routerDecision);

    // Step C: Chunking
    console.log(`[ProcessDocumentSync] Step C: Chunking ${normalizationResult.pages.length} pages`);
    const chunks = chunkPages(normalizationResult.pages);

    // Step D: Vectorize
    console.log(`[ProcessDocumentSync] Step D: Vectorizing ${chunks.length} chunks`);
    const vectorizedChunks = await vectorizeChunks(chunks);

    // Step E: Storage
    console.log(`[ProcessDocumentSync] Step E: Storing ${vectorizedChunks.length} chunks`);
    await storeDocument(documentId, jobId, vectorizedChunks, normalizationResult, pipelineStartTime);

    // Build result
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

    console.log(`[ProcessDocumentSync] Completed successfully in ${totalProcessingTime}ms`);
    return pipelineResult;
  } catch (error) {
    console.error(`[ProcessDocumentSync] Failed for job ${jobId}:`, error);
    await markJobFailed(jobId, error instanceof Error ? error : new Error(String(error)));
    
    return {
      success: false,
      jobId,
      documentId,
      chunks: [],
      metadata: {
        totalChunks: 0,
        textChunks: 0,
        tableChunks: 0,
        totalPages: 0,
        provider: "AZURE",
        processingTimeMs: Date.now() - pipelineStartTime,
        embeddingTimeMs: 0,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Process native PDF using pdf-parse (Node.js native)
 */
export async function processNativePDF(documentUrl: string): Promise<NormalizedDocument> {
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
      confidenceScore: 95,
    },
  };
}

/**
 * Process document with Azure Document Intelligence
 */
export async function processWithAzure(documentUrl: string): Promise<NormalizedDocument> {
  const adapter = createAzureAdapter();
  return adapter.uploadDocument(documentUrl);
}

/**
 * Process document with Landing.AI
 */
export async function processWithLandingAI(documentUrl: string): Promise<NormalizedDocument> {
  const adapter = createLandingAIAdapter();
  return adapter.uploadDocument(documentUrl);
}

