import { detectSourceType } from "~/lib/ingestion";

const OFFICE_SOURCE_TYPES = new Set(["docx", "pptx", "xlsx"]);

export function isOfficePreviewCandidate(params: {
  mimeType?: string;
  filename?: string;
}): boolean {
  const sourceType = detectSourceType(params.mimeType, params.filename);
  return OFFICE_SOURCE_TYPES.has(sourceType);
}

