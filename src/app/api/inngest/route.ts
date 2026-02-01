/**
 * Inngest API Route
 * This endpoint serves the Inngest SDK and allows Inngest to trigger functions
 * 
 * When Inngest is disabled (INNGEST_EVENT_KEY not set), this route returns 404
 */

import { NextResponse } from "next/server";
import { isInngestEnabled } from "~/lib/ocr/trigger";

// Disabled handler - returns 404 when Inngest is not enabled
const disabledHandler = () => {
  return NextResponse.json(
    { 
      error: "Inngest is disabled", 
      message: "Set INNGEST_EVENT_KEY environment variable to enable background processing" 
    },
    { status: 404 }
  );
};

// Dynamic handler creation based on Inngest configuration
async function createHandlers() {
  if (!isInngestEnabled()) {
    return {
      GET: disabledHandler,
      POST: disabledHandler,
      PUT: disabledHandler,
    };
  }

  // Only import Inngest dependencies when enabled
  const { serve } = await import("inngest/next");
  const { inngest } = await import("~/server/inngest/client");
  const { uploadDocument } = await import("~/server/inngest/functions/processDocument");

  if (!inngest || !uploadDocument) {
    console.error("[Inngest Route] Inngest client or functions not available despite INNGEST_EVENT_KEY being set");
    return {
      GET: disabledHandler,
      POST: disabledHandler,
      PUT: disabledHandler,
    };
  }

  // Register all Inngest functions
  return serve({
    client: inngest,
    functions: [uploadDocument],
  });
}

// Create handlers at module load time
// Note: This uses top-level await which is supported in Next.js 13+
const handlers = await createHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
