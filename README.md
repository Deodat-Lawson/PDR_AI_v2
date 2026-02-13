# PDR AI - Professional Document Reader AI

A Next.js application that uses advanced AI technology to analyze, interpret, and extract insights from professional documents. Features employee/employer authentication, document upload and management, AI-powered chat, and **comprehensive predictive document analysis** that identifies missing documents, provides recommendations, and suggests related content.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with TypeScript
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **AI Integration**: [OpenAI](https://openai.com/) + [LangChain](https://langchain.com/)
- **OCR Processing**: [Datalab Marker API](https://www.datalab.to/) (optional)
- **File Upload**: [UploadThing](https://uploadthing.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **pnpm** (recommended) or npm
- **Docker** (for local database)
- **Git**

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pdr_ai_v2-2
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

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
# Post-auth redirects are handled automatically by middleware based on user role
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

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
# BACKGROUND JOBS (Optional - enables reliable document processing)
# =============================================================================
# Inngest provides automatic retries, observability, and step-based execution
# Without Inngest, document processing runs synchronously (fire-and-forget)
# Get from https://www.inngest.com/ or use Vercel integration
# INNGEST_EVENT_KEY=your_inngest_event_key
# INNGEST_SIGNING_KEY=your_inngest_signing_key

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

### 4. Database Setup

#### Start Local PostgreSQL Database

```bash
# Make the script executable
chmod +x start-database.sh

# Start the database container
./start-database.sh
```

This will:
- Create a Docker container with PostgreSQL
- Set up the database with proper credentials
- Generate a secure password if using default settings

#### Run Database Migrations

```bash
# Generate migration files
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Alternative: Push schema directly (for development)
pnpm db:push
```

### 5. Set Up External Services

#### Clerk Authentication
1. Create account at [Clerk](https://clerk.com/)
2. Create a new application
3. Copy the publishable and secret keys to your `.env` file
4. Configure sign-in/sign-up methods as needed
5. Post-authentication redirects are handled automatically by the middleware based on user role

#### OpenAI API
1. Create account at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add the key to your `.env` file

#### LangChain (LangSmith) - Optional
1. Create account at [LangSmith](https://smith.langchain.com/)
2. Generate an API key from your account settings
3. Set `LANGCHAIN_TRACING_V2=true` and add `LANGCHAIN_API_KEY` to your `.env` file
4. This enables tracing and monitoring of LangChain operations for debugging and observability

#### Tavily Search API - Optional
1. Create account at [Tavily](https://tavily.com/)
2. Generate an API key from your dashboard
3. Add `TAVILY_API_KEY` to your `.env` file
4. Used for enhanced web search capabilities in document analysis features

#### Datalab Marker API - Optional
1. Create account at [Datalab](https://www.datalab.to/)
2. Navigate to the API section and generate an API key
3. Add `DATALAB_API_KEY` to your `.env` file
4. Enables advanced OCR processing for scanned documents and images in PDFs
5. When configured, an OCR checkbox will appear in the document upload interface

#### UploadThing
1. Create account at [UploadThing](https://uploadthing.com/)
2. Create a new app
3. Copy the secret and app ID to your `.env` file

## 🚀 Running the Application

### Development Mode

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Docker Deployment

Deploy the entire stack (PostgreSQL + pgvector + Next.js app) with a single command:

**Prerequisites:**
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

**Steps:**

1. Copy `.env.example` to `.env` and fill in required variables:
   - `POSTGRES_PASSWORD` (default: `password` — change for production)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `OPENAI_API_KEY`
   - Optional: `UPLOADTHING_TOKEN`, `NEXT_PUBLIC_UPLOADTHING_ENABLED`, `INNGEST_EVENT_KEY`, OCR keys, etc.

2. Start all services:
   ```bash
   docker compose up
   ```
   Or run in detached mode:
   ```bash
   docker compose up -d
   ```

3. The app will be available at `http://localhost:3000`

4. To rebuild after code changes:
   ```bash
   docker compose up --build
   ```

The compose stack runs PostgreSQL with pgvector, runs database migrations automatically, then starts the Next.js app.

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

4. **Configure build settings**
   - Build Command: `pnpm build`
   - Output Directory: `.next` (default)
   - Install Command: `pnpm install`

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on every push to your main branch

**Post-Deployment:**

1. **Enable pgvector Extension** (Required for vector search)
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

3. **(Optional) Set up Inngest Integration** for reliable background processing
   - Go to Vercel → Integrations → Browse Marketplace
   - Search for "Inngest" and click Add Integration
   - Connect your Inngest account (create one at [inngest.com](https://www.inngest.com))
   - The integration automatically sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`
   - **Benefits**: Automatic retries, step-based execution, observability dashboard
   - **Without Inngest**: Document processing runs synchronously (fire-and-forget)

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

**Database Connection:**

For production, use a managed PostgreSQL service (recommended):
- **Neon**: Fully serverless PostgreSQL with pgvector support
- **Supabase**: PostgreSQL with pgvector extension
- **AWS RDS**: Managed PostgreSQL (requires manual pgvector installation)
- **Railway**: Simple PostgreSQL hosting

**Example Neon connection string:**
```
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

### Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Database migrations have been run
- [ ] Database has pgvector extension enabled
- [ ] Clerk authentication is working
- [ ] File uploads are working (UploadThing)
- [ ] AI features are functioning (OpenAI API)
- [ ] Document processing is working (uploads and vectorization)
- [ ] (Optional) Inngest integration connected for reliable background jobs
- [ ] SSL certificate is configured (if using custom domain)
- [ ] Monitoring and logging are set up
- [ ] Backup strategy is in place

### Monitoring and Maintenance

**Health Checks:**
- Monitor application uptime
- Check database connection health
- Monitor API usage (OpenAI, UploadThing)
- Track error rates

**Backup Strategy:**
- Set up automated database backups
- Configure backup retention policy
- Test restore procedures regularly

**Scaling Considerations:**
- Database connection pooling (use PgBouncer or similar)
- CDN for static assets (Vercel handles this automatically)
- Rate limiting for API endpoints
- Caching strategy for frequently accessed data

### Other Useful Scripts

```bash
# Database management
pnpm db:studio          # Open Drizzle Studio (database GUI)
pnpm db:generate         # Generate new migrations
pnpm db:migrate          # Apply migrations
pnpm db:push             # Push schema changes directly

# Code quality
pnpm lint                # Run ESLint
pnpm lint:fix            # Fix ESLint issues
pnpm typecheck           # Run TypeScript type checking
pnpm format:write        # Format code with Prettier
pnpm format:check        # Check code formatting

# Development
pnpm check               # Run linting and type checking
pnpm preview             # Build and start production preview
```

---

## 🧭 End-to-end workflow (how the features connect)

PDR AI is designed as one connected loop: **capture documents → make them searchable → ask questions → spot gaps → act → learn**.

1. **Authenticate & pick a workspace (Employer / Employee)**  
   Clerk handles auth and role-based access so employers can manage documents + employees, while employees can view assigned materials.

2. **Upload documents (optionally OCR)**  
   Documents are uploaded via UploadThing. If a PDF is scanned/image-based, you can enable **OCR** (Datalab Marker API) to extract clean text.

3. **Index & store for retrieval**  
   The backend chunks the extracted text and generates embeddings, storing everything in PostgreSQL (+ pgvector) so downstream AI features can retrieve the right passages.

4. **Interact with documents (RAG chat + viewer)**  
   Users open a document in the viewer and ask questions. The AI uses **RAG** over your indexed chunks to answer with document-grounded context, and chat history persists per document/session.

5. **Run Predictive Document Analysis (find gaps and next steps)**  
   When you need completeness and compliance help, the predictive analyzer highlights **missing documents**, **broken references**, priority/urgency, and recommended actions (see deep dive below).

6. **Study Agent: StudyBuddy + AI Teacher (learn from your own documents)**  
   Turn uploaded PDFs into a guided study experience. The Study Agent reuses the same ingestion + indexing pipeline so both modes can answer questions with **RAG grounded in your uploaded documents**.
   - **StudyBuddy mode**: a friendly coach that helps you stay consistent (plan, notes, timer, quick Q&A)
   - **AI Teacher mode**: a structured instructor with multiple teaching surfaces (view/edit/draw) for lessons

7. **Close the loop**  
   Use insights from chat + predictive analysis + StudyBuddy sessions to upload missing docs, update categories, and keep your organization's knowledge base complete and actionable.

## Web Search Agent Workflow
<img width="1106" height="336" alt="Screenshot 2025-11-16 at 2 53 18 PM" src="https://github.com/user-attachments/assets/8c2d5ec2-a57e-4afa-97cf-1961dcb9049f" />

## 🎓 Study Agent (StudyBuddy + AI Teacher)

The Study Agent is the "learn it" layer on top of the same document ingestion + RAG stack.

### How sessions work (shared foundation)

1. **Upload or select your study documents** (same documents used for document Q&A / analysis)
2. **Start onboarding** at `/employer/studyAgent/onboarding`
3. **Choose mode**: **StudyBuddy** or **AI Teacher**
4. **Create a study session**:
   - A new session is created and you're redirected with `?sessionId=...`
   - Your **profile** (name/grade/gender/field of study) and **preferences** (selected docs, AI personality) are stored
   - An initial **study plan** is generated from the documents you selected
5. **Resume anytime**: session data is loaded using `sessionId` so conversations and study progress persist

### StudyBuddy (friendly coach)

StudyBuddy is optimized for momentum and daily studying while staying grounded in your documents.

- **Document-grounded help (RAG)**: ask questions about your selected PDFs, and the agent retrieves relevant chunks to answer.
- **Voice chat**:
  - Speech-to-text via the browser's Web Speech API
  - Optional text-to-speech via ElevenLabs (if configured)
  - Messages are persisted to your session so you can continue later
- **Study Plan (Goals)**:
  - Create/edit/delete goals
  - Mark goals complete/incomplete and track progress
  - Attach "materials" (documents) to each goal and one-click "pull up" the doc in the viewer
- **Notes**:
  - Create/update/delete notes tied to your study session
  - Tag notes and keep them organized while you study
- **Pomodoro timer**:
  - Run focus sessions alongside your plan/notes
  - Timer state can be synced to your session
- **AI Query tab**:
  - A fast Q&A surface for questions while you keep your call / plan visible

### AI Teacher (structured instructor)

AI Teacher is optimized for guided instruction and "teaching by doing" across multiple views.

- **Voice-led teaching + study plan tracking**:
  - Voice chat for interactive lessons
  - A persistent study plan with material links (click to open the relevant doc)
- **Three teaching surfaces (switchable in-session)**:
  - **View**: document viewer for reading/teaching directly from the selected PDF
  - **Edit**: a collaborative docs editor where you and the AI can build structured notes/explanations and download the result
  - **Draw**: a whiteboard for visual explanations (pen/eraser, undo/redo, clear, export as PNG)
- **AI Query tab**:
  - Ask targeted questions without interrupting the lesson flow

### Persistence & sync (what's saved)

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

```typescript
interface OCROptions {
  force_ocr?: boolean;        // Force OCR even if text exists
  use_llm?: boolean;          // Use AI for better accuracy
  output_format?: 'markdown' | 'json' | 'html';  // Output format
  strip_existing_ocr?: boolean;  // Remove existing OCR layer
}
```

#### Using the OCR Feature

1. **Configure API Key** (one-time setup):
   ```env
   DATALAB_API_KEY=your_datalab_api_key
   ```

2. **Upload Document with OCR**:
   - Navigate to the employer upload page
   - Select your document
   - Check the "Enable OCR Processing" checkbox
   - Upload the document
   - System will process with OCR and notify when complete

3. **Monitor Processing**:
   - OCR processing typically takes 1-3 minutes
   - Progress is tracked in backend logs
   - Document becomes available once processing completes

#### OCR vs Standard Processing

| Feature | Standard Processing | OCR Processing |
|---------|-------------------|----------------|
| **Best For** | Digital PDFs with embedded text | Scanned documents, images |
| **Processing Time** | < 10 seconds | 1-3 minutes |
| **Accuracy** | High for digital text | High for scanned/image text |
| **Cost** | Free (OpenAI embeddings only) | Requires Datalab API credits |
| **Handwriting Support** | No | Yes (with AI assistance) |
| **Table Extraction** | Basic | Advanced |
| **Image Analysis** | No | Yes |

#### Error Handling

The OCR system includes comprehensive error handling:
- API connection failures
- Timeout management (5-minute limit)
- Retry logic for transient errors
- Graceful fallback messages
- Detailed error logging

### Predictive Document Analysis

The predictive analysis feature automatically scans uploaded documents and provides comprehensive insights:

#### Example Analysis Response
```json
{
  "success": true,
  "documentId": 123,
  "analysisType": "predictive",
  "summary": {
    "totalMissingDocuments": 5,
    "highPriorityItems": 2,
    "totalRecommendations": 3,
    "totalSuggestedRelated": 4,
    "analysisTimestamp": "2024-01-15T10:30:00Z"
  },
  "analysis": {
    "missingDocuments": [
      {
        "documentName": "Employee Handbook",
        "documentType": "Policy Document",
        "reason": "Referenced in section 2.1 but not found in uploaded documents",
        "page": 15,
        "priority": "high",
        "suggestedLinks": [
          {
            "title": "Sample Employee Handbook Template",
            "link": "https://example.com/handbook-template",
            "snippet": "Comprehensive employee handbook template..."
          }
        ]
      }
    ],
    "recommendations": [
      "Consider implementing a document version control system",
      "Review document retention policies for compliance",
      "Establish regular document audit procedures"
    ],
    "suggestedRelatedDocuments": [
      {
        "title": "Document Management Best Practices",
        "link": "https://example.com/best-practices",
        "snippet": "Industry standards for document organization..."
      }
    ]
  }
}
```

#### Using the Analysis in Your Workflow
1. **Upload Documents**: Use the employer dashboard to upload your documents
2. **Run Analysis**: Click the "Predictive Analysis" tab in the document viewer
3. **Review Results**: Examine missing documents, recommendations, and suggestions
4. **Take Action**: Follow the provided recommendations and suggested links
5. **Track Progress**: Re-run analysis to verify improvements

### AI Chat Integration

Ask questions about your documents and get AI-powered responses:

```typescript
// Example API call for document Q&A
const response = await fetch('/api/LangChain', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "What are the key compliance requirements mentioned?",
    documentId: 123,
    style: "professional" // or "casual", "technical", "summary"
  })
});
```

## 🎯 Use Cases & Benefits

### Industries That Benefit Most

#### Legal & Compliance
- **Contract Management**: Identify missing clauses, attachments, and referenced documents
- **Regulatory Compliance**: Ensure all required documentation is present and up-to-date
- **Due Diligence**: Comprehensive document review for mergers and acquisitions
- **Risk Assessment**: Identify potential legal risks from missing documentation

#### Human Resources
- **Employee Documentation**: Ensure all required employee documents are collected
- **Policy Compliance**: Verify policy documents are complete and current
- **Onboarding Process**: Streamline new employee documentation requirements
- **Audit Preparation**: Prepare for HR audits with confidence

#### Finance & Accounting
- **Financial Reporting**: Ensure all supporting documents are included
- **Audit Trail**: Maintain complete documentation for financial audits
- **Compliance Reporting**: Meet regulatory requirements for document retention
- **Process Documentation**: Streamline financial process documentation

#### Healthcare
- **Patient Records**: Ensure complete patient documentation
- **Regulatory Compliance**: Meet healthcare documentation requirements
- **Quality Assurance**: Maintain high standards for medical documentation
- **Risk Management**: Identify potential documentation gaps

### Business Benefits

#### Time Savings
- **Automated Analysis**: Reduce manual document review time by 80%
- **Instant Insights**: Get immediate feedback on document completeness
- **Proactive Management**: Address issues before they become problems

#### Risk Reduction
- **Compliance Assurance**: Never miss critical required documents
- **Error Prevention**: Catch documentation gaps before they cause issues
- **Audit Readiness**: Always be prepared for regulatory audits

#### Process Improvement
- **Standardized Workflows**: Establish consistent document management processes
- **Quality Control**: Maintain high standards for document organization
- **Continuous Improvement**: Use AI insights to optimize processes

### ROI Metrics
- **Document Review Time**: 80% reduction in manual review time
- **Compliance Risk**: 95% reduction in missing document incidents
- **Audit Preparation**: 90% faster audit preparation time
- **Process Efficiency**: 70% improvement in document management workflows

## 📁 Project Structure

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
| `INNGEST_EVENT_KEY` | Inngest event key for reliable background jobs | ❌ | `your_inngest_event_key` |
| `INNGEST_SIGNING_KEY` | Inngest signing key for webhook verification | ❌ | `signkey-...` |
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

### Environment Variables by Feature

- **Authentication**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (redirects handled by middleware)
- **Database**: `DATABASE_URL` (PostgreSQL with pgvector)
- **AI & Embeddings**: `OPENAI_API_KEY`, `TAVILY_API_KEY`
- **Background Jobs (Optional)**: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` — enables automatic retries, step isolation, and observability. Without these, document processing runs synchronously.
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
