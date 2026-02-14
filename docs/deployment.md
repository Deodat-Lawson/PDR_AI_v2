# Deployment Guide

This document contains detailed deployment options for PDR AI.

## Prerequisites

- All required environment variables configured
- PostgreSQL with `pgvector` enabled
- API keys for enabled integrations

Enable pgvector:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Option 1: Docker Compose (full stack)

Recommended for local and simple self-hosted deployments.

```bash
docker compose --env-file .env up
```

Services:

- `db`: PostgreSQL + pgvector
- `migrate`: schema setup (`db:push`)
- `app`: Next.js runtime

Rebuild stack:

```bash
docker compose --env-file .env up --build
```

## Option 2: Vercel + managed PostgreSQL

1. Import repository into Vercel.
2. Configure managed PostgreSQL (Vercel Postgres, Neon, Supabase, etc.).
3. Set `DATABASE_URL` and app environment variables.
4. Deploy with Vercel defaults.
5. Apply schema once:

```bash
DATABASE_URL="your_production_db_url" pnpm db:push
```

Optional integrations:

- Inngest for resilient background jobs
- LangSmith for tracing

## Option 3: VPS self-hosted (Node + reverse proxy)

1. Install Node.js 18+, pnpm, Nginx, and PostgreSQL with pgvector.
2. Clone repo and install dependencies.
3. Configure `.env`.
4. Build and run with PM2/systemd.
5. Reverse proxy traffic via Nginx and enable TLS (Let's Encrypt).
6. Apply schema:

```bash
pnpm db:push
```

## Post-deployment Checklist

- Environment variables are set for all enabled features.
- `DATABASE_URL` points to production DB.
- `vector` extension is enabled.
- Schema has been applied (`pnpm db:push`).
- Clerk, UploadThing, and OpenAI integrations are validated.
- OCR providers validated if OCR is enabled.
- Optional Inngest and observability are validated.

## Troubleshooting

### Corrupted Docker image

```bash
docker rmi pdr_ai_v2-2-migrate --force
docker compose --env-file .env build --no-cache migrate
docker compose --env-file .env up
```

If another image fails similarly, remove and pull/rebuild it.
