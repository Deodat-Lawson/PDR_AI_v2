import path from "node:path";

import { eq } from "drizzle-orm";

import { inngest } from "../client";
import { db } from "~/server/db";
import { document, fileUploads } from "~/server/db/schema";
import { convertOfficeToPdf } from "~/lib/preview-pdf/provider";
import type { GeneratePreviewPdfEventData } from "~/lib/preview-pdf/types";

function normalizeOutputFilename(documentName: string): string {
  const parsed = path.parse(documentName);
  const safeBase = (parsed.name || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${safeBase}.pdf`;
}

function truncateError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.slice(0, 1000);
}

export const generatePreviewPdf = inngest.createFunction(
  {
    id: "generate-preview-pdf",
    name: "Generate Office Preview PDF",
    retries: 3,
    onFailure: async (ctx) => {
      const data = (
        ctx as { event?: { data?: Partial<GeneratePreviewPdfEventData> } }
      ).event?.data;
      if (!data?.documentId) {
        return;
      }
      const now = new Date();
      await db
        .update(document)
        .set({
          previewPdfStatus: "failed",
          previewPdfError: truncateError(ctx.error),
          previewPdfUpdatedAt: now,
          updatedAt: now,
        })
        .where(eq(document.id, data.documentId));
    },
  },
  { event: "document/preview-pdf.requested" },
  async ({ event, step }) => {
    const data = event.data as GeneratePreviewPdfEventData;
    const startedAt = Date.now();
    const now = new Date();

    await step.run("mark-preview-processing", async () => {
      await db
        .update(document)
        .set({
          previewPdfStatus: "processing",
          previewPdfError: null,
          previewPdfUpdatedAt: now,
          updatedAt: now,
        })
        .where(eq(document.id, data.documentId));
    });

    const sourceFileBase64 = await step.run("download-source-file", async () => {
      const response = await fetch(data.documentUrl, {
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch source document (${response.status}) from ${data.documentUrl}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString("base64");
    });

    const pdfBase64 = await step.run("convert-office-to-pdf", async () => {
      const sourceBytes = Buffer.from(sourceFileBase64, "base64");
      const pdfBytes = await convertOfficeToPdf({
        bytes: sourceBytes,
        filename: data.documentName,
        mimeType: data.mimeType,
        retries: 2,
      });
      return pdfBytes.toString("base64");
    });

    const previewFileId = await step.run("persist-preview-pdf", async () => {
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const [record] = await db
        .insert(fileUploads)
        .values({
          userId: data.userId,
          filename: normalizeOutputFilename(data.documentName),
          mimeType: "application/pdf",
          fileData: pdfBuffer.toString("base64"),
          fileSize: pdfBuffer.length,
        })
        .returning({ id: fileUploads.id });

      if (!record?.id) {
        throw new Error("Failed to persist generated PDF preview");
      }

      return record.id;
    });

    const previewPdfUrl = `/api/files/${previewFileId}`;

    await step.run("mark-preview-ready", async () => {
      const updatedAt = new Date();
      await db
        .update(document)
        .set({
          previewPdfUrl,
          previewPdfStatus: "ready",
          previewPdfError: null,
          previewPdfUpdatedAt: updatedAt,
          updatedAt,
        })
        .where(eq(document.id, data.documentId));
    });

    const elapsedMs = Date.now() - startedAt;
    console.log(
      `[PreviewPDF] ready documentId=${data.documentId} previewUrl=${previewPdfUrl} latencyMs=${elapsedMs}`
    );

    return {
      success: true,
      documentId: data.documentId,
      previewPdfUrl,
      latencyMs: elapsedMs,
    };
  }
);

