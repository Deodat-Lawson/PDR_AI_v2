/**
 * Inngest API Route
 * This endpoint serves the Inngest SDK and allows Inngest to trigger functions
 */

import { serve } from "inngest/next";
import { inngest } from "~/server/inngest/client";
import { uploadDocument } from "~/server/inngest/functions/processDocument";

// Register all Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    uploadDocument,
  ],
});
