import type {
  PageContent,
  DocumentChunk,
  ChunkMetadata,
  ExtractedTable,
} from "./types";

export interface ChunkingConfig {
  maxTokens?: number;
  overlapTokens?: number;
  charsPerToken?: number;
  includePageContext?: boolean;
}

const DEFAULT_CONFIG: Required<ChunkingConfig> = {
  maxTokens: 500,
  overlapTokens: 50,
  charsPerToken: 4,
  includePageContext: true,
};

export function chunkDocument(
  pages: PageContent[],
  config?: ChunkingConfig
): DocumentChunk[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const chunks: DocumentChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageChunks: DocumentChunk[] = [];

    const textChunks = chunkTextBlocks(page.textBlocks, page.pageNumber, cfg);
    pageChunks.push(...textChunks);

    const tableChunks = chunkTables(page.tables, page.pageNumber, cfg);
    pageChunks.push(...tableChunks);

    for (const chunk of pageChunks) {
      chunk.metadata.chunkIndex = globalChunkIndex++;
      chunk.metadata.totalChunksInPage = pageChunks.length;
      chunk.id = `page-${page.pageNumber}-chunk-${chunk.metadata.chunkIndex}`;
      chunks.push(chunk);
    }
  }

  return chunks;
}

function chunkTextBlocks(
  textBlocks: string[],
  pageNumber: number,
  config: Required<ChunkingConfig>
): DocumentChunk[] {
  if (textBlocks.length === 0) return [];

  const mergedText = textBlocks.join("\n\n");

  const maxChars = config.maxTokens * config.charsPerToken;
  const overlapChars = config.overlapTokens * config.charsPerToken;

  const textChunks = splitWithOverlap(mergedText, maxChars, overlapChars);

  return textChunks.map((content, index) => ({
    id: "",
    content,
    type: "text" as const,
    metadata: {
      pageNumber,
      chunkIndex: index,
      totalChunksInPage: 0,
      isTable: false,
    },
  }));
}

function chunkTables(
  tables: ExtractedTable[],
  pageNumber: number,
  _config: Required<ChunkingConfig>
): DocumentChunk[] {
  return tables.map((table, tableIndex) => {
    const tableDescription = generateTableDescription(table, pageNumber, tableIndex);

    const content = `${tableDescription}\n\n${table.markdown}`;

    return {
      id: "",
      content,
      type: "table" as const,
      metadata: {
        pageNumber,
        chunkIndex: 0,
        totalChunksInPage: 0,
        isTable: true,
        tableIndex,
        tableDescription,
      },
    };
  });
}

function generateTableDescription(
  table: ExtractedTable,
  pageNumber: number,
  tableIndex: number
): string {
  const headers = table.rows[0];
  let contentDescription = "structured data";

  if (headers && headers.length > 0) {
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
      contentDescription = `data about ${headers.slice(0, 3).join(", ")}`;
    }
  }

  const sizeDescription = `${table.rowCount} rows × ${table.columnCount} columns`;

  return `Table from Page ${pageNumber} (Table ${tableIndex + 1}) containing ${contentDescription}. Size: ${sizeDescription}.`;
}

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

    if (end < text.length) {
      const searchStart = Math.max(start, end - Math.floor(maxChars * 0.2));
      const searchRegion = text.slice(searchStart, end);

      const sentenceMatch = searchRegion.match(/[.!?]\s+(?=[A-Z])/g);
      if (sentenceMatch) {
        const lastMatch = searchRegion.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]!);
        if (lastMatch !== -1) {
          end = searchStart + lastMatch + 2;
        }
      } else {
        const lastSpace = text.lastIndexOf(" ", end);
        if (lastSpace > start + maxChars * 0.5) {
          end = lastSpace;
        }
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Calculate next start position with overlap
    const newStart = end - overlapChars;

    // CRITICAL: Always ensure forward progress to prevent infinite loop
    // newStart must be strictly greater than start, not just >= 
    if (newStart > start && newStart < text.length) {
      start = newStart;
    } else {
      // If we can't make progress with overlap, just move to end
      start = end;
    }

    // Safety check: if we're not at the end but haven't moved, force progress
    if (start === end && start < text.length) {
      start = Math.min(start + 1, text.length);
    }
  }

  return chunks;
}

export function estimateTokens(text: string, charsPerToken = 4): number {
  return Math.ceil(text.length / charsPerToken);
}

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

export function prepareForEmbedding(chunks: DocumentChunk[]): string[] {
  return chunks.map((chunk) => chunk.content);
}

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

