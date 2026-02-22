import { env } from "~/env";
import type { GeneratePreviewPdfEventData } from "./types";

export async function triggerPreviewPdfGeneration(
  data: GeneratePreviewPdfEventData
): Promise<{ eventIds: string[] }> {
  if (!env.server.INNGEST_EVENT_KEY || env.server.INNGEST_EVENT_KEY === "") {
    throw new Error(
      "INNGEST_EVENT_KEY is required to trigger preview PDF generation."
    );
  }

  const { inngest } = await import("~/server/inngest/client");
  const result = await inngest.send({
    name: "document/preview-pdf.requested",
    data,
  });

  return { eventIds: result.ids };
}

