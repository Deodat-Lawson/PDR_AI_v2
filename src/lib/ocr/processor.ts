/**
 * Document Processor Module
 * Shared processing logic for OCR-to-Vector pipeline
 * Can be used by both Inngest background jobs and synchronous processing
 */

import type { RoutingDecision } from "~/lib/ocr/complexity";
import { renderPagesToImages } from "~/lib/ocr/complexity";
import { enrichPageWithVlm } from "~/lib/ocr/enrichment";
import { createAzureAdapter, createLandingAIAdapter, createDatalabAdapter } from "~/lib/ocr/adapters";
import { chunkDocument, mergeWithEmbeddings, prepareForEmbedding, getTotalChunkSize } from "~/lib/ocr/chunker";
import { generateEmbeddings } from "~/lib/ai/embeddings";
import { db } from "~/server/db";
import {
  documentContextChunks,
  documentRetrievalChunks,
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

/** Office extensions that must go through the ingestion layer (not Azure OCR). */
const OFFICE_EXTENSIONS = [".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls"];

/**
 * True if the filename has a known Office extension. Used to route Office files
 * to the ingestion layer even when mimeType is missing.
 */
export function isKnownOfficeDocument(filename: string): boolean {
  const lower = filename.toLowerCase();
  return OFFICE_EXTENSIONS.some((ext) => lower.endsWith(ext));
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
      case "DATALAB":
        normalizedDoc = await processWithDatalab(documentUrl);
        break;
      default:
        normalizedDoc = await processWithAzure(documentUrl);
    }
  }

  // --- VLM Enrichment Step ---
  // Only applicable for PDFs where we can render pages to images.
  // Triggers:
  // 1. "Complex" / "Handwritten" label from Router
  // 2. Low OCR confidence (< 70%)
  // 3. Explicitly requested via options (future)
  
  const isPdf = documentUrl.toLowerCase().endsWith(".pdf") || 
                (await fetch(documentUrl, { method: "HEAD" }).then(r => r.headers.get("content-type") === "application/pdf").catch(() => false));

  if (isPdf && process.env.OPENAI_API_KEY) {
    const isComplex = routerDecision.visionLabel 
      ? ["complex", "handwritten", "messy", "figure", "diagram"].some(l => routerDecision.visionLabel?.toLowerCase().includes(l))
      : false;
    
    const isLowConfidence = (normalizedDoc.metadata.confidenceScore ?? 100) < 70;

    if (isComplex || isLowConfidence) {
      console.log(`[Enrichment] Triggering VLM enrichment (Complex=${isComplex}, LowConf=${isLowConfidence})`);
      try {
        const response = await fetch(documentUrl);
        const buffer = await response.arrayBuffer();
        
        // Identify pages to enrich (all for now, or sample? Plan says "Complex" or "Low Conf").
        // For efficiency, let's limit to the first 5 pages + any low confidence pages if we had per-page confidence (we have avg).
        // Let's enrich up to 5 pages for now to avoid massive costs/latency.
        const pagesToEnrich = normalizedDoc.pages.slice(0, 5).map(p => p.pageNumber);
        
        if (pagesToEnrich.length > 0) {
          console.log(`[Enrichment] Rendering ${pagesToEnrich.length} pages for VLM...`);
          const images = await renderPagesToImages(buffer, pagesToEnrich);
          
          for (let i = 0; i < images.length; i++) {
            const imageBuffer = images[i];
            if (!imageBuffer) continue;
            
            const pageNum = pagesToEnrich[i];
            console.log(`[Enrichment] Analyzing Page ${pageNum} with VLM...`);
            
            const description = await enrichPageWithVlm(Buffer.from(imageBuffer));
            if (description) {
               const page = normalizedDoc.pages.find(p => p.pageNumber === pageNum);
               if (page) {
                 page.textBlocks.push(`\n[Visual Description]: ${description}`);
                 console.log(`[Enrichment] Added description to Page ${pageNum}`);
               }
            }
          }
        }
      } catch (err) {
        console.warn("[Enrichment] Failed:", err);
      }
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
export async function chunkPages(pages: PageContent[]): Promise<DocumentChunk[]> {
  const pageSizes = pages.map((page, idx) => {
    const textLength = page.textBlocks.join("").length;
    return `Page ${idx + 1}: ${textLength} chars, ${page.textBlocks.length} blocks, ${page.tables.length} tables`;
  });
  console.log(`[Chunking] Page content sizes:\n${pageSizes.join("\n")}`);

  const documentChunks = await chunkDocument(pages, {
    parentMaxTokens: 1000,
    childMaxTokens: 256,
    overlapTokens: 50,
    includePageContext: true,
  });
  console.log(`[Chunking] Created ${documentChunks.length} Parent chunks`);

  documentChunks.forEach((chunk, idx) => {
    console.log(`[Chunking] Parent Chunk ${idx}: ${chunk.content.length} chars, ${chunk.children?.length ?? 0} children`);
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
  if (chunks.length === 0) {
    console.log("[Vectorize] No chunks to vectorize, returning empty");
    return [];
  }

  console.log(`[Vectorize] Preparing ${chunks.length} Parent chunks (and children) for embedding`);
  const contentStrings = prepareForEmbedding(chunks);
  console.log(`[Vectorize] Flattened to ${contentStrings.length} Child/Table chunks for embedding, total chars=${contentStrings.reduce((s, c) => s + c.length, 0)}`);

  const embedStart = Date.now();
  const embeddingResult = await generateEmbeddings(contentStrings, {
    batchSize: 20,
    model: "text-embedding-3-large",
    dimensions: 1536,
  });
  console.log(`[Vectorize] Embeddings generated: ${embeddingResult.embeddings.length} vectors (${Date.now() - embedStart}ms)`);

  const merged = mergeWithEmbeddings(chunks, embeddingResult.embeddings);
  console.log(`[Vectorize] Merged back into ${merged.length} Parent chunks`);
  return merged;
}

// ============================================================================
// Step E: Storage
// ============================================================================

/**
 * Stored section reference returned by storeDocument.
 * Used by downstream steps (e.g. Graph RAG entity extraction).
 */
export interface StoredSection {
  sectionId: number;
  content: string;
}

/**
 * Store vectorized chunks in the database.
 * Returns an array of { sectionId, content } for each inserted section (Context Chunk),
 * which downstream steps (e.g. entity extraction) can use.
 */
export async function storeDocument(
  documentId: number,
  jobId: string,
  vectorizedChunks: VectorizedChunk[],
  normalizationResult: NormalizationResult,
  pipelineStartTime: number
): Promise<StoredSection[]> {
  if (vectorizedChunks.length === 0) {
    console.log("[Storage] No chunks to store, skipping");
    return [];
  }

  const storeStart = Date.now();
  console.log(
    `[Storage] Storing ${vectorizedChunks.length} Parent chunks for docId=${documentId}, job=${jobId}, ` +
    `pages=${normalizationResult.pages.length}`
  );

  // 1. Create root document structure
  console.log("[Storage] 1/5 Creating root document structure...");
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

  // 2. Insert document context chunks (Parents) and retrieval chunks (Children)
  console.log(`[Storage] 2/5 Inserting ${vectorizedChunks.length} document context chunks...`);
  const storedSections: StoredSection[] = [];

  for (const chunk of vectorizedChunks) {
    const contentHash = crypto.createHash("sha256").update(chunk.content).digest("hex");
    const isTable = chunk.metadata.isTable;

    // Insert Parent (Context Chunk)
    const [row] = await db.insert(documentContextChunks).values({
      documentId: BigInt(documentId),
      structureId: BigInt(rootId),
      content: chunk.content,
      tokenCount: Math.ceil(chunk.content.length / 4),
      charCount: chunk.content.length,
      // Parent chunks might not have embeddings in this architecture
      // But if 'vector' is present and not empty, use it. In new chunker, parent vector is empty.
      embedding: chunk.vector && chunk.vector.length > 0 
          ? sql`${JSON.stringify(chunk.vector)}::vector(1536)` 
          : null,
      pageNumber: chunk.metadata.pageNumber,
      semanticType: isTable ? "tabular" : "narrative",
      contentHash,
    }).returning({ id: documentContextChunks.id });

    if (row) {
      storedSections.push({ sectionId: row.id, content: chunk.content });

      // Insert Children (Retrieval Chunks)
      if (chunk.children && chunk.children.length > 0) {
          for (const child of chunk.children) {
              await db.insert(documentRetrievalChunks).values({
                  contextChunkId: BigInt(row.id),
                  documentId: BigInt(documentId),
                  content: child.content,
                  tokenCount: Math.ceil(child.content.length / 4),
                  embedding: sql`${JSON.stringify(child.vector)}::vector(1536)`,
                  embeddingShort: child.vectorShort 
                      ? sql`${JSON.stringify(child.vectorShort)}::vector(512)` 
                      : null,
              });
          }
      }
    }
  }

  console.log(`[Storage] 2/5 Done: ${storedSections.length} context chunks inserted`);

  // 3. Create document metadata for planning layer
  console.log("[Storage] 3/5 Creating document metadata...");
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
  console.log("[Storage] 4/5 Updating document record...");
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
  console.log("[Storage] 5/5 Updating OCR job status...");
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

  console.log(
    `[Storage] Successfully stored ${storedSections.length} sections for docId=${documentId} (${Date.now() - storeStart}ms)`
  );

  return storedSections;
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
 * Used when Inngest is disabled.
 *
 * For PDFs this uses the existing 5-step routing pipeline.
 * For all other file types it delegates to the Source Adapter ingestion layer.
 */
export async function processDocumentSync(
  eventData: ProcessDocumentEventData
): Promise<PipelineResult> {
  const { jobId, documentUrl, documentId, documentName, companyId, mimeType, options } = eventData;
  const pipelineStartTime = Date.now();

  try {
    console.log(
      `[Processor] ========== START job=${jobId}, docId=${documentId} ==========\n` +
      `[Processor] name="${documentName}", url="${documentUrl.substring(0, 100)}", ` +
      `mime=${mimeType ?? "not provided"}, provider=${options?.preferredProvider ?? "auto"}, forceOCR=${options?.forceOCR ?? false}`
    );

    // Update job status to processing
    await db
      .update(ocrJobs)
      .set({
        status: "processing",
        startedAt: new Date(),
      })
      .where(eq(ocrJobs.id, jobId));

    // Detect whether the new ingestion layer should handle this file.
    // PDFs still go through the original pipeline.
    // Office files go through the original pipeline IF Azure is configured; otherwise ingestion.
    const isOffice = isKnownOfficeDocument(documentName);
    const hasAzure = !!process.env.AZURE_DOC_INTELLIGENCE_KEY && !!process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;

    const isPdfCandidate =
      !isOffice &&
      (!mimeType ||
        mimeType === "application/pdf" ||
        documentName.toLowerCase().endsWith(".pdf"));

    const useMainPipeline = isPdfCandidate || (isOffice && hasAzure);

    console.log(
      `[Processor] useMainPipeline=${useMainPipeline} (isPdf=${isPdfCandidate}, isOffice=${isOffice}, hasAzure=${hasAzure})`
    );

    let normalizationResult: NormalizationResult;

    if (useMainPipeline) {
      let routerDecision: RouterDecisionResult;

      if (isOffice) {
        console.log(`[Processor] Routing Office document to Azure (keys available)`);
        routerDecision = {
          isNativePDF: false,
          pageCount: 0, // Unknown until processed
          selectedProvider: "AZURE",
          confidence: 1.0,
          reason: "Office document processed via Azure",
        };
      } else {
        // --- Original PDF pipeline (Steps A + B) ---
        const stepAStart = Date.now();
        console.log(`[Processor] Step A: Routing PDF document ${documentId}...`);
        routerDecision = await routeDocument(documentUrl, options);
        console.log(
          `[Processor] Step A done (${Date.now() - stepAStart}ms): ` +
          `isNative=${routerDecision.isNativePDF}, provider=${routerDecision.selectedProvider}, ` +
          `pages=${routerDecision.pageCount}, confidence=${routerDecision.confidence}, ` +
          `vision=${routerDecision.visionLabel ?? "none"}, reason="${routerDecision.reason}"`
        );
      }

      const stepBStart = Date.now();
      console.log(`[Processor] Step B: Normalizing with ${routerDecision.selectedProvider}...`);
      normalizationResult = await normalizeDocument(documentUrl, routerDecision);
      console.log(
        `[Processor] Step B done (${Date.now() - stepBStart}ms): ` +
        `pages=${normalizationResult.pages.length}, provider=${normalizationResult.provider}, ` +
        `ocr_time=${normalizationResult.processingTimeMs}ms, confidence=${normalizationResult.confidenceScore ?? "N/A"}`
      );
    } else {
      // --- New ingestion layer for non-PDF files ---
      const ingestStart = Date.now();
      console.log(`[Processor] Using ingestion layer for mime=${mimeType ?? "unknown"}, name="${documentName}"`);
      const { ingestToNormalized } = await import("~/lib/ingestion");

      const normalizedDoc = await ingestToNormalized(documentUrl, {
        mimeType,
        filename: documentName,
        forceOCR: options?.forceOCR,
      });
      console.log(
        `[Processor] Ingestion done (${Date.now() - ingestStart}ms): ` +
        `pages=${normalizedDoc.pages.length}, provider=${normalizedDoc.metadata.provider}, ` +
        `processingTime=${normalizedDoc.metadata.processingTimeMs}ms`
      );

      normalizationResult = {
        pages: normalizedDoc.pages,
        provider: normalizedDoc.metadata.provider,
        processingTimeMs: normalizedDoc.metadata.processingTimeMs,
        confidenceScore: normalizedDoc.metadata.confidenceScore,
      };
    }

    // Step C: Chunking
    const stepCStart = Date.now();
    console.log(`[Processor] Step C: Chunking ${normalizationResult.pages.length} pages...`);
    const chunks = await chunkPages(normalizationResult.pages);
    console.log(`[Processor] Step C done (${Date.now() - stepCStart}ms): ${chunks.length} chunks`);

    // Step D: Vectorize
    const stepDStart = Date.now();
    console.log(`[Processor] Step D: Vectorizing ${chunks.length} chunks...`);
    const vectorizedChunks = await vectorizeChunks(chunks);
    console.log(`[Processor] Step D done (${Date.now() - stepDStart}ms): ${vectorizedChunks.length} vectors`);

    // Step E: Storage
    const stepEStart = Date.now();
    console.log(`[Processor] Step E: Storing ${vectorizedChunks.length} chunks for docId=${documentId}...`);
    const storedSections = await storeDocument(documentId, jobId, vectorizedChunks, normalizationResult, pipelineStartTime);
    console.log(`[Processor] Step E done (${Date.now() - stepEStart}ms)`);

    // Step F: Graph RAG entity extraction (when sidecar is available)
    if (process.env.SIDECAR_URL && storedSections.length > 0) {
      const stepFStart = Date.now();
      console.log(`[Processor] Step F: Extracting entities for ${storedSections.length} sections...`);
      try {
        // Health check first
        const healthy = await fetch(`${process.env.SIDECAR_URL}/health`)
          .then(r => r.ok)
          .catch(() => false);

        if (healthy) {
          const { extractAndStoreEntities } = await import("~/lib/ingestion/entity-extraction");
          const graphResult = await extractAndStoreEntities(
            storedSections,
            documentId,
            BigInt(companyId),
          );
          console.log(
            `[Processor] Step F done (${Date.now() - stepFStart}ms): ` +
            `${graphResult.totalEntities} entities, ${graphResult.totalRelationships} relationships`
          );
        } else {
          console.warn(`[Processor] Step F skipped: sidecar unhealthy (${Date.now() - stepFStart}ms)`);
        }
      } catch (error) {
        // Don't fail the pipeline for entity extraction errors
        console.warn(
          `[Processor] Step F failed (${Date.now() - stepFStart}ms), continuing:`,
          error instanceof Error ? error.message : error
        );
      }
    }

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

    console.log(
      `[Processor] ========== DONE job=${jobId}, docId=${documentId} (${totalProcessingTime}ms) ==========\n` +
      `[Processor] Summary: ${vectorizedChunks.length} vectors (${stats.textChunks} text, ${stats.tableChunks} tables), ` +
      `${normalizationResult.pages.length} pages, provider=${normalizationResult.provider}`
    );
    return pipelineResult;
  } catch (error) {
    const elapsed = Date.now() - pipelineStartTime;
    console.error(
      `[Processor] ========== FAILED job=${jobId}, docId=${documentId} (${elapsed}ms) ==========`,
      error
    );
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
        processingTimeMs: elapsed,
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

/**
 * Process document with Datalab
 */
export async function processWithDatalab(documentUrl: string): Promise<NormalizedDocument> {
  const adapter = createDatalabAdapter();
  return adapter.uploadDocument(documentUrl);
}
