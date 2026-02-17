# [Batch upload] Multi-file select, upload queue, and batch submit in UploadForm

**Parent:** Part of the parent issue "Better support for unstructured file uploads and batch uploading". Link this sub-issue in the parent description.

**Assignee:** Person 2 (frontend)

**Labels:** `enhancement`, `upload`, `batch`, `frontend`

---

## Summary

Implement the Phase 1 upload UI for batch document upload: multi-file select and drag-and-drop, an upload queue with progress, and a single "Process all" action that calls `POST /api/upload-batch` and shows confirmation/status.

## Tasks

- [ ] **Multi-file select and drag-and-drop**
  - In `UploadForm.tsx`, allow `<input type="file" multiple />` and drop multiple files.
  - Store selected files in state (e.g. `File[]`).
  - Keep existing single-file flow working (optional: hide multi when a single "quick upload" mode is desired).

- [ ] **Upload queue and progress**
  - Show a list of chosen files (name, size).
  - "Upload" step: upload each file to `upload-local` (or future batch-upload endpoint) in sequence or parallel with a concurrency limit.
  - Show "Uploading 2/5" and per-file success/failure.
  - On success, collect `{ url, name, mimeType }` for each.

- [ ] **Batch submit and feedback**
  - Single "Process all" (or "Upload and process") button: call `POST /api/upload-batch` with the array of `{ documentUrl, documentName, mimeType?, category }` (category/title from form or per-file if needed).
  - Show "Processing N documents" and link to documents list; optionally show per-doc job ids or redirect to documents list with a "Batch submitted" toast.

- [ ] **Error handling and edge cases**
  - If some uploads fail, allow retry or remove failed from queue.
  - If batch API returns partial errors, show which files failed and why.
  - Disable submit until at least one file is ready; optional max files (e.g. 20) to match backend.

## Deliverables

- User can select/drop multiple files, see upload progress, submit one batch, and see confirmation and status (e.g. on documents list).

## Key files

- `src/app/employer/upload/UploadForm.tsx`
- `src/styles/Employer/Upload.module.css`

## Dependency

- Depends on (or can mock): `POST /api/upload-batch` from the backend sub-issue.
