
function parseCompanyIdAllowList(): Set<string> {
  const raw = process.env.PREVIEW_PDF_COMPANY_IDS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export function isPreviewPdfEnabledForCompany(companyId: string): boolean {
  const allowList = parseCompanyIdAllowList();
  if (allowList.size === 0) return false;
  if (allowList.has("*")) return true;
  return allowList.has(companyId);
}

