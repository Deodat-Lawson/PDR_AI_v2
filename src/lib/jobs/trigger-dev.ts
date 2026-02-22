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

type TriggerSdkModule = {
  trigger: (id: string, payload: unknown) => Promise<{ id: string }>;
};

let cachedSdk: TriggerSdkModule | null = null;

function loadTriggerSdk(): TriggerSdkModule {
  if (cachedSdk) return cachedSdk;

  const runner = process.env.JOB_RUNNER?.toLowerCase().trim();
  if (runner !== "trigger-dev") {
    throw new Error(
      "TriggerDevDispatcher loaded while JOB_RUNNER is not set to trigger-dev.",
    );
  }

  const moduleName = "@trigger.dev/sdk/v3";

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    cachedSdk = require(moduleName) as TriggerSdkModule;
  } catch {
    throw new Error(
      "Trigger.dev SDK not installed. Run: pnpm add @trigger.dev/sdk\n" +
      "Then configure your project at https://trigger.dev/docs",
    );
  }

  return cachedSdk;
}

export class TriggerDevDispatcher implements JobDispatcher {
  readonly name = "Trigger.dev";

  async dispatch(data: ProcessDocumentEventData): Promise<DispatchResult> {
    const tasks = loadTriggerSdk();
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
