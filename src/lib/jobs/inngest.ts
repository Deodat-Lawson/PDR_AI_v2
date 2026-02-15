/**
 * Inngest Job Dispatcher
 *
 * Default job dispatcher that sends document processing events to Inngest.
 * Inngest handles retries, observability, and step-based execution.
 */

import type { JobDispatcher, DispatchResult } from "./types";
import type { ProcessDocumentEventData } from "~/lib/ocr/types";

export class InngestDispatcher implements JobDispatcher {
  readonly name = "Inngest";

  async dispatch(data: ProcessDocumentEventData): Promise<DispatchResult> {
    const { inngest } = await import("~/server/inngest/client");

    const result = await inngest.send({
      name: "document/process.requested",
      data,
    });

    console.log(
      `[InngestDispatcher] Queued job=${data.jobId}, eventIds=${result.ids.length}`,
    );

    return {
      jobId: data.jobId,
      eventIds: result.ids,
    };
  }
}
