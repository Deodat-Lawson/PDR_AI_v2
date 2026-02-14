# PDR AI - Professional Document Reader AI

PDR AI is a Next.js platform for role-based document management, AI-assisted Q&A, and predictive document analysis. It combines document upload, optional OCR, unified ingestion for multiple formats (PDF, DOCX, XLSX, PPTX, images, etc.), embeddings, vector + BM25 + knowledge-graph retrieval, and optional sidecar ML compute for reranking and entity extraction.

## ✨ Core Features

- **Clerk-based Employer/Employee authentication** with role-aware middleware
- **Unified document ingestion** for PDF, DOCX, XLSX, PPTX, images, CSV, text, HTML, and more
- **Optional OCR** for scanned PDFs (Azure Document Intelligence, Datalab, Landing.AI)
- **PostgreSQL + pgvector + BM25 + knowledge graph** for ensemble RAG retrieval
- **Optional ML sidecar** (FastAPI) for cross-encoder reranking and NER/entity extraction (Graph RAG)
- **Native viewers** for PDF, Word, Excel, and PowerPoint documents
- **AI chat and predictive document analysis** over uploaded content
- **Optional web-enriched analysis** with Tavily
- **Background processing** via Inngest (default) or Trigger.dev

## 🛠 Tech Stack

- Next.js 15 + TypeScript
- PostgreSQL + Drizzle ORM + pgvector
- Clerk authentication
- OpenAI + LangChain
- UploadThing + optional OCR providers (Azure, Datalab, Landing.AI)
- Tailwind CSS
- FastAPI sidecar (optional): sentence-transformers, cross-encoders, NER models

## 📋 Prerequisites

- Node.js 18+
- pnpm
- Docker + Docker Compose (recommended for local DB, sidecar, and full stack)
- Git

## ⚡ Quick Start

### 1) Clone and install

```bash
git clone <repository-url>
cd pdr_ai_v2
pnpm install
```

### 2) Configure environment

Create `.env` from `.env.example` and fill required values:

**Required:**

- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`
- `INNGEST_EVENT_KEY` (required in production; run pnpm db:inngest in development)

**Optional integrations:**

- `UPLOADTHING_TOKEN` — cloud file storage
- `TAVILY_API_KEY` — web search for analysis
- `AZURE_DOC_INTELLIGENCE_ENDPOINT`, `AZURE_DOC_INTELLIGENCE_KEY` — OCR for scanned PDFs
- `DATALAB_API_KEY` — alternative OCR
- `LANDING_AI_API_KEY` — fallback OCR for complex documents
- `SIDECAR_URL` — FastAPI sidecar for reranking and Graph RAG (e.g. `http://localhost:8000`)
- `JOB_RUNNER` — `inngest` (default) or `trigger-dev`
- `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT` — LangSmith tracing

### 3) Start database and apply schema

```bash
chmod +x start-database.sh
./start-database.sh
pnpm db:push
```

### 4) Run app

```bash
pnpm dev
```

Open `http://localhost:3000`.

Run Inngest dev server for background jobs and dashboard:

```bash
pnpm inngest:dev
```

Dashboard: `http://localhost:8288`.

## 🐳 Docker Deployment

### Full stack 

Runs `db` + `migrate` + `app` + `sidecar` via Compose:

```bash
docker compose --env-file .env --profile dev up
```

## 📚 Documentation

- [Deployment](docs/deployment.md) — Docker, Vercel, VPS
- [Feature Workflows](docs/feature-workflows.md) — ingestion, RAG, knowledge graph
- [Usage Examples](docs/usage-examples.md) — API usage
- [Observability](docs/observability.md) — Prometheus metrics

## 🔌 API Endpoints (high-level)

- `POST /api/uploadDocument` — upload and process document (cloud or database storage)
- `POST /api/upload-local` — local upload to database storage
- `POST /api/agents/documentQ&A/AIQueryRLM` — document-grounded Q&A
- `POST /api/agents/predictive-document-analysis` — gap detection and recommendations
- `GET /api/metrics` — Prometheus metrics stream
- `POST /api/inngest` — Inngest webhook for background jobs

## 🔐 User Roles

- **Employee** — view assigned documents, use AI chat and analysis
- **Employer** — upload/manage documents, categories, and employee access

## 🧪 Useful Scripts

```bash
pnpm db:studio
pnpm db:push
pnpm check
pnpm lint
pnpm typecheck
pnpm build
pnpm start
pnpm inngest:dev
```

## 🐛 Troubleshooting

- Confirm Docker is running before DB/sidecar startup.
- If build issues occur: remove `.next` and run `pnpm install`.
- If OCR UI is missing: verify OCR provider keys in `.env`.
- If sidecar fails to start: check `SIDECAR_URL`; sidecar has ~2 min warmup for models.
- If Inngest events don't run: ensure `INNGEST_EVENT_KEY` is set and Inngest dev server is running (`pnpm inngest:dev` or `--profile dev`).
- For corrupted Docker images: remove image and rebuild with `--no-cache`.

## 🤝 Contributing

1. Create a feature branch.
2. Make changes and run `pnpm check`.
3. Open a pull request with test notes.

## 📝 License

Private and proprietary.

## 📞 Support

Open an issue in this repository or contact the development team.
