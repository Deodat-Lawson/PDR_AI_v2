/**
 * Process Document API Route
 * Triggers the OCR-to-Vector pipeline via Inngest
 * Supports both cloud storage (UploadThing) and database storage
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
 * Storage type for uploaded documents
 */
type StorageType = "cloud" | "database";

/**
 * Request validation schema
 * Accepts either a full URL (cloud) or a relative path (database)
 */
const UploadDocumentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  documentUrl: z.string().min(1, "Document URL or path is required"),
  documentName: z.string().min(1, "Document name is required"),
  category: z.string().optional(),
  preferredProvider: z.string().optional(),
  storageType: z.enum(["cloud", "database"]).optional(),
});

/**
 * Determines the storage type from the URL
 */
function detectStorageType(url: string): StorageType {
  // If it starts with /api/files/, it's database storage
  if (url.startsWith("/api/files/")) {
    return "database";
  }
  // If it's a full URL, it's cloud storage
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return "cloud";
  }
  // Default to database for other relative paths
  return "database";
}

/**
 * Converts a relative URL to an absolute URL using the request origin
 */
function toAbsoluteUrl(url: string, requestUrl: string): string {
  // If already absolute, return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Extract origin from request URL
  const parsedUrl = new URL(requestUrl);
  const origin = parsedUrl.origin;
  
  // Combine origin with relative path
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function POST(request: Request) {
  return withRateLimit(request, RateLimitPresets.strict, async () => {
    try {
      const validation = await validateRequestBody(request, UploadDocumentSchema);
      if (!validation.success) {
        return validation.response;
      }

      const {
        userId,
        documentUrl: rawDocumentUrl,
        documentName,
        category,
        preferredProvider,
        storageType: explicitStorageType,
      } = validation.data;

      // Determine storage type (explicit or auto-detect)
      const storageType = explicitStorageType ?? detectStorageType(rawDocumentUrl);
      
      // Convert relative URLs to absolute for processing pipeline
      const documentUrl = storageType === "database" 
        ? toAbsoluteUrl(rawDocumentUrl, request.url)
        : rawDocumentUrl;

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

      // Store the original URL (relative for database, full for cloud)
      // This preserves the reference for later retrieval
      const [newDocument] = await db.insert(document).values({
        url: rawDocumentUrl,
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

      // Use absolute URL for processing pipeline (it needs to fetch the file)
      const { jobId, eventIds } = await triggerDocumentProcessing(
        documentUrl,
        documentName,
        companyId,
        userId,
        newDocument.id,
        documentCategory,
        {
          preferredProvider: parseProvider(preferredProvider),
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
          storageType,
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

