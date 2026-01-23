/**
 * Process Document API Route
 * Triggers the OCR-to-Vector pipeline via Inngest
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { users, ocrJobs, document } from "~/server/db/schema";
import { triggerDocumentProcessing, parseProvider } from "~/lib/ocr/trigger";
import { validateRequestBody } from "~/lib/validation";
import { withRateLimit } from "~/lib/rate-limit-middleware";
import { RateLimitPresets } from "~/lib/rate-limiter";

/**
 * Request validation schema
 */
const ProcessDocumentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  documentUrl: z.string().url("Valid document URL is required"),
  documentName: z.string().min(1, "Document name is required"),
  category: z.string().optional(),
  documentId: z.number().optional(),
  forceOCR: z.boolean().optional(),
  preferredProvider: z.string().optional(),
});

/**
 * POST /api/processDocument
 * Starts the async OCR-to-Vector pipeline
 */
export async function POST(request: Request) {
  return withRateLimit(request, RateLimitPresets.strict, async () => {
    try {
      // Validate request body
      const validation = await validateRequestBody(request, ProcessDocumentSchema);
      if (!validation.success) {
        return validation.response;
      }

      const {
        userId,
        documentUrl,
        documentName,
        category,
        documentId,
        forceOCR,
        preferredProvider,
      } = validation.data;

      // Get user info
      const [userInfo] = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId));

      if (!userInfo) {
        return NextResponse.json(
          { error: "Invalid user" },
          { status: 400 }
        );
      }

      const companyId = userInfo.companyId.toString();

      // Create document record if documentId is not provided
      let finalDocumentId = documentId;
      if (!finalDocumentId) {
        const [newDocument] = await db
          .insert(document)
          .values({
            url: documentUrl,
            category: category ?? "Uncategorized",
            title: documentName,
            companyId: userInfo.companyId,
            ocrEnabled: true,
            ocrProcessed: false,
          })
          .returning();

        if (!newDocument) {
          return NextResponse.json(
            { error: "Failed to create document record" },
            { status: 500 }
          );
        }

        finalDocumentId = newDocument.id;
        console.log(`[ProcessDocument] Created new document with ID: ${finalDocumentId}`);
      }

      // Trigger the pipeline
      const { jobId, eventIds } = await triggerDocumentProcessing(
        documentUrl,
        documentName,
        companyId,
        userId,
        {
          forceOCR,
          preferredProvider: parseProvider(preferredProvider),
          documentId: finalDocumentId,
          category,
        }
      );

      // Create OCR job record for tracking
      await db.insert(ocrJobs).values({
        id: jobId,
        documentId: BigInt(finalDocumentId),
        companyId: userInfo.companyId,
        userId,
        status: "queued",
        documentUrl,
        documentName,
      });

      return NextResponse.json(
        {
          success: true,
          jobId,
          eventIds,
          documentId: finalDocumentId,
          message: "Document processing started",
        },
        { status: 202 }
      );
    } catch (error) {
      console.error("Error triggering document processing:", error);
      return NextResponse.json(
        {
          error: "Failed to start document processing",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  });
}

/**
 * GET /api/processDocument?jobId=xxx
 * Check the status of a processing job
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Get job status from database
    const [job] = await db
      .select()
      .from(ocrJobs)
      .where(eq(ocrJobs.id, jobId));

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      documentName: job.documentName,
      provider: job.actualProvider ?? job.primaryProvider,
      pageCount: job.pageCount,
      confidenceScore: job.confidenceScore,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      processingDurationMs: job.processingDurationMs,
      error: job.errorMessage,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 }
    );
  }
}

