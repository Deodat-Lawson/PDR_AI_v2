# Feature Workflows and Architecture

This document explains how the major PDR AI features connect end to end.

## End-to-end workflow

PDR AI follows this loop:

1. Authenticate user with role context (Employer/Employee).
2. Upload document (optionally OCR for scanned PDFs).
3. Extract text, chunk content, and generate embeddings.
4. Store vectors in PostgreSQL + pgvector.
5. Use retrieval for AI chat and predictive analysis.
6. Persist chat/session context for continuity.

## Knowledge base architecture

```text
Upload -> Extract (PDF/OCR) -> Chunk -> Embed -> Store (pgvector) -> Retrieve (RAG)
```

Core areas in codebase:

- `src/app/api/uploadDocument` - ingestion entrypoint
- `src/app/api/services/ocrService.ts` - OCR provider integrations
- `src/app/api/LangChain/route.ts` - document Q&A
- `src/app/api/agents/predictive-document-analysis` - predictive analysis
- `src/server/db` - schema and database wiring

## Predictive document analysis

High-level flow:

1. Parse available document set and metadata.
2. Identify expected-but-missing documents.
3. Score urgency/confidence.
4. Return prioritized recommendations.

Benefits:

- Reduced manual review time
- Better compliance readiness
- Faster audit preparation

## Study workflows

Study flows reuse the same retrieval foundation:

- StudyBuddy mode: conversational coaching style
- AI Teacher mode: structured instruction style

Both rely on persisted session state and document-grounded retrieval.

## Search scopes

- Document-scoped retrieval
- Category-scoped retrieval
- Global company retrieval
- Optional web-enriched retrieval when configured
