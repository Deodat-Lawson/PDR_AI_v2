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

### 🎯 Tier 1: Core (3 Keys, ~$10-30/month)

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
# Your 3 required API keys:
DATABASE_URL="postgresql://postgres:password@localhost:5432/pdr_ai_v2"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
OPENAI_API_KEY="sk-..."
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your_app_id"
NODE_ENV="development"

# Pre-configured values (already in .env.example - no changes needed):
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/signup/loading"
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/signup/loading"
NEXT_PUBLIC_CLERK_SIGN_OUT_FORCE_REDIRECT_URL="/"
INNGEST_EVENT_KEY="3MA2nBGvZYDGpJPD8Yqykqc_GYt1qVe99uKnBzKthLbFAbZTrwuaa0aogww1LrYP8bAsAu-SXf4Ro5ObGbOrnw"
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

### 🔍 Predictive Document Analysis
- **Missing Documents Detection**: AI identifies referenced but missing documents
- **Priority Classification**: Automatically categorizes findings by importance
- **Smart Recommendations**: Actionable suggestions for document management
- **Related Content**: Suggests relevant external resources

### 📚 Study Agent
Two modes for interactive learning:

**StudyBuddy** (Friendly Coach):
- Document-grounded Q&A with RAG
- Voice chat (speech-to-text + optional TTS)
- Study plan tracking with goals
- Notes and Pomodoro timer

**AI Teacher** (Structured Instructor):
- Voice-led teaching
- Three surfaces: View (PDF), Edit (docs), Draw (whiteboard)
- Study plan with material links
- Interactive lessons

### 🔎 Web Search Integration
- **Enhanced**: Tavily AI (if key provided)
- **Core**: DuckDuckGo (free fallback)
- **Seamless**: Automatic fallback if Tavily unavailable

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

## Environment Variables

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

**Enable Premium Search (Tavily):**
1. Get API key: https://tavily.com/
2. Add to `.env`: `TAVILY_API_KEY="tvly-..."`
3. Restart server
4. Search automatically uses Tavily (no code changes!)

**Enable OCR Processing:**
1. Get API key: https://www.datalab.to/
2. Add to `.env`: `DATALAB_API_KEY="..."`
3. Restart server
4. OCR checkbox appears in upload UI

**Enable Voice Features:**
1. Get API key: https://elevenlabs.io/
2. Add to `.env`: `ELEVENLABS_API_KEY="..."`
3. Restart server
4. Voice chat enabled in Study Agent

---

## Use Cases

### For Students
- Upload lecture PDFs and textbooks
- Ask questions with AI-powered RAG
- Study with StudyBuddy or AI Teacher
- Track learning goals and notes

### For Legal/Compliance Teams
- Identify missing contract attachments
- Ensure regulatory documentation complete
- Risk assessment via predictive analysis
- Audit preparation

### For HR Departments
- Complete employee documentation
- Policy compliance verification
- Onboarding document tracking
- Audit readiness

### For Developers
- Learn document AI architecture
- Customize for specific domains
- Build on open-source foundation
- Contribute improvements

---

## Contributing

We welcome contributions! 🎉

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Good first issues
- Development setup
- Coding standards
- Submission guidelines

**Quick contribution ideas:**
- Add DOCX/TXT file support
- Implement export features
- Improve mobile responsiveness
- Add more AI model providers
- Enhance OCR accuracy
- Create Docker Compose setup

---

## Troubleshooting

### Build fails with "TAVILY_API_KEY required"
**Solution:** Update your code to latest version. Tavily is now optional (falls back to DuckDuckGo).

### Database connection errors
**Solution:** Ensure PostgreSQL is running and `DATABASE_URL` is correct. For local: `./start-database.sh`

### OpenAI rate limit errors
**Solution:** Upgrade to paid OpenAI account or reduce usage. Free tier has strict limits.

### OCR checkbox not appearing
**Solution:** Add `DATALAB_API_KEY` to `.env` to enable OCR features.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more troubleshooting guides.

---

## Roadmap

- [ ] Docker Compose one-click setup
- [ ] DOCX/TXT file support
- [ ] Export chat history
- [ ] Dark mode improvements
- [ ] Mobile app (React Native)
- [ ] Self-hosted AI models (Ollama)
- [ ] Multi-language support
- [ ] Advanced caching for cost reduction

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support & Community

- 📖 **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md) | [CONTRIBUTING.md](./CONTRIBUTING.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/Deodat-Lawson/pdr_ai_v2/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Deodat-Lawson/pdr_ai_v2/discussions)
- ⭐ **Star on GitHub**: [github.com/Deodat-Lawson/pdr_ai_v2](https://github.com/Deodat-Lawson/pdr_ai_v2)

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [LangChain](https://js.langchain.com/) - AI orchestration
- [Clerk](https://clerk.com/) - Authentication
- [Drizzle ORM](https://orm.drizzle.team/) - Database
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Deployment platform

---

**Built with ❤️ for the open source community**

*Get started in 5 minutes • Scale as you grow • Full control of your data*
