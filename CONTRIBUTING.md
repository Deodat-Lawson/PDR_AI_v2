# Contributing to PDR AI v2

Thank you for your interest in contributing to PDR AI! We welcome contributions from the community.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/pdr_ai_v2.git
cd pdr_ai_v2
```

### 2. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Get minimum API keys (see README.md - Tier 1)
# - OpenAI
# - Clerk
# - UploadThing

# Start local database
./start-database.sh

# Apply schema
pnpm db:push

# Start dev server
pnpm dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

## Development Workflow

### Code Quality

Before submitting, ensure your code passes all checks:

```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm typecheck

# Format code
pnpm format:write

# Run all checks
pnpm check
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch
```

### Database Changes

If you modify the database schema:

```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:migrate

# Or push directly (dev only)
pnpm db:push
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Document complex types with JSDoc comments
- Prefer `type` for unions/intersections, `interface` for object shapes

**Example:**
```typescript
/**
 * Configuration for web search
 */
export interface SearchConfig {
  /** Maximum results to return */
  maxResults: number;
  /** Search depth level */
  depth: "basic" | "advanced";
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for prop types

**Example:**
```typescript
interface DocumentCardProps {
  documentId: number;
  title: string;
  onDelete?: () => void;
}

export function DocumentCard({ documentId, title, onDelete }: DocumentCardProps) {
  // Component implementation
}
```

### API Routes

- Use Next.js App Router conventions (`route.ts`)
- Validate inputs with Zod
- Handle errors gracefully
- Return consistent response formats

**Example:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = requestSchema.parse(body);

    // Process request

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
```

### Database Queries

- Use Drizzle ORM for all database operations
- Add proper indexes for performance
- Use transactions for multiple operations
- Handle database errors gracefully

**Example:**
```typescript
import { db } from "~/server/db";
import { documents } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Query
const document = await db.query.documents.findFirst({
  where: eq(documents.id, documentId),
});

// Insert
await db.insert(documents).values({
  title: "New Document",
  content: "...",
});
```

## Good First Issues

Looking for a place to start? Try these:

### Easy (1-2 hours)
- [ ] Add DOCX file support
- [ ] Export chat history as JSON
- [ ] Add dark mode toggle persistence
- [ ] Improve mobile responsiveness
- [ ] Add loading skeletons to dashboard

### Medium (2-4 hours)
- [ ] Implement pagination for document list
- [ ] Add document search/filter functionality
- [ ] Create Docker Compose setup
- [ ] Add support for TXT file uploads
- [ ] Implement document tags/labels

### Advanced (4+ hours)
- [ ] Add support for Ollama (local AI models)
- [ ] Implement caching layer for OpenAI calls
- [ ] Add multi-language support (i18n)
- [ ] Create mobile app with React Native
- [ ] Implement real-time collaboration

## Feature Flags

When adding optional features, use the feature flags system:

```typescript
import { features } from "~/lib/featureFlags";

if (features.ocr.enabled) {
  // Use OCR feature
} else {
  // Fallback behavior
}
```

This ensures graceful degradation when API keys aren't provided.

## Pull Request Process

### 1. Ensure Quality

- [ ] Code passes `pnpm check` (lint + typecheck)
- [ ] Tests pass (`pnpm test`)
- [ ] No console errors in browser
- [ ] Works with minimum API keys (Tier 1)

### 2. Update Documentation

- [ ] Update README.md if adding features
- [ ] Add JSDoc comments to new functions
- [ ] Update .env.example if adding environment variables
- [ ] Add comments explaining complex logic

### 3. Submit PR

- Write a clear PR title: `feat: Add document export` or `fix: Resolve upload error`
- Describe what changed and why
- Reference related issues: `Closes #123`
- Add screenshots for UI changes

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code passes linting and type checking
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Works with Tier 1 (minimum API keys)
```

### 4. Code Review

- Address reviewer feedback promptly
- Keep discussions focused and respectful
- Push fixes to the same branch

### 5. Merge

Once approved, a maintainer will merge your PR. Thank you for contributing! 🎉

## Project Goals

When contributing, keep these goals in mind:

1. **Accessibility**: Start with 3 API keys, scale as needed
2. **Transparency**: Educational open-source code
3. **Flexibility**: Support multiple providers with fallbacks
4. **Quality**: Well-typed, tested, documented code
5. **Performance**: Optimize for cost and speed

## Getting Help

- 💬 [GitHub Discussions](https://github.com/Deodat-Lawson/pdr_ai_v2/discussions) - Ask questions
- 🐛 [GitHub Issues](https://github.com/Deodat-Lawson/pdr_ai_v2/issues) - Report bugs
- 📖 [README.md](./README.md) - Setup guide
- 📋 [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making PDR AI better! 🚀**
