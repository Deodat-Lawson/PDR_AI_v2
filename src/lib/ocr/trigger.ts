/**
 * Pipeline Trigger Utilities
 * Helper functions to invoke the OCR-to-Vector pipeline
 */

import { env } from "~/env";
import type { ProcessDocumentEventData, OCRProvider } from "./types";

/**
 * Options for triggering the document processing pipeline
 */
export interface TriggerOptions {
  /** Force OCR even for native PDFs */
  forceOCR?: boolean;
  /** Preferred OCR provider */
  preferredProvider?: OCRProvider;
}

/**
 * Check if Inngest is enabled
 * Returns true if INNGEST_EVENT_KEY is set
 */
export function isInngestEnabled(): boolean {
  return !!env.server.INNGEST_EVENT_KEY;
}

/**
 * Trigger the OCR-to-Vector pipeline for a document
 * Routes to Inngest or synchronous processing based on configuration
 * Returns the job ID for tracking
 */
export async function triggerDocumentProcessing(
  documentUrl: string,
  documentName: string,
  companyId: string,
  userId: string,
  documentId: number,
  category: string,
  options?: TriggerOptions
): Promise<{ jobId: string; eventIds: string[] }> {
  const jobId = generateJobId();

  const eventData: ProcessDocumentEventData = {
    jobId,
    documentUrl,
    documentName,
    companyId,
    userId,
    documentId,
    category,
    options: {
      forceOCR: options?.forceOCR,
      preferredProvider: options?.preferredProvider,
    },
  };

  if (isInngestEnabled()) {
    // Use Inngest for background processing
    const { inngest } = await import("~/server/inngest/client");
    
    if (!inngest) {
      throw new Error("Inngest is enabled but client is not configured. Check INNGEST_EVENT_KEY.");
    }

    const result = await inngest.send({
      name: "document/process.requested",
      data: eventData,
    });

    return {
      jobId,
      eventIds: result.ids,
    };
  } else {
    // Use synchronous processing (fire-and-forget)
    // Import dynamically to avoid circular dependencies
    const { processDocumentSync } = await import("./processor");
    
    console.log(`[Trigger] Inngest not configured, using synchronous processing for job ${jobId}`);
    
    // Fire-and-forget: start processing without blocking the response
    // Use setImmediate to allow the current request to complete first
    setImmediate(() => {
      processDocumentSync(eventData).catch((error) => {
        console.error(`[Trigger] Sync processing failed for job ${jobId}:`, error);
      });
    });

    return {
      jobId,
      eventIds: [], // No Inngest events in sync mode
    };
  }
}

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `ocr-${timestamp}-${randomPart}`;
}

/**
 * Parse a provider string to OCRProvider type
 */
export function parseProvider(provider?: string): OCRProvider | undefined {
  if (!provider) return undefined;

  const normalized = provider.toUpperCase();
  const validProviders: OCRProvider[] = ["AZURE", "LANDING_AI", "NATIVE_PDF", "DATALAB"];

  if (validProviders.includes(normalized as OCRProvider)) {
    return normalized as OCRProvider;
  }

  return undefined;
}
