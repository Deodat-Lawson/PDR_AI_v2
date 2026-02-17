# [Batch upload] Add POST /api/upload-batch with validation and rate limits

**Parent:** Part of the parent issue "Better support for unstructured file uploads and batch uploading". Link this sub-issue in the parent description.

**Assignee:** Person 1 (backend)

**Labels:** `enhancement`, `upload`, `batch`, `backend`

---

## Summary

Implement the Phase 1 backend for batch document upload: a new `POST /api/upload-batch` endpoint that accepts an array of document payloads, creates document rows, triggers the existing pipeline for each, and returns document/job ids with optional per-item errors.

## Tasks

- [ ] **Add `POST /api/upload-batch`**
  - New route that accepts a JSON body with an array of `{ documentUrl, documentName, category?, mimeType?, preferredProvider? }`.
  - Auth same as `uploadDocument` (e.g. Clerk).
  - For each item: resolve URL (absolute for DB storage), create `document` row, call `triggerDocumentProcessing()`, collect `documentId` and `jobId`.
  - Return `{ documents: { id, title, jobId }[], errors?: { index, error }[] }`.
  - Partial success: valid items processed, invalid items in `errors`.

- [ ] **Batch size and rate limiting**
  - Enforce max batch size (e.g. 20).
  - Apply existing rate-limit middleware (e.g. `RateLimitPresets.strict` or a dedicated batch preset).
  - Return 400 if over limit; document limit in response or README.

- [ ] **Validation and error handling**
  - Validate each payload (required fields, URL format, storage type).
  - Per-item validation errors go into `errors` array with index.
  - Log and return 207 (or 200) with mixed success/errors; 400 only if entire request is invalid (e.g. not an array, auth failure).

- [ ] **(Optional) Batch upload of binaries**
  - If desired: accept multipart with multiple `file` parts; for each file call existing upload-local logic (or a shared helper) to get URL, then same flow as above. Otherwise the UI will use multiple `upload-local` calls then one `upload-batch` with URLs.

## Deliverables

- Batch endpoint live at `POST /api/upload-batch`.
- Documented max batch size and rate limits.
- Integration test or manual test with 2–3 documents and one invalid item.

## Key files

- Add: `src/app/api/upload-batch/route.ts`
- Reference: `src/app/api/uploadDocument/route.ts`, `src/app/api/upload-local/route.ts`, `src/lib/ocr/trigger.ts`
