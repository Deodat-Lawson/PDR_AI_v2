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
const UploadDocumentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  documentUrl: z.string().url("Valid document URL is required"),
  documentName: z.string().min(1, "Document name is required"),
  category: z.string().optional(),
  preferredProvider: z.string().optional(),
});

export async function POST(request: Request) {
  return withRateLimit(request, RateLimitPresets.strict, async () => {
    try {
      const validation = await validateRequestBody(request, UploadDocumentSchema);
      if (!validation.success) {
        return validation.response;
      }

      const {
        userId,
        documentUrl,
        documentName,
        category,
        preferredProvider,
      } = validation.data;

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
      const documentCategory = category ?? "Uncategorized";

      const [newDocument] = await db.insert(document).values({
        url: documentUrl,
        title: documentName,
        category: documentCategory,
        companyId: userInfo.companyId,
        ocrEnabled: true,
        ocrProcessed: false,
      }).returning({
        id: document.id,
        url: document.url,
        title: document.title,
        category: document.category,
      });

      if (!newDocument) {
        return NextResponse.json(
          { error: "Failed to create document record" },
          { status: 500 }
        );
      }

      const { jobId, eventIds } = await triggerDocumentProcessing(
        documentUrl,
        documentName,
        companyId,
        userId,
        {
          preferredProvider: parseProvider(preferredProvider),
          documentId: newDocument.id,
          category: documentCategory,
        }
      );

      await db.insert(ocrJobs).values({
        id: jobId,
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
          message: "Document processing started",
          document: {
            id: newDocument.id,
            title: newDocument.title,
            url: newDocument.url,
            category: newDocument.category,
          },
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

