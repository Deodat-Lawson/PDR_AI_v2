# PDR AI v2 - Open Source Professional Document Reader

> 🚀 **Start with just 3 API keys (~$20/month), scale as you grow**

AI-powered document management system with RAG (Retrieval-Augmented Generation), predictive analysis, and intelligent search. Built for learning, transparency, and flexibility.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Why PDR AI?

- **Start small, scale later**: Core features work with just 3 API keys
- **Truly open source**: Full code access, customize to your needs
- **Modern stack**: Next.js 15, TypeScript, LangChain, pgvector
- **Vercel-optimized**: Deploy in 5 minutes with managed services
- **Educational focus**: Learn how document AI systems work

## Features by Deployment Tier

## 🎓 Study Agent (StudyBuddy + AI Teacher)

The Study Agent is the “learn it” layer on top of the same document ingestion + RAG stack.

### How sessions work (shared foundation)

1. **Upload or select your study documents** (same documents used for document Q&A / analysis)
2. **Start onboarding** at `/employer/studyAgent/onboarding`
3. **Choose mode**: **StudyBuddy** or **AI Teacher**
4. **Create a study session**:
   - A new session is created and you’re redirected with `?sessionId=...`
   - Your **profile** (name/grade/gender/field of study) and **preferences** (selected docs, AI personality) are stored
   - An initial **study plan** is generated from the documents you selected
5. **Resume anytime**: session data is loaded using `sessionId` so conversations and study progress persist

### StudyBuddy (friendly coach)

StudyBuddy is optimized for momentum and daily studying while staying grounded in your documents.

- **Document-grounded help (RAG)**: ask questions about your selected PDFs, and the agent retrieves relevant chunks to answer.
- **Voice chat**:
  - Speech-to-text via the browser’s Web Speech API
  - Optional text-to-speech via ElevenLabs (if configured)
  - Messages are persisted to your session so you can continue later
- **Study Plan (Goals)**:
  - Create/edit/delete goals
  - Mark goals complete/incomplete and track progress
  - Attach “materials” (documents) to each goal and one-click “pull up” the doc in the viewer
- **Notes**:
  - Create/update/delete notes tied to your study session
  - Tag notes and keep them organized while you study
- **Pomodoro timer**:
  - Run focus sessions alongside your plan/notes
  - Timer state can be synced to your session
- **AI Query tab**:
  - A fast Q&A surface for questions while you keep your call / plan visible

### AI Teacher (structured instructor)

AI Teacher is optimized for guided instruction and “teaching by doing” across multiple views.

- **Voice-led teaching + study plan tracking**:
  - Voice chat for interactive lessons
  - A persistent study plan with material links (click to open the relevant doc)
- **Three teaching surfaces (switchable in-session)**:
  - **View**: document viewer for reading/teaching directly from the selected PDF
  - **Edit**: a collaborative docs editor where you and the AI can build structured notes/explanations and download the result
  - **Draw**: a whiteboard for visual explanations (pen/eraser, undo/redo, clear, export as PNG)
- **AI Query tab**:
  - Ask targeted questions without interrupting the lesson flow

### Persistence & sync (what’s saved)

Per `sessionId`, the Study Agent persists:
- **messages** (StudyBuddy/Teacher conversations)
- **study goals** (plan items + completion state + attached materials)
- **notes** (StudyBuddy notes + updates)
- **preferences/profile** (selected documents and learner context)

Key API surfaces used by the Study Agent:
- `POST /api/study-agent/me/session` (create session)
- `GET /api/study-agent/me?sessionId=...` (load session data)
- `POST /api/study-agent/chat` (RAG chat + optional agentic tools for notes/tasks/timer)
- `POST /api/study-agent/me/messages` (persist chat messages)
- `POST/PUT/DELETE /api/study-agent/me/study-goals` (plan CRUD)
- `POST /api/study-agent/sync/notes` (notes sync)

## 📚 Improved Knowledge Base Formation

PDR AI uses a sophisticated **Hybrid Retrieval-Augmented Generation (RAG)** architecture that combines multiple retrieval strategies for optimal document search and Q&A accuracy.

### Knowledge Base Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOCUMENT INGESTION PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│  Upload → OCR/Parse → Intelligent Chunking → Vectorization      │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   PostgreSQL + pgvector                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │  Documents   │  │  PDF Chunks  │  │  Embeddings  │   │    │
│  │  │  (metadata)  │  │  (content)   │  │  (1536-dim)  │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ENSEMBLE RETRIEVAL SYSTEM                     │
├─────────────────────────────────────────────────────────────────┤
│                          Query                                   │
│                            ↓                                     │
│  ┌────────────────────┐       ┌────────────────────┐            │
│  │   BM25 Retriever   │       │  Vector Retriever  │            │
│  │   (Keyword/Lexical)│       │   (Semantic/ANN)   │            │
│  │   Weight: 0.4      │       │   Weight: 0.6      │            │
│  └─────────┬──────────┘       └─────────┬──────────┘            │
│            │                            │                        │
│            └──────────┬─────────────────┘                        │
│                       ↓                                          │
│         ┌─────────────────────────┐                             │
│         │  Reciprocal Rank Fusion │                             │
│         │      (RRF Merge)        │                             │
│         └───────────┬─────────────┘                             │
│                     ↓                                            │
│              Ranked Results                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Retrieval Components

| Component | Description | Strength |
|-----------|-------------|----------|
| **BM25 Retriever** | Keyword-based lexical search using TF-IDF scoring | Exact term matching, acronyms, proper nouns |
| **Vector Retriever** | Semantic search using OpenAI `text-embedding-3-small` embeddings (1536 dimensions) | Conceptual similarity, paraphrasing, synonyms |
| **Ensemble Retriever** | Combines BM25 + Vector with Reciprocal Rank Fusion | Best of both approaches |

### Search Scopes

The retrieval system supports three search scopes:

- **Document Scope**: Search within a single document for focused Q&A
- **Company Scope**: Search across all documents in a company's knowledge base
- **Multi-Document Scope**: Search across a selected subset of documents (used by Study Agent)

### Chunking Strategy

Documents are intelligently chunked using the following configuration:

```typescript
{
  maxTokens: 500,        // ~2000 characters per chunk
  overlapTokens: 50,     // ~200 characters overlap for context continuity
  charsPerToken: 4,      // Character-to-token ratio
  includePageContext: true  // Preserve page metadata
}
```

**Chunk Types:**
- **Text Chunks**: Prose content split at sentence boundaries with overlap
- **Table Chunks**: Structured data preserved as markdown with semantic descriptions

### Data Storage Schema

```sql
-- PDF Chunks table with vector embeddings
CREATE TABLE pdr_ai_v2_pdf_chunks (
  id SERIAL PRIMARY KEY,
  document_id BIGINT REFERENCES document(id),
  page INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536)  -- pgvector type
);

-- Indexes for fast retrieval
CREATE INDEX ON pdf_chunks (document_id);
CREATE INDEX ON pdf_chunks (document_id, page, chunk_index);
```

### Fallback Mechanisms

The system includes automatic fallback:
1. **Primary**: Ensemble (BM25 + Vector) retrieval
2. **Fallback**: BM25-only retrieval if vector search fails
3. **Graceful degradation**: Returns empty results rather than errors

## 🔍 Predictive Document Analysis Deep Dive

The **Predictive Document Analysis** feature is the cornerstone of PDR AI, providing intelligent document management and compliance assistance:

### How It Works
1. **Document Upload**: Upload your professional documents (PDFs, contracts, manuals, etc.)
2. **AI Analysis**: Our advanced AI scans through the document content and structure
3. **Missing Document Detection**: Identifies references to documents that should be present but aren't
4. **Priority Classification**: Automatically categorizes findings by importance and urgency
5. **Smart Recommendations**: Provides specific, actionable recommendations for document management
6. **Related Content**: Suggests relevant external resources and related documents

### Key Benefits
- **Compliance Assurance**: Never miss critical documents required for compliance
- **Workflow Optimization**: Streamline document management with AI-powered insights
- **Risk Mitigation**: Identify potential gaps in documentation before they become issues
- **Time Savings**: Automated analysis saves hours of manual document review
- **Proactive Management**: Stay ahead of document requirements and deadlines

### Analysis Output
The system provides comprehensive analysis including:
- **Missing Documents Count**: Total number of missing documents identified
- **High Priority Items**: Critical documents requiring immediate attention
- **Recommendations**: Specific actions to improve document organization
- **Suggested Related Documents**: External resources and related content
- **Page References**: Exact page numbers where missing documents are mentioned

## 📖 Usage Examples

### OCR Processing for Scanned Documents

PDR AI includes optional advanced OCR (Optical Character Recognition) capabilities for processing scanned documents, images, and PDFs with poor text extraction:

#### When to Use OCR
- **Scanned Documents**: Physical documents that have been scanned to PDF
- **Image-based PDFs**: PDFs that contain images of text rather than actual text
- **Poor Quality Documents**: Documents with low-quality text that standard extraction can't read
- **Handwritten Content**: Documents with handwritten notes or forms (with AI assistance)
- **Mixed Content**: Documents combining text, images, tables, and diagrams

#### How It Works

**Backend Infrastructure:**
1. **Environment Configuration**: Set `DATALAB_API_KEY` in your `.env` file (optional)
2. **Database Schema**: Tracks OCR status with fields:
   - `ocrEnabled`: Boolean flag indicating if OCR was requested
   - `ocrProcessed`: Boolean flag indicating if OCR completed successfully
   - `ocrMetadata`: JSON field storing OCR processing details (page count, processing time, etc.)

3. **OCR Service Module** (`src/app/api/services/ocrService.ts`):
   - Complete Datalab Marker API integration
   - Asynchronous submission and polling architecture
   - Configurable processing options (force_ocr, use_llm, output_format)
   - Comprehensive error handling and retry logic
   - Timeout management (5 minutes default)

4. **Upload API Enhancement** (`src/app/api/uploadDocument/route.ts`):
   - **Dual-path processing**:
     - OCR Path: Uses Datalab Marker API when `enableOCR=true`
     - Standard Path: Uses traditional PDFLoader for regular PDFs
   - Unified chunking and embedding pipeline
   - Stores OCR metadata with document records

**Frontend Integration:**
1. **Upload Form UI**: OCR checkbox appears when `DATALAB_API_KEY` is configured
2. **Form Validation**: Schema validates `enableOCR` field
3. **User Guidance**: Help text explains when to use OCR
4. **Dark Theme Support**: Custom checkbox styling for both light and dark modes

#### Processing Flow

```typescript
// Standard PDF Upload (enableOCR: false or not set)
1. Download PDF from URL
2. Extract text using PDFLoader
3. Split into chunks
4. Generate embeddings
5. Store in database

// OCR-Enhanced Upload (enableOCR: true)
1. Download PDF from URL
2. Submit to Datalab Marker API
3. Poll for completion (up to 5 minutes)
4. Receive markdown/HTML/JSON output
5. Split into chunks
6. Generate embeddings
7. Store in database with OCR metadata
```

#### OCR Configuration Options

The essentials - everything you need to get started with AI-powered document management.

**What works:**
- ✅ **Document Upload & Management** (PDF)
- ✅ **AI-Powered Chat** (GPT-4) with document context
- ✅ **RAG Search** (Retrieval-Augmented Generation)
- ✅ **Basic Web Search** (DuckDuckGo, free)
- ✅ **Document Viewer** with annotations
- ✅ **Employee/Employer Dashboards**
- ✅ **Study Agent** (StudyBuddy & AI Teacher modes)
- ✅ **Predictive Document Analysis** (find missing docs)

**Required APIs:**
- **OpenAI** (embeddings + chat): $10-30/mo
- **Clerk** (authentication): Free (up to 500 MAU)
- **UploadThing** (file storage): Free (100GB/month)
- **Database**: Free (Neon free tier or local PostgreSQL)

**Total cost:** ~$10-30/month

---

### ⚡ Tier 2: Enhanced (+2-3 Keys, ~$20-60/month)

Add premium features for professional document processing.

**Additional features:**
- ✅ **Premium Search** (Tavily AI, $0.05/search)
- ✅ **OCR Processing** (Datalab/Azure, $0.30-2/page)
- ✅ **Voice Chat** (ElevenLabs, $0.30/1K chars)

**Optional APIs** (add as needed):
- **Tavily** (enhanced search, fallback: DuckDuckGo)
- **Datalab/Azure** (OCR, fallback: text-only PDFs)
- **ElevenLabs** (TTS, fallback: browser TTS)

**Total cost:** ~$20-60/month

---

### 🚀 Tier 3: Full (+2 Keys, ~$40-160/month)

Multi-model AI support for advanced use cases.

**Additional features:**
- ✅ **Multi-Model AI** (Claude, Gemini)
- ✅ **Model Comparison**
- ✅ **Advanced Reasoning**

**Optional APIs:**
- **Anthropic** (Claude models)
- **Google AI** (Gemini models - generous free tier!)

**Total cost:** ~$40-160/month

---

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- pnpm (recommended) or npm
- Git

### Step 1: Clone & Install

```bash
git clone https://github.com/Deodat-Lawson/pdr_ai_v2.git
cd pdr_ai_v2
pnpm install
```

### Step 2: Get API Keys (3 Required)

**Tier 1 Keys (Required):**
1. **OpenAI**: https://platform.openai.com/ → Create API key
2. **Clerk**: https://clerk.com/ → Create application → Copy keys
3. **UploadThing**: https://uploadthing.com/ → Create app → Copy secret & app ID

### Step 3: Configure Environment

```bash
cp .env.example .env
# Edit .env and add your 3 API keys
```

**Minimum .env contents (just add your 3 API keys):**
```env
# =============================================================================
# DATABASE
# =============================================================================
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
# For local development using Docker: postgresql://postgres:password@localhost:5432/pdr_ai_v2
# For production: Use your production PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/pdr_ai_v2"

# =============================================================================
# AUTHENTICATION (Clerk)
# =============================================================================
# Get from https://clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk Force Redirect URLs (Optional)
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=https://your-domain.com/employer/home
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=https://your-domain.com/signup
NEXT_PUBLIC_CLERK_SIGN_OUT_FORCE_REDIRECT_URL=https://your-domain.com/

# =============================================================================
# AI & EMBEDDINGS
# =============================================================================
# OpenAI API (get from https://platform.openai.com/)
# Required for AI features: document analysis, embeddings, chat functionality
OPENAI_API_KEY=your_openai_api_key

# Tavily Search API (get from https://tavily.com/)
# Required for web search capabilities in document analysis
TAVILY_API_KEY=your_tavily_api_key

# =============================================================================
# FILE UPLOADS
# =============================================================================
# UploadThing (get from https://uploadthing.com/)
# Required for file uploads (PDF documents)
UPLOADTHING_TOKEN=your_uploadthing_token

# =============================================================================
# BACKGROUND JOBS (Inngest)
# =============================================================================
# Get from https://www.inngest.com/ (required for production)
# For local development, these are optional if using `npx inngest-cli dev`
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# =============================================================================
# OCR PROVIDERS (Optional)
# =============================================================================
# Azure Document Intelligence (primary OCR provider)
# Get from https://azure.microsoft.com/en-us/products/ai-services/ai-document-intelligence
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOC_INTELLIGENCE_KEY=your_azure_key

# Landing.AI (fallback for complex/handwritten documents)
# Get from https://landing.ai/
LANDING_AI_API_KEY=your_landing_ai_key

# Datalab Marker API (legacy OCR option)
# Get from https://www.datalab.to/
DATALAB_API_KEY=your_datalab_api_key

# =============================================================================
# OBSERVABILITY (Optional)
# =============================================================================
# LangChain/LangSmith (get from https://smith.langchain.com/)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_PROJECT=pdr-ai-production

# =============================================================================
# ENVIRONMENT
# =============================================================================
# Options: development, test, production
NODE_ENV=development

# Optional: Skip environment validation (useful for Docker builds)
# SKIP_ENV_VALIDATION=false
```

### Step 4: Start Database & Run

```bash
# Start local PostgreSQL (Docker required)
./start-database.sh

# Apply database schema
pnpm db:push

# Start development server
pnpm dev
```

Visit **http://localhost:3000** 🎉

---

## Deploy to Vercel (5 Minutes)

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Option 2: Manual Deploy

**1. Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

**2. Create Neon Database (Free)**
- Go to [neon.tech](https://neon.tech)
- Create new project (PostgreSQL 15+)
- Copy connection string
- Run in Neon SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`

**3. Import to Vercel**
- Go to [vercel.com](https://vercel.com/new)
- Import your GitHub repository
- Add environment variables:
  ```
  DATABASE_URL=<your_neon_connection_string>
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  OPENAI_API_KEY=sk-...
  UPLOADTHING_SECRET=sk_live_...
  UPLOADTHING_APP_ID=your_app_id
  NODE_ENV=production
  ```

**4. Deploy!**
- Click "Deploy"
- Wait ~2 minutes
- Your app is live! 🚀

**5. Run Migrations** (One-time)
```bash
# Install Vercel CLI
pnpm install -g vercel

# Pull production env vars
vercel env pull .env.production

# Run migrations
DATABASE_URL="<production_db_url>" pnpm db:migrate
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides (Vercel, Docker, VPS).

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) + TypeScript |
| **Authentication** | Clerk |
| **Database** | PostgreSQL + pgvector (Neon recommended) |
| **AI/LLM** | OpenAI + LangChain |
| **File Storage** | UploadThing |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Package Manager** | pnpm |
| **Deployment** | Vercel (recommended) |

---

## Core Features

### 📄 Document Management
- **Upload PDFs** with automatic text extraction
- **OCR Support** (optional) for scanned documents
- **Document Viewer** with annotations and highlighting
- **Categories** for organization
- **Employee/Employer** role-based access

### 🤖 AI-Powered Chat
- **RAG Search**: Ask questions about your documents
- **Multi-Model**: OpenAI, Claude, Gemini support
- **Context-Aware**: Remembers conversation history
- **Style Options**: Concise, detailed, academic, bullet-points

### Running Inngest (Required for Background Jobs)

PDR AI uses [Inngest](https://www.inngest.com/) for background job processing, including document OCR pipelines and async processing. **Inngest must be running for document processing to work.**

#### Development Mode (Local)

1. **Install the Inngest CLI** (one-time setup):
   ```bash
   # Using npm
   npm install -g inngest-cli
   
   # Or using Homebrew (macOS)
   brew install inngest/inngest/inngest
   ```

2. **Start the Inngest Dev Server** (in a separate terminal):
   ```bash
   npx inngest-cli@latest dev
   ```
   
   This starts the Inngest Dev Server at `http://localhost:8288` which provides:
   - A local dashboard to monitor jobs
   - Event replay and debugging
   - Function execution logs

3. **Verify connection**: 
   - Visit `http://localhost:8288` to see the Inngest dashboard
   - Your functions should appear under the "Functions" tab

#### Production Mode (Vercel)

For Vercel deployments, Inngest runs as a serverless integration:

1. **Add Inngest Integration on Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to **Integrations** → **Browse Marketplace**
   - Search for "Inngest" and click **Add Integration**
   - Follow the prompts to connect your Inngest account

2. **Configure Environment Variables** (auto-set by integration, or manual):
   ```env
   INNGEST_EVENT_KEY=your_inngest_event_key
   INNGEST_SIGNING_KEY=your_inngest_signing_key
   ```

3. **Sync Functions**:
   - Deploy your app to Vercel
   - Inngest will automatically discover functions at `/api/inngest`
   - Visit your [Inngest Dashboard](https://app.inngest.com) to verify

4. **Production URL Configuration**:
   - In Inngest Dashboard, ensure your production URL is registered
   - The endpoint should be: `https://your-domain.com/api/inngest`

#### Inngest Functions in This Project

| Function | Event | Description |
|----------|-------|-------------|
| `process-document` | `document/process.requested` | OCR-to-Vector document pipeline (router → normalize → chunk → vectorize → store) |

### Production Build

### 📚 Study Agent
Two modes for interactive learning:

**StudyBuddy** (Friendly Coach):
- Document-grounded Q&A with RAG
- Voice chat (speech-to-text + optional TTS)
- Study plan tracking with goals
- Notes and Pomodoro timer

## 🚀 Deployment Guide

### Prerequisites for Production

Before deploying, ensure you have:
- ✅ All environment variables configured
- ✅ Production database set up (PostgreSQL with pgvector extension)
- ✅ API keys for all external services
- ✅ Domain name configured (if using custom domain)

### Deployment Options

#### 1. Vercel (Recommended for Next.js)

Vercel is the recommended platform for Next.js applications:

**Steps:**

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Import repository on Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository

3. **Set up Database and Environment Variables**
   
   **Database Setup:**
   
   **Option A: Using Vercel Postgres (Recommended)**
   - In Vercel dashboard, go to Storage → Create Database → Postgres
   - Choose a region and create the database
   - Vercel will automatically create the `DATABASE_URL` environment variable
   - Enable pgvector extension: Connect to your database and run `CREATE EXTENSION IF NOT EXISTS vector;`
   
   **Option B: Using Neon Database (Recommended for pgvector support)**
   - Create a Neon account at [neon.tech](https://neon.tech) if you don't have one
   - Create a new project in Neon dashboard
   - Choose PostgreSQL version 14 or higher
   - In Vercel dashboard, go to your project → Storage tab
   - Click "Create Database" or "Browse Marketplace"
   - Select "Neon" from the integrations
   - Click "Connect" or "Add Integration"
   - Authenticate with your Neon account
   - Select your Neon project and branch
   - Vercel will automatically create the `DATABASE_URL` environment variable from Neon
   - You may also see additional Neon-related variables like:
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`
     - Your application uses `DATABASE_URL`, so ensure this is set correctly
   - Enable pgvector extension in Neon:
     - Go to Neon dashboard → SQL Editor
     - Run: `CREATE EXTENSION IF NOT EXISTS vector;`
     - Or use Neon's SQL editor to enable the extension
   
   **Option C: Using External Database (Manual Setup)**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Click "Add New"
   - Key: `DATABASE_URL`
   - Value: Your PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database`)
   - Select environments: Production, Preview, Development (as needed)
   - Click "Save"
   
   **Add Other Environment Variables:**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all required environment variables:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `OPENAI_API_KEY`
     - `UPLOADTHING_SECRET`
     - `UPLOADTHING_APP_ID`
     - `NODE_ENV=production`
     - `LANGCHAIN_TRACING_V2=true` (optional, for LangSmith tracing)
     - `LANGCHAIN_API_KEY` (optional, required if `LANGCHAIN_TRACING_V2=true`)
     - `TAVILY_API_KEY` (optional, for enhanced web search)
     - `DATALAB_API_KEY` (optional, for OCR processing)
     - `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` (optional)
     - `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` (optional)
     - `NEXT_PUBLIC_CLERK_SIGN_OUT_FORCE_REDIRECT_URL` (optional)

4. **Configure build settings**
   - Build Command: `pnpm build`
   - Output Directory: `.next` (default)
   - Install Command: `pnpm install`

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on every push to your main branch

**Post-Deployment:**

1. **Enable pgvector Extension** (Required)
   - **For Vercel Postgres**: Connect to your database using Vercel's database connection tool or SQL editor in the Storage dashboard
   - **For Neon**: Go to Neon dashboard → SQL Editor and run the command
   - **For External Database**: Connect using your preferred PostgreSQL client
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

2. **Run Database Migrations**
   - After deployment, run migrations using one of these methods:
     ```bash
     # Option 1: Using Vercel CLI locally
     vercel env pull .env.local
     pnpm db:migrate
     
     # Option 2: Using direct connection (set DATABASE_URL locally)
     DATABASE_URL="your_production_db_url" pnpm db:migrate
     
     # Option 3: Using Drizzle Studio with production URL
     DATABASE_URL="your_production_db_url" pnpm db:studio
     ```

3. **Set up Inngest Integration** (Required for background jobs)
   - Go to Vercel → Integrations → Browse Marketplace
   - Search for "Inngest" and click Add Integration
   - Connect your Inngest account (create one at [inngest.com](https://www.inngest.com))
   - The integration automatically sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`
   - Visit your [Inngest Dashboard](https://app.inngest.com) to verify functions are synced
   - Endpoint: `https://your-domain.com/api/inngest`

4. **Set up Clerk webhooks** (if needed)
   - Configure webhook URL in Clerk dashboard
   - URL format: `https://your-domain.com/api/webhooks/clerk`

5. **Configure UploadThing**
   - Add your production domain to UploadThing allowed origins
   - Configure CORS settings in UploadThing dashboard

#### 2. Self-Hosted VPS Deployment

**Prerequisites:**
- VPS with Node.js 18+ installed
- PostgreSQL database (with pgvector extension)
- Nginx (for reverse proxy)
- PM2 or similar process manager

**Steps:**

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd pdr_ai_v2-2
   pnpm install
   ```

2. **Configure environment variables**
   ```bash
   # Create .env file
   nano .env
   # Add all production environment variables
   ```

3. **Build the application**
   ```bash
   pnpm build
   ```

4. **Set up PM2**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start the application
   pm2 start pnpm --name "pdr-ai" -- start
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

6. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

7. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

### Production Database Setup

**Important:** Your production database must have the `pgvector` extension enabled:

```sql
-- Connect to your PostgreSQL database
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Project Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── LangChain/        # RAG chat endpoint
│   │   ├── uploadDocument/   # Upload + embeddings
│   │   ├── predictive-document-analysis/  # AI analysis
│   │   └── study-agent/      # Study agent endpoints
│   ├── employee/             # Employee dashboard
│   ├── employer/             # Employer dashboard
│   └── _components/          # Shared components
├── lib/
│   ├── featureFlags.ts       # Auto-detect enabled features
│   ├── searchService.ts      # Unified search (Tavily/DDG)
│   └── ai/                   # AI utilities
├── server/
│   └── db/                   # Database schema (Drizzle ORM)
└── env.ts                    # Environment validation
```

---

- [ ] Verify all environment variables are set correctly
- [ ] Database migrations have been run
- [ ] Database has pgvector extension enabled
- [ ] Clerk authentication is working
- [ ] File uploads are working (UploadThing)
- [ ] AI features are functioning (OpenAI API)
- [ ] **Inngest integration is connected and functions are synced**
- [ ] Background document processing is working
- [ ] SSL certificate is configured (if using custom domain)
- [ ] Monitoring and logging are set up
- [ ] Backup strategy is in place

### Required (Tier 1)
| Variable | Description | Get From |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Local or [Neon](https://neon.tech) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | [Clerk Dashboard](https://clerk.com) |
| `CLERK_SECRET_KEY` | Clerk secret key | [Clerk Dashboard](https://clerk.com) |
| `OPENAI_API_KEY` | OpenAI API key | [OpenAI Platform](https://platform.openai.com) |
| `UPLOADTHING_SECRET` | UploadThing secret | [UploadThing](https://uploadthing.com) |
| `UPLOADTHING_APP_ID` | UploadThing app ID | [UploadThing](https://uploadthing.com) |

### Optional (Tier 2+)
| Variable | Description | Fallback |
|----------|-------------|----------|
| `TAVILY_API_KEY` | Enhanced web search | DuckDuckGo (free) |
| `DATALAB_API_KEY` | OCR processing | Text-only PDFs |
| `ELEVENLABS_API_KEY` | Voice synthesis | Browser TTS |
| `ANTHROPIC_API_KEY` | Claude models | OpenAI only |
| `GOOGLE_AI_API_KEY` | Gemini models | OpenAI only |

See [.env.example](./.env.example) for complete configuration guide with cost estimates.

---

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server (with Turbopack)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm preview          # Build and start (preview mode)

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Apply migrations
pnpm db:push          # Push schema changes (dev)
pnpm db:studio        # Open Drizzle Studio GUI

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm typecheck        # TypeScript type checking
pnpm check            # Lint + typecheck
pnpm format:write     # Format with Prettier
pnpm format:check     # Check formatting
```

### Adding Optional Features

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── agents/
│   │   │   ├── predictive-document-analysis/  # Predictive analysis endpoints
│   │   │   ├── route.ts   # Main analysis API
│   │   │   └── agent.ts   # AI analysis agent
│   │   ├── services/      # Backend services
│   │   │   └── ocrService.ts  # OCR processing service
│   │   ├── uploadDocument/  # Document upload endpoint
│   │   ├── LangChain/     # AI chat functionality
│   │   └── ...            # Other API endpoints
│   ├── employee/          # Employee dashboard pages
│   ├── employer/          # Employer dashboard pages
│   │   ├── documents/     # Document viewer with predictive analysis
│   │   └── upload/        # Document upload with OCR option
│   ├── signup/            # Authentication pages
│   └── _components/       # Shared components
├── server/
│   └── db/               # Database configuration and schema
├── styles/               # CSS modules and global styles
└── env.js                # Environment validation

Key directories:
- `/employee` - Employee interface for document viewing and chat
- `/employer` - Employer interface for management and uploads
- `/api/agents/predictive-document-analysis` - Core predictive analysis functionality
- `/api/services` - Reusable backend services (OCR, etc.)
- `/api/uploadDocument` - Document upload with OCR support
- `/api` - Backend API endpoints for all functionality
- `/server/db` - Database schema and configuration
```

## 🔌 API Endpoints

### Predictive Document Analysis
- `POST /api/agents/predictive-document-analysis` - Analyze documents for missing content and recommendations
- `GET /api/fetchDocument` - Retrieve document content for analysis

### Document Upload & Processing
- `POST /api/uploadDocument` - Upload documents for processing (supports OCR via `enableOCR` parameter)
  - Standard path: Uses PDFLoader for digital PDFs
  - OCR path: Uses Datalab Marker API for scanned documents
  - Returns document metadata including OCR processing status

### AI Chat & Q&A
- `POST /api/LangChain` - AI-powered document Q&A
- `GET /api/Questions/fetch` - Retrieve Q&A history
- `POST /api/Questions/add` - Add new questions

### Document Management
- `GET /api/fetchCompany` - Get company documents
- `POST /api/deleteDocument` - Remove documents
- `GET /api/Categories/GetCategories` - Get document categories

### Observability
- `GET /api/metrics` - Prometheus-compatible metrics stream (see `docs/observability.md` for dashboard ideas)

## 🔐 User Roles & Permissions

### Employee
- View assigned documents
- Chat with AI about documents
- Access document analysis and insights
- Pending approval flow for new employees

### Employer
- Upload and manage documents
- Manage employee access and approvals
- View analytics and statistics
- Configure document categories
- Employee management dashboard

## 🛡️ Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string with pgvector extension | ✅ | `postgresql://postgres:password@localhost:5432/pdr_ai_v2` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (client-side) | ✅ | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) | ✅ | `sk_test_...` |
| `OPENAI_API_KEY` | OpenAI API key for AI features (embeddings, chat, analysis) | ✅ | `sk-...` |
| `TAVILY_API_KEY` | Tavily Search API for web search in document analysis | ✅ | `tvly-...` |
| `UPLOADTHING_TOKEN` | UploadThing token for file uploads | ✅ | `your_uploadthing_token` |
| `INNGEST_EVENT_KEY` | Inngest event key for background jobs (required for production) | ✅* | `your_inngest_event_key` |
| `INNGEST_SIGNING_KEY` | Inngest signing key for webhook verification | ✅* | `signkey-...` |
| `AZURE_DOC_INTELLIGENCE_ENDPOINT` | Azure Document Intelligence endpoint for OCR | ❌ | `https://your-resource.cognitiveservices.azure.com/` |
| `AZURE_DOC_INTELLIGENCE_KEY` | Azure Document Intelligence API key | ❌ | `your_azure_key` |
| `LANDING_AI_API_KEY` | Landing.AI API key for complex/handwritten document OCR | ❌ | `your_landing_ai_key` |
| `DATALAB_API_KEY` | Datalab Marker API key (legacy OCR option) | ❌ | `your_datalab_key` |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing (`true`/`false`) | ❌ | `true` |
| `LANGCHAIN_API_KEY` | LangSmith API key for tracing | ❌ | `lsv2_...` |
| `LANGCHAIN_PROJECT` | LangSmith project name | ❌ | `pdr-ai-production` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for StudyBuddy voice | ❌ | `your_elevenlabs_key` |
| `ELEVENLABS_VOICE_ID` | Default ElevenLabs voice ID | ❌ | `21m00Tcm4TlvDq8ikWAM` |
| `NODE_ENV` | Environment mode (`development`, `test`, `production`) | ✅ | `development` |
| `SKIP_ENV_VALIDATION` | Skip environment validation during build | ❌ | `true` |

*Required for production; optional in development when using `npx inngest-cli dev`

### Environment Variables by Feature

- **Authentication**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- **Authentication Redirects** (optional): `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_OUT_FORCE_REDIRECT_URL`
- **Database**: `DATABASE_URL` (PostgreSQL with pgvector)
- **AI & Embeddings**: `OPENAI_API_KEY`, `TAVILY_API_KEY`
- **Background Jobs**: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- **File Uploads**: `UPLOADTHING_TOKEN`
- **OCR Processing**: `AZURE_DOC_INTELLIGENCE_ENDPOINT`, `AZURE_DOC_INTELLIGENCE_KEY`, `LANDING_AI_API_KEY`, `DATALAB_API_KEY`
- **Observability**: `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`
- **Study Agent Voice**: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- **Build Configuration**: `NODE_ENV`, `SKIP_ENV_VALIDATION`

## 🐛 Troubleshooting

### Database Issues
- Ensure Docker is running before starting the database
- Check if the database container is running: `docker ps`
- Restart the database: `docker restart pdr_ai_v2-postgres`

### Environment Issues
- Verify all required environment variables are set
- Check `.env` file formatting (no spaces around `=`)
- Ensure API keys are valid and have proper permissions

### Build Issues
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Check TypeScript errors: `pnpm typecheck`

### OCR Processing Issues
- **OCR checkbox not appearing**: Verify `DATALAB_API_KEY` is set in your `.env` file
- **OCR processing timeout**: Documents taking longer than 5 minutes will timeout; try with smaller documents first
- **OCR processing failed**: Check API key validity and Datalab service status
- **Poor OCR quality**: Enable `use_llm: true` option in OCR configuration for AI-enhanced accuracy
- **Cost concerns**: OCR uses Datalab API credits; use only for scanned/image-based documents

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting: `pnpm check`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

This project is private and proprietary.

## 📞 Support

For support or questions, contact the development team or create an issue in the repository.
