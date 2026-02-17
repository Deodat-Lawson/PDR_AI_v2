# [Batch upload] Document batch flow and add Phase 2 sub-issues (unstructured / Unstructured.io)

**Parent:** Part of the parent issue "Better support for unstructured file uploads and batch uploading". Link this sub-issue in the parent description.

**Assignee:** Person 3 (docs & config)

**Labels:** `enhancement`, `upload`, `batch`, `documentation`

---

## Summary

Document the batch upload flow, add batch size and rate-limit configuration, and create two follow-up (Phase 2) sub-issues for unstructured file support and optional Unstructured.io integration.

## Tasks

- [ ] **Document batch flow**
  - Update `docs/feature-workflows.md` with a "Batch upload" subsection: flow (multi-file → upload → batch API → N jobs), link to batch endpoint and rate limits.
  - Update README if it describes upload (e.g. "Single or batch document upload").

- [ ] **Batch limits and env**
  - Add batch max size (e.g. `BATCH_UPLOAD_MAX_FILES = 20`) to `src/lib/constants.ts` or env; document in README or deployment docs.
  - Ensure rate limiter allows batch endpoint (e.g. one batch = one "unit" or N units).

- [ ] **Phase 2 sub-issue: "Allow unknown types" (best-effort)**
  - Create a follow-up GitHub issue: add optional "allow unknown types" (setting or param); when enabled, route unknown MIME/ext to a fallback adapter; show "Best-effort extraction" in UI. Acceptance criteria and owner TBD.

- [ ] **Phase 2 sub-issue: Unstructured.io adapter (optional)**
  - Create a follow-up GitHub issue: optional ingestion adapter calling Unstructured.io API for unsupported or low-confidence docs; env (API key, feature flag); document cost and limits. Acceptance criteria and owner TBD.

## Deliverables

- Batch flow and limits documented in `feature-workflows.md` and README.
- Batch max size (and optional env) in constants; rate-limit behavior documented.
- Two Phase 2 sub-issues created and linked from the parent issue.

## Key files

- `docs/feature-workflows.md`
- `README.md`
- `src/lib/constants.ts`
- `docs/deployment.md` (if rate limits are configured there)

## Notes

- Can be done in parallel with backend (Person 1) once request/response contract is agreed.
- Docs should reference the batch endpoint contract (max size, response shape) from the backend sub-issue.
