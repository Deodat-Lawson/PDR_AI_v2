/**
 * Landing.AI Adapter
 * Fallback OCR provider for complex documents (handwriting, messy layouts)
 * Maps Landing.AI DocAI responses to normalized PageContent structure
 */

import type {
  OCRAdapter,
  OCRAdapterOptions,
  NormalizedDocument,
  PageContent,
  ExtractedTable,
  OCRProvider,
} from "../types";

/**
 * Landing.AI API response types
 */
interface LandingAIResponse {
  request_id: string;
  status: "completed" | "processing" | "failed";
  result?: LandingAIResult;
  error?: string;
}

interface LandingAIResult {
  pages: LandingAIPage[];
  metadata: {
    total_pages: number;
    processing_time_ms: number;
    model_version: string;
  };
}

interface LandingAIPage {
  page_number: number;
  width: number;
  height: number;
  text_blocks: LandingAITextBlock[];
  tables: LandingAITable[];
  figures?: LandingAIFigure[];
  handwriting_detected?: boolean;
  confidence_score?: number;
}

interface LandingAITextBlock {
  id: string;
  text: string;
  bbox: LandingAIBBox;
  confidence: number;
  type: "paragraph" | "heading" | "list_item" | "caption" | "other";
}

interface LandingAITable {
  id: string;
  bbox: LandingAIBBox;
  rows: LandingAITableRow[];
  markdown?: string;
  html?: string;
  confidence: number;
}

interface LandingAITableRow {
  cells: LandingAITableCell[];
}

interface LandingAITableCell {
  text: string;
  row_span: number;
  col_span: number;
  is_header: boolean;
  confidence: number;
}

interface LandingAIFigure {
  id: string;
  bbox: LandingAIBBox;
  caption?: string;
  type: "chart" | "diagram" | "image" | "other";
}

interface LandingAIBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Landing.AI Document AI Adapter
 * Specialized for complex documents with handwriting, mixed layouts
 */
export class LandingAIAdapter implements OCRAdapter {
  private apiKey: string;
  private baseUrl = "https://api.landing.ai/v1/document";

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.LANDING_AI_API_KEY ?? "";

    if (!this.apiKey) {
      console.warn(
        "Landing.AI API key not configured. Adapter will fail on use."
      );
    }
  }

  getProviderName(): OCRProvider {
    return "LANDING_AI";
  }

  async uploadDocument(
    documentUrl: string,
    options?: OCRAdapterOptions
  ): Promise<NormalizedDocument> {
    if (!this.apiKey) {
      throw new Error(
        "Landing.AI API key not configured. Set LANDING_AI_API_KEY environment variable."
      );
    }

    const startTime = Date.now();

    // Submit document for analysis
    const requestId = await this.submitDocument(documentUrl, options);

    // Poll for completion
    const result = await this.pollForResult(requestId);

    if (!result.result) {
      throw new Error("Landing.AI analysis completed but no result returned");
    }

    // Normalize the response
    const pages = this.normalizePages(result.result);

    // Calculate overall confidence
    const avgConfidence = this.calculateAverageConfidence(result.result);

    // Detect if any handwriting was found
    const hasHandwriting = result.result.pages.some(
      (p) => p.handwriting_detected
    );

    return {
      pages,
      metadata: {
        totalPages: pages.length,
        provider: "LANDING_AI",
        processingTimeMs: Date.now() - startTime,
        confidenceScore: avgConfidence,
        hasHandwriting,
      },
    };
  }

  async extractPage(documentUrl: string, pageNumber: number): Promise<PageContent> {
    const document = await this.uploadDocument(documentUrl, {
      pages: [pageNumber],
    });

    const page = document.pages.find((p) => p.pageNumber === pageNumber);
    if (!page) {
      throw new Error(`Page ${pageNumber} not found in document`);
    }

    return page;
  }

  /**
   * Submit document to Landing.AI for processing
   */
  private async submitDocument(
    documentUrl: string,
    options?: OCRAdapterOptions
  ): Promise<string> {
    // Download the document first
    const docResponse = await fetch(documentUrl);
    if (!docResponse.ok) {
      throw new Error(`Failed to download document: ${docResponse.status}`);
    }

    const docBuffer = await docResponse.arrayBuffer();
    const blob = new Blob([docBuffer], { type: "application/pdf" });

    // Create form data
    const formData = new FormData();
    formData.append("file", blob, "document.pdf");

    // Add options
    if (options?.forceOCR) {
      formData.append("force_ocr", "true");
    }
    if (options?.pages && options.pages.length > 0) {
      formData.append("pages", options.pages.join(","));
    }
    if (options?.language) {
      formData.append("language", options.language);
    }

    // Enable all extractors for comprehensive analysis
    formData.append("extract_tables", "true");
    formData.append("extract_figures", "true");
    formData.append("detect_handwriting", "true");
    formData.append("output_format", "json");

    const response = await fetch(`${this.baseUrl}/extract`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Landing.AI submit failed: ${response.status} - ${errorText}`
      );
    }

    const data = (await response.json()) as { request_id: string };
    return data.request_id;
  }

  /**
   * Poll Landing.AI for analysis completion
   */
  private async pollForResult(
    requestId: string,
    maxPolls = 120,
    pollIntervalMs = 3000
  ): Promise<LandingAIResponse> {
    for (let attempt = 0; attempt < maxPolls; attempt++) {
      const response = await fetch(`${this.baseUrl}/status/${requestId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Landing.AI polling failed: ${response.status}`);
      }

      const result = (await response.json()) as LandingAIResponse;

      if (result.status === "completed") {
        return result;
      }

      if (result.status === "failed") {
        throw new Error(`Landing.AI analysis failed: ${result.error ?? "Unknown error"}`);
      }

      // Still processing, wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Landing.AI document analysis timed out");
  }

  /**
   * Normalize Landing.AI response to PageContent array
   */
  private normalizePages(result: LandingAIResult): PageContent[] {
    return result.pages.map((landingPage) => ({
      pageNumber: landingPage.page_number,
      textBlocks: this.extractTextBlocks(landingPage),
      tables: this.extractTables(landingPage),
    }));
  }

  /**
   * Extract text blocks from Landing.AI page
   */
  private extractTextBlocks(page: LandingAIPage): string[] {
    // Sort text blocks by vertical position for reading order
    const sortedBlocks = [...page.text_blocks].sort((a, b) => {
      // Sort primarily by Y position, then by X
      const yDiff = a.bbox.y - b.bbox.y;
      if (Math.abs(yDiff) > 10) return yDiff;
      return a.bbox.x - b.bbox.x;
    });

    return sortedBlocks
      .filter((block) => block.text.trim().length > 0)
      .map((block) => block.text.trim());
  }

  /**
   * Extract and convert tables from Landing.AI page
   */
  private extractTables(page: LandingAIPage): ExtractedTable[] {
    return page.tables.map((landingTable) => {
      // Convert to row/cell format
      const rows: string[][] = landingTable.rows.map((row) =>
        row.cells.map((cell) => cell.text.trim())
      );

      // Use provided markdown or generate our own
      const markdown = landingTable.markdown ?? this.tableToMarkdown(rows);

      return {
        rows,
        markdown,
        boundingBox: landingTable.bbox,
        rowCount: rows.length,
        columnCount: rows[0]?.length ?? 0,
      };
    });
  }

  /**
   * Convert table rows to clean markdown format
   */
  private tableToMarkdown(rows: string[][]): string {
    if (rows.length === 0) return "";

    const lines: string[] = [];

    // Header row
    const headerRow = rows[0];
    if (headerRow) {
      lines.push(`| ${headerRow.join(" | ")} |`);
      lines.push(`| ${headerRow.map(() => "---").join(" | ")} |`);
    }

    // Data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row) {
        lines.push(`| ${row.join(" | ")} |`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Calculate average confidence from all text blocks
   */
  private calculateAverageConfidence(result: LandingAIResult): number {
    let totalConfidence = 0;
    let count = 0;

    for (const page of result.pages) {
      // Include page-level confidence if available
      if (page.confidence_score) {
        totalConfidence += page.confidence_score;
        count++;
      }

      // Include text block confidence
      for (const block of page.text_blocks) {
        totalConfidence += block.confidence;
        count++;
      }

      // Include table confidence
      for (const table of page.tables) {
        totalConfidence += table.confidence;
        count++;
      }
    }

    if (count === 0) return 100;

    return Math.round((totalConfidence / count) * 100);
  }
}

/**
 * Factory function to create Landing.AI adapter
 */
export function createLandingAIAdapter(apiKey?: string): LandingAIAdapter {
  return new LandingAIAdapter(apiKey);
}

