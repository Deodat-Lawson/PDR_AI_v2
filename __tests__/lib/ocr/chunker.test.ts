import {
  chunkDocument,
  estimateTokens,
  getTotalChunkSize,
  prepareForEmbedding,
  mergeWithEmbeddings,
  type ChunkingConfig,
} from "~/lib/ocr/chunker";
import type { PageContent, DocumentChunk, ExtractedTable } from "~/lib/ocr/types";

describe("OCR Chunker Module", () => {
  // Helper to create mock page content
  const createMockPage = (
    pageNumber: number,
    textBlocks: string[] = [],
    tables: ExtractedTable[] = []
  ): PageContent => ({
    pageNumber,
    textBlocks,
    tables,
  });

  // Helper to create mock table
  const createMockTable = (
    rows: string[][],
    markdown: string
  ): ExtractedTable => ({
    rows,
    markdown,
    rowCount: rows.length,
    columnCount: rows[0]?.length ?? 0,
  });

  describe("chunkDocument", () => {
    it("should return empty array for empty pages", () => {
      const result = chunkDocument([]);
      expect(result).toEqual([]);
    });

    it("should return empty array for page with no content", () => {
      const pages = [createMockPage(1, [], [])];
      const result = chunkDocument(pages);
      expect(result).toEqual([]);
    });

    it("should create text chunks from text blocks", () => {
      const pages = [
        createMockPage(1, ["This is some sample text.", "Another paragraph."]),
      ];
      const result = chunkDocument(pages);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.type).toBe("text");
      expect(result[0]?.metadata.pageNumber).toBe(1);
      expect(result[0]?.metadata.isTable).toBe(false);
    });

    it("should create table chunks from tables", () => {
      const table = createMockTable(
        [
          ["Name", "Age"],
          ["Alice", "30"],
          ["Bob", "25"],
        ],
        "| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |"
      );
      const pages = [createMockPage(1, [], [table])];
      const result = chunkDocument(pages);

      expect(result.length).toBe(1);
      expect(result[0]?.type).toBe("table");
      expect(result[0]?.metadata.isTable).toBe(true);
      expect(result[0]?.metadata.tableIndex).toBe(0);
    });

    it("should handle mixed text and table content", () => {
      const table = createMockTable(
        [["Header"]],
        "| Header |\n|--------|\n"
      );
      const pages = [createMockPage(1, ["Some text content"], [table])];
      const result = chunkDocument(pages);

      const textChunks = result.filter((c) => c.type === "text");
      const tableChunks = result.filter((c) => c.type === "table");

      expect(textChunks.length).toBeGreaterThanOrEqual(1);
      expect(tableChunks.length).toBe(1);
    });

    it("should assign unique IDs to each chunk", () => {
      const pages = [
        createMockPage(1, ["Text on page 1"]),
        createMockPage(2, ["Text on page 2"]),
      ];
      const result = chunkDocument(pages);

      const ids = result.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should maintain correct page numbers across multiple pages", () => {
      const pages = [
        createMockPage(1, ["Page 1 content"]),
        createMockPage(2, ["Page 2 content"]),
        createMockPage(3, ["Page 3 content"]),
      ];
      const result = chunkDocument(pages);

      const pageNumbers = result.map((c) => c.metadata.pageNumber);
      expect(pageNumbers).toContain(1);
      expect(pageNumbers).toContain(2);
      expect(pageNumbers).toContain(3);
    });

    it("should respect custom chunking configuration", () => {
      const longText = "A".repeat(5000);
      const pages = [createMockPage(1, [longText])];

      const smallConfig: ChunkingConfig = {
        maxTokens: 100,
        overlapTokens: 10,
        charsPerToken: 4,
      };

      const largeConfig: ChunkingConfig = {
        maxTokens: 2000,
        overlapTokens: 50,
        charsPerToken: 4,
      };

      const smallChunks = chunkDocument(pages, smallConfig);
      const largeChunks = chunkDocument(pages, largeConfig);

      // Smaller max tokens should result in more chunks
      expect(smallChunks.length).toBeGreaterThan(largeChunks.length);
    });

    it("should increment global chunk index across pages", () => {
      const pages = [
        createMockPage(1, ["Text 1"]),
        createMockPage(2, ["Text 2"]),
      ];
      const result = chunkDocument(pages);

      const chunkIndices = result.map((c) => c.metadata.chunkIndex);
      // Check that indices are sequential
      for (let i = 0; i < chunkIndices.length; i++) {
        expect(chunkIndices[i]).toBe(i);
      }
    });

    it("should generate table descriptions based on header content", () => {
      const financialTable = createMockTable(
        [
          ["Item", "Price", "Amount"],
          ["Widget", "$10", "5"],
        ],
        "| Item | Price | Amount |"
      );
      const pages = [createMockPage(1, [], [financialTable])];
      const result = chunkDocument(pages);

      expect(result[0]?.content).toContain("Table from Page 1");
      expect(result[0]?.metadata.tableDescription).toBeDefined();
    });
  });

  describe("estimateTokens", () => {
    it("should estimate tokens based on character count", () => {
      const text = "Hello world"; // 11 characters
      const tokens = estimateTokens(text);
      // Default is 4 chars per token: ceil(11/4) = 3
      expect(tokens).toBe(3);
    });

    it("should return 0 for empty string", () => {
      expect(estimateTokens("")).toBe(0);
    });

    it("should use custom chars per token when provided", () => {
      const text = "Hello world"; // 11 characters
      const tokens = estimateTokens(text, 2);
      // 2 chars per token: ceil(11/2) = 6
      expect(tokens).toBe(6);
    });

    it("should handle long text correctly", () => {
      const text = "A".repeat(1000);
      const tokens = estimateTokens(text, 4);
      expect(tokens).toBe(250);
    });

    it("should round up for partial tokens", () => {
      const text = "ABC"; // 3 characters
      const tokens = estimateTokens(text, 4);
      // ceil(3/4) = 1
      expect(tokens).toBe(1);
    });
  });

  describe("getTotalChunkSize", () => {
    it("should return zeros for empty chunk array", () => {
      const result = getTotalChunkSize([]);
      expect(result.totalChunks).toBe(0);
      expect(result.textChunks).toBe(0);
      expect(result.tableChunks).toBe(0);
      expect(result.totalCharacters).toBe(0);
    });

    it("should count text and table chunks separately", () => {
      const chunks: DocumentChunk[] = [
        {
          id: "1",
          content: "Text content",
          type: "text",
          metadata: {
            pageNumber: 1,
            chunkIndex: 0,
            totalChunksInPage: 2,
            isTable: false,
          },
        },
        {
          id: "2",
          content: "Table content",
          type: "table",
          metadata: {
            pageNumber: 1,
            chunkIndex: 1,
            totalChunksInPage: 2,
            isTable: true,
          },
        },
      ];

      const result = getTotalChunkSize(chunks);
      expect(result.totalChunks).toBe(2);
      expect(result.textChunks).toBe(1);
      expect(result.tableChunks).toBe(1);
    });

    it("should calculate total characters correctly", () => {
      const chunks: DocumentChunk[] = [
        {
          id: "1",
          content: "12345",
          type: "text",
          metadata: {
            pageNumber: 1,
            chunkIndex: 0,
            totalChunksInPage: 1,
            isTable: false,
          },
        },
        {
          id: "2",
          content: "67890",
          type: "text",
          metadata: {
            pageNumber: 1,
            chunkIndex: 1,
            totalChunksInPage: 1,
            isTable: false,
          },
        },
      ];

      const result = getTotalChunkSize(chunks);
      expect(result.totalCharacters).toBe(10);
    });

    it("should estimate tokens from total characters", () => {
      const chunks: DocumentChunk[] = [
        {
          id: "1",
          content: "A".repeat(100),
          type: "text",
          metadata: {
            pageNumber: 1,
            chunkIndex: 0,
            totalChunksInPage: 1,
            isTable: false,
          },
        },
      ];

      const result = getTotalChunkSize(chunks);
      expect(result.totalCharacters).toBe(100);
      expect(result.estimatedTokens).toBeGreaterThan(0);
    });
  });

  describe("prepareForEmbedding", () => {
    it("should extract content from chunks", () => {
      const chunks: DocumentChunk[] = [
        {
          id: "1",
          content: "First content",
          type: "text",
          metadata: {
            pageNumber: 1,
            chunkIndex: 0,
            totalChunksInPage: 1,
            isTable: false,
          },
        },
        {
          id: "2",
          content: "Second content",
          type: "text",
          metadata: {
            pageNumber: 1,
            chunkIndex: 1,
            totalChunksInPage: 1,
            isTable: false,
          },
        },
      ];

      const result = prepareForEmbedding(chunks);
      expect(result).toEqual(["First content", "Second content"]);
    });

    it("should return empty array for empty chunks", () => {
      const result = prepareForEmbedding([]);
      expect(result).toEqual([]);
    });

    it("should preserve content order", () => {
      const chunks: DocumentChunk[] = [
        {
          id: "1",
          content: "A",
          type: "text",
          metadata: { pageNumber: 1, chunkIndex: 0, totalChunksInPage: 1, isTable: false },
        },
        {
          id: "2",
          content: "B",
          type: "text",
          metadata: { pageNumber: 1, chunkIndex: 1, totalChunksInPage: 1, isTable: false },
        },
        {
          id: "3",
          content: "C",
          type: "text",
          metadata: { pageNumber: 1, chunkIndex: 2, totalChunksInPage: 1, isTable: false },
        },
      ];

      const result = prepareForEmbedding(chunks);
      expect(result).toEqual(["A", "B", "C"]);
    });
  });

  describe("mergeWithEmbeddings", () => {
    it("should merge chunks with embeddings correctly", () => {
      const chunks: DocumentChunk[] = [
        {
          id: "1",
          content: "Content 1",
          type: "text",
          metadata: {
            pageNumber: 1,
            chunkIndex: 0,
            totalChunksInPage: 1,
            isTable: false,
          },
        },
      ];
      const embeddings = [[0.1, 0.2, 0.3]];

      const result = mergeWithEmbeddings(chunks, embeddings);

      expect(result.length).toBe(1);
      expect(result[0]?.content).toBe("Content 1");
      expect(result[0]?.vector).toEqual([0.1, 0.2, 0.3]);
      expect(result[0]?.metadata.pageNumber).toBe(1);
    });

    it("should throw error when chunk and embedding counts mismatch", () => {
      const chunks: DocumentChunk[] = [
        {
          id: "1",
          content: "Content",
          type: "text",
          metadata: { pageNumber: 1, chunkIndex: 0, totalChunksInPage: 1, isTable: false },
        },
        {
          id: "2",
          content: "Content 2",
          type: "text",
          metadata: { pageNumber: 1, chunkIndex: 1, totalChunksInPage: 1, isTable: false },
        },
      ];
      const embeddings = [[0.1, 0.2]]; // Only 1 embedding for 2 chunks

      expect(() => mergeWithEmbeddings(chunks, embeddings)).toThrow(
        "Mismatch: 2 chunks but 1 embeddings"
      );
    });

    it("should handle empty inputs", () => {
      const result = mergeWithEmbeddings([], []);
      expect(result).toEqual([]);
    });

    it("should preserve all metadata fields", () => {
      const chunks: DocumentChunk[] = [
        {
          id: "test-id",
          content: "Test content",
          type: "table",
          metadata: {
            pageNumber: 5,
            chunkIndex: 3,
            totalChunksInPage: 10,
            isTable: true,
            tableIndex: 2,
            tableDescription: "Financial data table",
          },
        },
      ];
      const embeddings = [[1, 2, 3, 4, 5]];

      const result = mergeWithEmbeddings(chunks, embeddings);

      expect(result[0]?.metadata).toEqual({
        pageNumber: 5,
        chunkIndex: 3,
        totalChunksInPage: 10,
        isTable: true,
        tableIndex: 2,
        tableDescription: "Financial data table",
      });
    });
  });

  describe("Text Splitting with Overlap", () => {
    it("should not split short text", () => {
      const pages = [createMockPage(1, ["Short text"])];
      const result = chunkDocument(pages, {
        maxTokens: 1000,
        overlapTokens: 50,
      });

      expect(result.length).toBe(1);
      expect(result[0]?.content).toBe("Short text");
    });

    it("should split long text into multiple chunks", () => {
      // Create text that exceeds default max (500 tokens * 4 chars = 2000 chars)
      const longText = "A".repeat(3000);
      const pages = [createMockPage(1, [longText])];
      const result = chunkDocument(pages);

      expect(result.length).toBeGreaterThan(1);
    });

    it("should handle text with sentence boundaries", () => {
      const text = "First sentence. Second sentence. Third sentence. Fourth sentence.";
      const pages = [createMockPage(1, [text])];
      const result = chunkDocument(pages, {
        maxTokens: 10,
        overlapTokens: 2,
        charsPerToken: 4,
      });

      // Should create multiple chunks
      expect(result.length).toBeGreaterThan(0);
      // Each chunk should be non-empty
      result.forEach((chunk) => {
        expect(chunk.content.length).toBeGreaterThan(0);
      });
    });

    it("should handle text without proper sentence boundaries", () => {
      const text = "word ".repeat(500);
      const pages = [createMockPage(1, [text.trim()])];
      const result = chunkDocument(pages, {
        maxTokens: 50,
        overlapTokens: 5,
        charsPerToken: 4,
      });

      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe("Table Description Generation", () => {
    it("should identify financial tables", () => {
      const table = createMockTable(
        [
          ["Product", "Price", "Cost"],
          ["Widget", "$100", "$50"],
        ],
        "| Product | Price | Cost |"
      );
      const pages = [createMockPage(1, [], [table])];
      const result = chunkDocument(pages);

      expect(result[0]?.metadata.tableDescription).toContain(
        "financial or pricing data"
      );
    });

    it("should identify time-series tables", () => {
      const table = createMockTable(
        [
          ["Date", "Value"],
          ["2024-01-01", "100"],
        ],
        "| Date | Value |"
      );
      const pages = [createMockPage(1, [], [table])];
      const result = chunkDocument(pages);

      expect(result[0]?.metadata.tableDescription).toContain(
        "time-series or dated information"
      );
    });

    it("should identify personnel tables", () => {
      const table = createMockTable(
        [
          ["Name", "Role", "Department"],
          ["John", "Engineer", "Tech"],
        ],
        "| Name | Role | Department |"
      );
      const pages = [createMockPage(1, [], [table])];
      const result = chunkDocument(pages);

      expect(result[0]?.metadata.tableDescription).toContain(
        "personnel or organizational information"
      );
    });

    it("should identify inventory tables", () => {
      const table = createMockTable(
        [
          ["SKU", "Product", "Quantity"],
          ["001", "Widget", "50"],
        ],
        "| SKU | Product | Quantity |"
      );
      const pages = [createMockPage(1, [], [table])];
      const result = chunkDocument(pages);

      expect(result[0]?.metadata.tableDescription).toContain(
        "inventory or product listing"
      );
    });

    it("should identify procedural tables", () => {
      const table = createMockTable(
        [
          ["Step", "Action", "Notes"],
          ["1", "Initialize", "Required"],
        ],
        "| Step | Action | Notes |"
      );
      const pages = [createMockPage(1, [], [table])];
      const result = chunkDocument(pages);

      expect(result[0]?.metadata.tableDescription).toContain(
        "procedural steps or instructions"
      );
    });

    it("should include table dimensions in description", () => {
      const table = createMockTable(
        [
          ["A", "B", "C"],
          ["1", "2", "3"],
          ["4", "5", "6"],
        ],
        "| A | B | C |"
      );
      const pages = [createMockPage(1, [], [table])];
      const result = chunkDocument(pages);

      expect(result[0]?.metadata.tableDescription).toContain("3 rows");
      expect(result[0]?.metadata.tableDescription).toContain("3 columns");
    });
  });

  describe("Edge Cases", () => {
    it("should handle page with only whitespace text", () => {
      const pages = [createMockPage(1, ["   ", "\n\n", "\t"])];
      const result = chunkDocument(pages);
      // Whitespace-only content should result in empty or whitespace chunks
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it("should handle table with empty rows", () => {
      const table = createMockTable([], "");
      const pages = [createMockPage(1, [], [table])];
      const result = chunkDocument(pages);
      // Should still create a chunk for the table
      expect(result.length).toBe(1);
    });

    it("should handle very large page numbers", () => {
      const pages = [createMockPage(9999, ["Content"])];
      const result = chunkDocument(pages);
      expect(result[0]?.metadata.pageNumber).toBe(9999);
    });

    it("should handle unicode content", () => {
      const pages = [createMockPage(1, ["Unicode: \u4e2d\u6587 \u65e5\u672c\u8a9e \ud83d\ude00"])];
      const result = chunkDocument(pages);
      expect(result[0]?.content).toContain("\u4e2d\u6587");
    });

    it("should handle multiple tables on same page", () => {
      const table1 = createMockTable([["A"]], "| A |");
      const table2 = createMockTable([["B"]], "| B |");
      const table3 = createMockTable([["C"]], "| C |");
      const pages = [createMockPage(1, [], [table1, table2, table3])];
      const result = chunkDocument(pages);

      const tableChunks = result.filter((c) => c.type === "table");
      expect(tableChunks.length).toBe(3);
      expect(tableChunks[0]?.metadata.tableIndex).toBe(0);
      expect(tableChunks[1]?.metadata.tableIndex).toBe(1);
      expect(tableChunks[2]?.metadata.tableIndex).toBe(2);
    });
  });
});
