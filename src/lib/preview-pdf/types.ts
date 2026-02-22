export type PreviewPdfStatus = "pending" | "processing" | "ready" | "failed";

export interface GeneratePreviewPdfEventData {
  documentId: number;
  userId: string;
  documentUrl: string;
  documentName: string;
  mimeType?: string;
}

