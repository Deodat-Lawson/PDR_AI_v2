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

  // Try Inngest first if configured
  if (isInngestEnabled()) {
    try {
      const { inngest } = await import("~/server/inngest/client");
      
      if (inngest) {
        const result = await inngest.send({
          name: "document/process.requested",
          data: eventData,
        });

        console.log(`[Trigger] Successfully queued job ${jobId} via Inngest`);
        return {
          jobId,
          eventIds: result.ids,
        };
      }
    } catch (error) {
      // Inngest failed - log and fall through to sync processing
      console.warn(
        `[Trigger] Inngest failed for job ${jobId}, falling back to sync processing:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Fallback: synchronous processing
  // This runs when Inngest is not configured OR when Inngest fails
  const { processDocumentSync } = await import("./processor");
  
  console.log(`[Trigger] Using synchronous processing for job ${jobId}`);
  
  // Await processing to ensure it completes in serverless environments
  // setImmediate doesn't work on Vercel/serverless as the function terminates after response
  try {
    await processDocumentSync(eventData);
  } catch (error) {
    console.error(`[Trigger] Sync processing failed for job ${jobId}:`, error);
    // Don't throw - the document record was already created, job will show as failed
  }

  return {
    jobId,
    eventIds: [], // No Inngest events in sync mode
  };
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
