/**
 * Azure Document Intelligence Adapter
 * Maps Azure Layout API responses to normalized PageContent structure
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
 * Azure Document Intelligence API response types
 */
interface AzureAnalyzeResult {
  apiVersion: string;
  modelId: string;
  content: string;
  pages: AzurePage[];
  tables?: AzureTable[];
  paragraphs?: AzureParagraph[];
}

interface AzurePage {
  pageNumber: number;
  width: number;
  height: number;
  unit: string;
  lines?: AzureLine[];
  words?: AzureWord[];
  spans: AzureSpan[];
}

interface AzureLine {
  content: string;
  boundingBox: number[];
  spans: AzureSpan[];
}

interface AzureWord {
  content: string;
  boundingBox: number[];
  confidence: number;
  span: AzureSpan;
}

interface AzureSpan {
  offset: number;
  length: number;
}

interface AzureTable {
  rowCount: number;
  columnCount: number;
  boundingRegions: AzureBoundingRegion[];
  cells: AzureTableCell[];
  spans: AzureSpan[];
}

interface AzureBoundingRegion {
  pageNumber: number;
  boundingBox: number[];
}

interface AzureTableCell {
  kind?: string;
  rowIndex: number;
  columnIndex: number;
  rowSpan?: number;
  columnSpan?: number;
  content: string;
  boundingRegions: AzureBoundingRegion[];
  spans: AzureSpan[];
}

interface AzureParagraph {
  content: string;
  boundingRegions: AzureBoundingRegion[];
  spans: AzureSpan[];
  role?: string;
}

interface AzureOperationResponse {
  status: "notStarted" | "running" | "succeeded" | "failed";
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult?: AzureAnalyzeResult;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Azure Document Intelligence Adapter
 * Uses the Layout model for comprehensive document analysis
 */
export class AzureDocumentIntelligenceAdapter implements OCRAdapter {
  private endpoint: string;
  private apiKey: string;
  private apiVersion = "2024-11-30"; // Latest stable version

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint ?? process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT ?? "";
    this.apiKey = apiKey ?? process.env.AZURE_DOC_INTELLIGENCE_KEY ?? "";

    if (!this.endpoint || !this.apiKey) {
      console.warn(
        "Azure Document Intelligence credentials not configured. Adapter will fail on use."
      );
    }
  }

  getProviderName(): OCRProvider {
    return "AZURE";
  }

  async processDocument(
    documentUrl: string,
    options?: OCRAdapterOptions
  ): Promise<NormalizedDocument> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error(
        "Azure Document Intelligence credentials not configured. " +
        "Set AZURE_DOC_INTELLIGENCE_ENDPOINT and AZURE_DOC_INTELLIGENCE_KEY environment variables."
      );
    }

    const startTime = Date.now();

    // Submit document for analysis
    const operationLocation = await this.submitForAnalysis(documentUrl, options);

    // Poll for completion
    const result = await this.pollForResult(operationLocation);

    if (!result.analyzeResult) {
      throw new Error("Azure analysis completed but no result returned");
    }

    // Normalize the response
    const pages = this.normalizePages(result.analyzeResult);

    return {
      pages,
      metadata: {
        totalPages: pages.length,
        provider: "AZURE",
        processingTimeMs: Date.now() - startTime,
        confidenceScore: this.calculateAverageConfidence(result.analyzeResult),
      },
    };
  }

  async extractPage(documentUrl: string, pageNumber: number): Promise<PageContent> {
    const document = await this.processDocument(documentUrl, {
      pages: [pageNumber],
    });

    const page = document.pages.find((p) => p.pageNumber === pageNumber);
    if (!page) {
      throw new Error(`Page ${pageNumber} not found in document`);
    }

    return page;
  }

  /**
   * Submit document to Azure for analysis
   */
  private async submitForAnalysis(
    documentUrl: string,
    options?: OCRAdapterOptions
  ): Promise<string> {
    const modelId = "prebuilt-layout"; // Use layout model for tables + text
    const url = `${this.endpoint}/documentintelligence/documentModels/${modelId}:analyze?api-version=${this.apiVersion}`;

    const queryParams = new URLSearchParams();
    if (options?.pages && options.pages.length > 0) {
      queryParams.set("pages", options.pages.join(","));
    }

    const fullUrl = queryParams.toString() ? `${url}&${queryParams}` : url;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urlSource: documentUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Azure Document Intelligence submit failed: ${response.status} - ${errorText}`
      );
    }

    const operationLocation = response.headers.get("Operation-Location");
    if (!operationLocation) {
      throw new Error("No Operation-Location header in Azure response");
    }

    return operationLocation;
  }

  /**
   * Poll Azure for analysis completion
   */
  private async pollForResult(
    operationLocation: string,
    maxPolls = 60,
    pollIntervalMs = 2000
  ): Promise<AzureOperationResponse> {
    for (let attempt = 0; attempt < maxPolls; attempt++) {
      const response = await fetch(operationLocation, {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Azure polling failed: ${response.status}`);
      }

      const result = (await response.json()) as AzureOperationResponse;

      if (result.status === "succeeded") {
        return result;
      }

      if (result.status === "failed") {
        throw new Error(
          `Azure analysis failed: ${result.error?.message ?? "Unknown error"}`
        );
      }

      // Still processing, wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Azure Document Intelligence analysis timed out");
  }

  /**
   * Normalize Azure response to PageContent array
   */
  private normalizePages(analyzeResult: AzureAnalyzeResult): PageContent[] {
    const pages: PageContent[] = [];

    // Group content by page
    for (const azurePage of analyzeResult.pages) {
      const pageNumber = azurePage.pageNumber;

      // Extract text blocks from paragraphs or lines
      const textBlocks = this.extractTextBlocks(analyzeResult, pageNumber);

      // Extract tables for this page
      const tables = this.extractTables(analyzeResult, pageNumber);

      pages.push({
        pageNumber,
        textBlocks,
        tables,
      });
    }

    return pages;
  }

  /**
   * Extract text blocks for a specific page
   */
  private extractTextBlocks(
    analyzeResult: AzureAnalyzeResult,
    pageNumber: number
  ): string[] {
    const textBlocks: string[] = [];

    // Prefer paragraphs if available (better semantic grouping)
    if (analyzeResult.paragraphs && analyzeResult.paragraphs.length > 0) {
      for (const paragraph of analyzeResult.paragraphs) {
        const isOnPage = paragraph.boundingRegions?.some(
          (region) => region.pageNumber === pageNumber
        );

        if (isOnPage && paragraph.content.trim()) {
          textBlocks.push(paragraph.content.trim());
        }
      }
    } else {
      // Fall back to lines
      const page = analyzeResult.pages.find((p) => p.pageNumber === pageNumber);
      if (page?.lines) {
        for (const line of page.lines) {
          if (line.content.trim()) {
            textBlocks.push(line.content.trim());
          }
        }
      }
    }

    return textBlocks;
  }

  /**
   * Extract and convert tables for a specific page
   */
  private extractTables(
    analyzeResult: AzureAnalyzeResult,
    pageNumber: number
  ): ExtractedTable[] {
    const tables: ExtractedTable[] = [];

    if (!analyzeResult.tables) {
      return tables;
    }

    for (const azureTable of analyzeResult.tables) {
      // Check if table is on this page
      const isOnPage = azureTable.boundingRegions?.some(
        (region) => region.pageNumber === pageNumber
      );

      if (!isOnPage) continue;

      // Build the table rows
      const rows: string[][] = Array.from({ length: azureTable.rowCount }, () =>
        Array.from({ length: azureTable.columnCount }, () => "")
      );

      for (const cell of azureTable.cells) {
        const rowIdx = cell.rowIndex;
        const colIdx = cell.columnIndex;

        if (rows[rowIdx] && colIdx < (rows[rowIdx]?.length ?? 0)) {
          rows[rowIdx]![colIdx] = cell.content.trim();
        }

        // Handle row/column spans by repeating content
        if (cell.rowSpan && cell.rowSpan > 1) {
          for (let r = 1; r < cell.rowSpan; r++) {
            if (rows[rowIdx + r]) {
              rows[rowIdx + r]![colIdx] = cell.content.trim();
            }
          }
        }
        if (cell.columnSpan && cell.columnSpan > 1) {
          for (let c = 1; c < cell.columnSpan; c++) {
            if (rows[rowIdx]) {
              rows[rowIdx]![colIdx + c] = cell.content.trim();
            }
          }
        }
      }

      // Generate markdown representation
      const markdown = this.tableToMarkdown(rows);

      // Get bounding box if available
      const boundingRegion = azureTable.boundingRegions?.find(
        (r) => r.pageNumber === pageNumber
      );
      const boundingBox = boundingRegion?.boundingBox
        ? {
            x: boundingRegion.boundingBox[0] ?? 0,
            y: boundingRegion.boundingBox[1] ?? 0,
            width:
              (boundingRegion.boundingBox[4] ?? 0) - (boundingRegion.boundingBox[0] ?? 0),
            height:
              (boundingRegion.boundingBox[5] ?? 0) - (boundingRegion.boundingBox[1] ?? 0),
          }
        : undefined;

      tables.push({
        rows,
        markdown,
        boundingBox,
        rowCount: azureTable.rowCount,
        columnCount: azureTable.columnCount,
      });
    }

    return tables;
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
   * Calculate average confidence score from word-level confidence
   */
  private calculateAverageConfidence(analyzeResult: AzureAnalyzeResult): number {
    let totalConfidence = 0;
    let wordCount = 0;

    for (const page of analyzeResult.pages) {
      if (page.words) {
        for (const word of page.words) {
          totalConfidence += word.confidence;
          wordCount++;
        }
      }
    }

    if (wordCount === 0) return 100;

    return Math.round((totalConfidence / wordCount) * 100);
  }
}

/**
 * Factory function to create Azure adapter
 */
export function createAzureAdapter(
  endpoint?: string,
  apiKey?: string
): AzureDocumentIntelligenceAdapter {
  return new AzureDocumentIntelligenceAdapter(endpoint, apiKey);
}

