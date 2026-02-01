import { Inngest } from "inngest";
import type { ProcessDocumentEventData } from "~/lib/ocr/types";

/**
 * Create an Inngest client if configured
 * Returns null if INNGEST_EVENT_KEY is not set
 */
function createInngestClient(): Inngest | null {
  const eventKey = process.env.INNGEST_EVENT_KEY;
  
  if (!eventKey) {
    console.log("[Inngest] No INNGEST_EVENT_KEY configured, Inngest client disabled");
    return null;
  }

  return new Inngest({
    id: "pdr-ai",
    name: "PDR AI",
    eventKey,
  });
}

// Create the Inngest client (nullable when not configured)
export const inngest = createInngestClient();

export type ProcessDocumentEvent = {
  name: "document/process.requested";
  data: ProcessDocumentEventData;
};

export type Events = ProcessDocumentEvent;
