/**
 * Trigger.dev Job Dispatcher (Optional)
 *
 * Alternative job dispatcher for users who prefer Trigger.dev over Inngest.
 *
 * To use Trigger.dev:
 * 1. Install: pnpm add @trigger.dev/sdk
 * 2. Set JOB_RUNNER=trigger-dev in your .env
 * 3. Configure your Trigger.dev project (trigger.config.ts)
 * 4. Define the document processing task in your Trigger.dev tasks
 *
 * This dispatcher sends events to a Trigger.dev task named
 * "process-document". You must create that task separately.
 *
 * @see https://trigger.dev/docs for setup instructions
 */

import type { JobDispatcher, DispatchResult } from "./types";
import type { ProcessDocumentEventData } from "~/lib/ocr/types";

export class TriggerDevDispatcher implements JobDispatcher {
  readonly name = "Trigger.dev";

  async dispatch(data: ProcessDocumentEventData): Promise<DispatchResult> {
    // Dynamic import so @trigger.dev/sdk is only loaded when this adapter is used.
    // This avoids requiring the dependency for Inngest-only users.
    let tasks: { trigger: (id: string, payload: unknown) => Promise<{ id: string }> };

    try {
      // Optional dependency: only resolved when JOB_RUNNER=trigger-dev. Install: pnpm add @trigger.dev/sdk
      // @ts-expect-error - @trigger.dev/sdk is optional; types unavailable when not installed
      tasks = await import("@trigger.dev/sdk/v3") as typeof tasks;
    } catch {
      throw new Error(
        "Trigger.dev SDK not installed. Run: pnpm add @trigger.dev/sdk\n" +
        "Then configure your project at https://trigger.dev/docs",
      );
    }

    const handle = await tasks.trigger("process-document", data);

    console.log(
      `[TriggerDevDispatcher] Triggered job=${data.jobId}, runId=${handle.id}`,
    );

    return {
      jobId: data.jobId,
      eventIds: [handle.id],
    };
  }
}
