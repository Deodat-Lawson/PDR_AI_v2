import { Inngest } from "inngest";
import type { ProcessDocumentEventData } from "~/lib/ocr/types";

// Create an Inngest client
export const inngest = new Inngest({
  id: "pdr-ai",
  name: "PDR AI",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type ProcessDocumentEvent = {
  name: "document/process.requested";
  data: ProcessDocumentEventData;
};

export type Events = ProcessDocumentEvent;
