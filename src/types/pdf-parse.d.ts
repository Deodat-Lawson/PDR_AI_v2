/**
 * Type declarations for pdf-parse
 */
declare module "pdf-parse" {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    [key: string]: unknown;
  }

  interface PDFMetadata {
    _metadata?: unknown;
    [key: string]: unknown;
  }

  interface PDFData {
    /** Number of pages */
    numpages: number;
    /** Number of pages that were rendered */
    numrender: number;
    /** PDF information */
    info: PDFInfo;
    /** PDF metadata */
    metadata: PDFMetadata | null;
    /** PDF.js version */
    version: string;
    /** Extracted text from all pages */
    text: string;
  }

  interface PDFTextItem {
    str: string;
    [key: string]: unknown;
  }

  interface PDFTextContent {
    items: PDFTextItem[];
  }

  interface PDFPageData {
    getTextContent(): Promise<PDFTextContent>;
  }

  interface PDFOptions {
    /** Max pages to parse (default: 0 = all) */
    max?: number;
    /** Page render callback */
    pagerender?: (pageData: PDFPageData) => Promise<string>;
    /** Version check */
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: PDFOptions
  ): Promise<PDFData>;

  export = pdfParse;
}

