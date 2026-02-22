/**
 * Backfill script for generated Office PDF previews.
 *
 * Run with:
 *   npx tsx src/scripts/backfill-preview-pdfs.ts
 *
 * Optional env:
 * - BACKFILL_PREVIEW_ORIGIN=https://your-app-domain.com
 * - PREVIEW_PDF_COMPANY_IDS=1,2,3 (or "*")
 */

import { and, asc, eq, isNull, or } from "drizzle-orm";

import { db } from "~/server/db";
import { document } from "~/server/db/schema";
import { isOfficePreviewCandidate } from "~/lib/preview-pdf/office";
import { isPreviewPdfEnabledForCompany } from "~/lib/preview-pdf/feature-flag";
import { triggerPreviewPdfGeneration } from "~/lib/preview-pdf/trigger";

const BATCH_SIZE = 200;

function toAbsoluteUrl(rawUrl: string, origin?: string): string | null {
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  if (!origin) return null;
  return `${origin.replace(/\/$/, "")}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

async function main(): Promise<void> {
  const origin = process.env.BACKFILL_PREVIEW_ORIGIN;
  const now = new Date();
  const stats = {
    queued: 0,
    skipped: 0,
    failed: 0,
  };

  const docs = await db
    .select({
      id: document.id,
      title: document.title,
      url: document.url,
      companyId: document.companyId,
    })
    .from(document)
    .where(
      and(
        isNull(document.previewPdfUrl),
        or(isNull(document.previewPdfStatus), eq(document.previewPdfStatus, "failed"))
      )
    )
    .orderBy(asc(document.id))
    .limit(BATCH_SIZE);

  console.log(`[PreviewPDF Backfill] scanning ${docs.length} documents`);

  for (const doc of docs) {
    const companyId = doc.companyId.toString();
    if (!isPreviewPdfEnabledForCompany(companyId)) {
      stats.skipped += 1;
      continue;
    }

    if (!isOfficePreviewCandidate({ filename: doc.title })) {
      stats.skipped += 1;
      continue;
    }

    const absoluteUrl = toAbsoluteUrl(doc.url, origin);
    if (!absoluteUrl) {
      console.warn(
        `[PreviewPDF Backfill] skipped docId=${doc.id} because url is relative and BACKFILL_PREVIEW_ORIGIN is not set`
      );
      stats.skipped += 1;
      continue;
    }

    try {
      await db
        .update(document)
        .set({
          previewPdfStatus: "pending",
          previewPdfError: null,
          previewPdfUpdatedAt: now,
          updatedAt: now,
        })
        .where(eq(document.id, doc.id));

      await triggerPreviewPdfGeneration({
        documentId: doc.id,
        userId: "system-backfill",
        documentUrl: absoluteUrl,
        documentName: doc.title,
      });
      stats.queued += 1;
    } catch (error) {
      stats.failed += 1;
      const failedAt = new Date();
      await db
        .update(document)
        .set({
          previewPdfStatus: "failed",
          previewPdfError:
            error instanceof Error ? error.message.slice(0, 1000) : "Backfill enqueue failed",
          previewPdfUpdatedAt: failedAt,
          updatedAt: failedAt,
        })
        .where(eq(document.id, doc.id));
      console.error(`[PreviewPDF Backfill] failed docId=${doc.id}`, error);
    }
  }

  console.log(
    `[PreviewPDF Backfill] done queued=${stats.queued} skipped=${stats.skipped} failed=${stats.failed}`
  );
}

main().catch((error) => {
  console.error("[PreviewPDF Backfill] fatal error", error);
  process.exit(1);
});

