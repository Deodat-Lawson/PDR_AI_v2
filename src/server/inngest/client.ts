import { Inngest } from "inngest";
import type { ProcessDocumentEventData } from "~/lib/ocr/types";

/**
 * Create the Inngest client.
 * INNGEST_EVENT_KEY is required in all environments (validated in env.ts).
 */
function createInngestClient(): Inngest {
  const eventKey = process.env.INNGEST_EVENT_KEY;

  return new Inngest({
    id: "pdr-ai",
    name: "PDR AI",
    ...(eventKey && { eventKey }),
  });
}

// Inngest client — always available (key is required)
export const inngest = createInngestClient();

export type ProcessDocumentEvent = {
  name: "document/process.requested";
  data: ProcessDocumentEventData;
};

export type Events = ProcessDocumentEvent;
