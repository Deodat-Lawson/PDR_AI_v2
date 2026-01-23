/**
 * Intelligent Document Chunker
 * Implements the chunking rules:
 * - Rule 1 (Text): Merge text blocks, split by ~500 tokens with 50 token overlap
 * - Rule 2 (Tables): Tables MUST be isolated chunks
 * - Context Injection: Prepend descriptive context to table chunks
 */

import type {
  PageContent,
  DocumentChunk,
  ChunkMetadata,
  ExtractedTable,
} from "./types";

/**
 * Chunking configuration
 */
export interface ChunkingConfig {
  /** Maximum tokens per text chunk (default: 500) */
  maxTokens?: number;
  /** Token overlap between chunks (default: 50) */
  overlapTokens?: number;
  /** Approximate characters per token (default: 4) */
  charsPerToken?: number;
  /** Include page context in table descriptions */
  includePageContext?: boolean;
}

const DEFAULT_CONFIG: Required<ChunkingConfig> = {
  maxTokens: 500,
  overlapTokens: 50,
  charsPerToken: 4, // Average for English text
  includePageContext: true,
};

/**
 * Main chunking function
 * Takes normalized pages and returns chunks ready for embedding
 */
export function chunkDocument(
  pages: PageContent[],
  config?: ChunkingConfig
): DocumentChunk[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const chunks: DocumentChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageChunks: DocumentChunk[] = [];

    // Process text blocks
    const textChunks = chunkTextBlocks(page.textBlocks, page.pageNumber, cfg);
    pageChunks.push(...textChunks);

    // Process tables - each table is an isolated chunk
    const tableChunks = chunkTables(page.tables, page.pageNumber, cfg);
    pageChunks.push(...tableChunks);

    // Assign chunk indices and add to result
    for (const chunk of pageChunks) {
      chunk.metadata.chunkIndex = globalChunkIndex++;
      chunk.metadata.totalChunksInPage = pageChunks.length;
      chunk.id = `page-${page.pageNumber}-chunk-${chunk.metadata.chunkIndex}`;
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * Chunk text blocks with token-based splitting and overlap
 */
function chunkTextBlocks(
  textBlocks: string[],
  pageNumber: number,
  config: Required<ChunkingConfig>
): DocumentChunk[] {
  if (textBlocks.length === 0) return [];

  // Merge all text blocks into a single string
  const mergedText = textBlocks.join("\n\n");

  // Convert token limits to character limits
  const maxChars = config.maxTokens * config.charsPerToken;
  const overlapChars = config.overlapTokens * config.charsPerToken;

  // Split by character count with overlap
  const textChunks = splitWithOverlap(mergedText, maxChars, overlapChars);

  return textChunks.map((content, index) => ({
    id: "", // Will be assigned later
    content,
    type: "text" as const,
    metadata: {
      pageNumber,
      chunkIndex: index,
      totalChunksInPage: 0, // Will be updated later
      isTable: false,
    },
  }));
}

/**
 * Create isolated chunks for tables with context injection
 */
function chunkTables(
  tables: ExtractedTable[],
  pageNumber: number,
  _config: Required<ChunkingConfig>
): DocumentChunk[] {
  return tables.map((table, tableIndex) => {
    // Generate table description for context injection
    const tableDescription = generateTableDescription(table, pageNumber, tableIndex);

    // The chunk content is the markdown with context prepended
    const content = `${tableDescription}\n\n${table.markdown}`;

    return {
      id: "", // Will be assigned later
      content,
      type: "table" as const,
      metadata: {
        pageNumber,
        chunkIndex: 0, // Will be updated later
        totalChunksInPage: 0, // Will be updated later
        isTable: true,
        tableIndex,
        tableDescription,
      },
    };
  });
}

/**
 * Generate descriptive context for a table
 * This improves retrieval by adding semantic context
 */
function generateTableDescription(
  table: ExtractedTable,
  pageNumber: number,
  tableIndex: number
): string {
  // Try to infer table content from headers
  const headers = table.rows[0];
  let contentDescription = "structured data";

  if (headers && headers.length > 0) {
    // Look for common patterns in headers
    const headerText = headers.join(" ").toLowerCase();

    if (headerText.includes("date") || headerText.includes("time")) {
      contentDescription = "time-series or dated information";
    } else if (headerText.includes("price") || headerText.includes("cost") || headerText.includes("amount")) {
      contentDescription = "financial or pricing data";
    } else if (headerText.includes("name") && (headerText.includes("role") || headerText.includes("title"))) {
      contentDescription = "personnel or organizational information";
    } else if (headerText.includes("item") || headerText.includes("product") || headerText.includes("sku")) {
      contentDescription = "inventory or product listing";
    } else if (headerText.includes("step") || headerText.includes("action") || headerText.includes("procedure")) {
      contentDescription = "procedural steps or instructions";
    } else if (headers.length <= 3) {
      // For simple tables, use header names directly
      contentDescription = `data about ${headers.slice(0, 3).join(", ")}`;
    }
  }

  const sizeDescription = `${table.rowCount} rows × ${table.columnCount} columns`;

  return `Table from Page ${pageNumber} (Table ${tableIndex + 1}) containing ${contentDescription}. Size: ${sizeDescription}.`;
}

/**
 * Split text into chunks with overlap
 * Uses sentence boundaries when possible for cleaner splits
 */
function splitWithOverlap(
  text: string,
  maxChars: number,
  overlapChars: number
): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);

    // If we're not at the end, try to find a good break point
    if (end < text.length) {
      // Look for sentence boundaries (. ! ?) within the last 20% of the chunk
      const searchStart = Math.max(start, end - Math.floor(maxChars * 0.2));
      const searchRegion = text.slice(searchStart, end);

      // Find the last sentence boundary
      const sentenceMatch = searchRegion.match(/[.!?]\s+(?=[A-Z])/g);
      if (sentenceMatch) {
        const lastMatch = searchRegion.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]!);
        if (lastMatch !== -1) {
          end = searchStart + lastMatch + 2; // Include the punctuation and space
        }
      } else {
        // Fall back to word boundary
        const lastSpace = text.lastIndexOf(" ", end);
        if (lastSpace > start + maxChars * 0.5) {
          end = lastSpace;
        }
      }
    }

    chunks.push(text.slice(start, end).trim());

    // Move start forward, accounting for overlap
    const newStart = end - overlapChars;

    // Ensure we make progress (don't get stuck)
    if (newStart >= start && newStart < text.length) {
      start = newStart;
    } else {
      start = end;
    }
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Utility: Estimate token count for a string
 */
export function estimateTokens(text: string, charsPerToken = 4): number {
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Utility: Get total content size across all chunks
 */
export function getTotalChunkSize(chunks: DocumentChunk[]): {
  totalChunks: number;
  textChunks: number;
  tableChunks: number;
  totalCharacters: number;
  estimatedTokens: number;
} {
  const textChunks = chunks.filter((c) => c.type === "text");
  const tableChunks = chunks.filter((c) => c.type === "table");
  const totalCharacters = chunks.reduce((sum, c) => sum + c.content.length, 0);

  return {
    totalChunks: chunks.length,
    textChunks: textChunks.length,
    tableChunks: tableChunks.length,
    totalCharacters,
    estimatedTokens: estimateTokens(totalCharacters.toString()),
  };
}

/**
 * Prepare chunks for batch embedding
 * Returns just the content strings in the order they should be embedded
 */
export function prepareForEmbedding(chunks: DocumentChunk[]): string[] {
  return chunks.map((chunk) => chunk.content);
}

/**
 * Merge chunks with their embeddings
 */
export function mergeWithEmbeddings(
  chunks: DocumentChunk[],
  embeddings: number[][]
): Array<{ content: string; metadata: ChunkMetadata; vector: number[] }> {
  if (chunks.length !== embeddings.length) {
    throw new Error(
      `Mismatch: ${chunks.length} chunks but ${embeddings.length} embeddings`
    );
  }

  return chunks.map((chunk, index) => ({
    content: chunk.content,
    metadata: chunk.metadata,
    vector: embeddings[index]!,
  }));
}

