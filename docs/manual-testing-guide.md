# Manual Testing Guide (Dev)

Use this guide to **exhaustively manually test the website in development** after each PR. It covers all user-facing routes, auth flows, and major features so nothing is missed.

## Running the tests: two passes required

**Run the same test suite twice:**

1. **Run 1 — Local dev:** App and DB run on your machine (Next.js dev server + local or Docker DB).
2. **Run 2 — Docker:** Full stack runs via Docker Compose (app + DB + migrate, and optional services).

Use the **same checklist** (sections 1–5, and optionally 6) for both passes. This catches environment-specific issues (paths, env loading, build vs dev server, etc.).

---

## Run 1: Local dev setup

Before the first pass:

1. **Environment**
   - Copy `.env.example` to `.env` and fill required keys (see [README](../README.md) Quick Start).
   - Set `DATABASE_URL` for a local PostgreSQL (e.g. `localhost:5433` if using Docker for DB only).
   ```bash
   pnpm db:install
   ```

2. **Database**
   ```bash
   pnpm db:push
   ```

3. **Run dev server**
   ```bash
   pnpm run dev
   ```
   Open **http://localhost:3000**.

4. **Test accounts**
   - Have at least one **Employer** (or Owner) and one **Employee** account.
   - Optionally one **pending** employer and one **pending** employee for approval flows.

Complete sections 1–5 (and 6 if desired), then proceed to Run 2.

---

## Run 2: Docker setup

Before the second pass:

1. **Environment**
   - Use the same `.env` (or a copy) with keys valid for the Docker run (e.g. `DATABASE_URL` for the Compose `db` service).

2. **Start full stack**
   ```bash
   docker compose --env-file .env up
   ```
   Wait until the app is ready (migrate completes, app listens). Open **http://localhost:3000** (or the port mapped for the `app` service).

3. **Test accounts**
   - Reuse the same Employer/Employee accounts (Clerk and DB are shared if you point to the same DB) or create fresh ones.

Run the **same checklist** (sections 1–5, and optionally 6) again. Note any differences from Run 1 (e.g. upload paths, API base URL, env-only features).

---

## 1. Public pages (unauthenticated)

| # | Check | Route | Expected |
|---|--------|--------|----------|
| 1.1 | Landing page loads | `/` | Hero, feature cards, “Start Free Trial”, “Schedule Demo”, nav links. |
| 1.2 | Sign up link | Click “Start Free Trial” / `/signup` | Navigates to signup. |
| 1.3 | Sign in link | Nav or `/signin` | Sign-in form (Clerk). |
| 1.4 | Contact | `/contact` | Contact page loads. |
| 1.5 | About | `/about` | About page loads. |
| 1.6 | Pricing | `/pricing` | Pricing page loads. |
| 1.7 | Deployment (public) | `/deployment` | Deployment/setup guide loads (no auth). |

**Quick smoke:** Visit each URL in a logged-out browser; no 500s, no broken layout.

---

## 2. Authentication flows

### 2.1 Sign up

| # | Check | Steps | Expected |
|---|--------|--------|----------|
| 2.1.1 | New employer signup | Go to `/signup`, complete Clerk signup, choose Employer, submit. | User created in DB as employer (or owner), then redirected to `/employer/home` or `/employer/pending-approval` depending on approval flow. |
| 2.1.2 | New employee signup | Go to `/signup`, complete Clerk signup, choose Employee, submit. | User created as employee, redirected to `/employee/documents` or `/employee/pending-approval`. |
| 2.1.3 | Already in DB | Sign up with email that already exists in DB (with role). | Appropriate error or redirect (no duplicate role flip). |

### 2.2 Sign in & redirects

| # | Check | Steps | Expected |
|---|--------|--------|----------|
| 2.2.1 | Employer sign in | Sign in as verified employer. Visit `/` or `/signin`. | Redirect to `/employer/home`. |
| 2.2.2 | Employee sign in | Sign in as verified employee. Visit `/` or `/signin`. | Redirect to `/employee/documents`. |
| 2.2.3 | Protected route unauthenticated | Log out, visit `/employer/home` or `/employee/documents`. | Redirect to `/signin`. |
| 2.2.4 | Wrong role | Sign in as employee, manually go to `/employer/home`. | Rejected or redirected (employer-only). |

### 2.3 Pending approval

| # | Check | Steps | Expected |
|---|--------|--------|----------|
| 2.3.1 | Pending employer | Sign in as employer with `status !== 'verified'`. | Redirect to `/employer/pending-approval`; message about waiting for approval. |
| 2.3.2 | Pending employee | Sign in as employee with `status !== 'verified'`. | Redirect to `/employee/pending-approval`; same idea. |

---

## 3. Employer flows

### 3.1 Employer home (`/employer/home`)

| # | Check | Expected |
|---|--------|----------|
| 3.1.1 | Page loads | Dashboard with stats (employees, documents, etc.) and menu cards. |
| 3.1.2 | Stats | Numbers load from `/api/company/analysis-dashboard` (or equivalent); no infinite loading. |
| 3.1.3 | Nav | Navbar with logo, theme toggle, profile dropdown. |
| 3.1.4 | Menu cards | Upload Documents, View Documents, Document Statistics, Manage Employees, User Settings, Contact Support — each links to correct route. |

### 3.2 Upload (`/employer/upload`)

| # | Check | Expected |
|---|--------|----------|
| 3.2.1 | Upload page | Form to upload file(s); optional category/settings if present. |
| 3.2.2 | Upload PDF | Select a PDF, submit; success feedback and document appears in list or documents page. |
| 3.2.3 | Upload DOCX/XLSX/PPTX | Same for other supported types; no client/server crash. |
| 3.2.4 | Validation | Invalid or oversized file shows clear error. |
| 3.2.5 | OCR (if configured) | With OCR provider keys set, option to run OCR on scanned PDF; processing completes or fails gracefully. |

### 3.3 Documents (`/employer/documents`)

| # | Check | Expected |
|---|--------|----------|
| 3.3.1 | List loads | Document list (or sidebar) loads; can select a document. |
| 3.3.2 | Document viewer | Selecting a document opens viewer (PDF/DOCX/XLSX/PPTX as applicable). |
| 3.3.3 | PDF viewer | PDF renders in iframe or native viewer; scroll/zoom ok. |
| 3.3.4 | DOCX/XLSX/PPTX | Respective viewers render content without crash. |
| 3.3.5 | AI chat / Q&A | Chat or Q&A panel sends query; response returned (RAG); no 500. |
| 3.3.6 | Document generator (if present) | Outline/citation/grammar/research/export panels open and behave; export works or shows clear state. |
| 3.3.7 | Simple query / Agent chat | Query panel or agent chat returns answers; no infinite loading. |

### 3.4 Statistics (`/employer/statistics`)

| # | Check | Expected |
|---|--------|----------|
| 3.4.1 | Page loads | Charts and tables load (employee activity, document stats). |
| 3.4.2 | Data | Numbers and trends match backend; document details sheet or drill-down works if present. |

### 3.5 Manage employees (`/employer/employees`)

| # | Check | Expected |
|---|--------|----------|
| 3.5.1 | List | Employee list loads. |
| 3.5.2 | Approve/deny (if applicable) | Pending employees can be approved/denied; list updates. |
| 3.5.3 | Invite / add (if applicable) | Invite or add employee flow works; no 500. |

### 3.6 Settings (`/employer/settings`)

| # | Check | Expected |
|---|--------|----------|
| 3.6.1 | Page loads | Settings form (profile, preferences, etc.) loads. |
| 3.6.2 | Save | Changing and saving updates without error. |

### 3.7 Contact support (`/employer/contact`)

| # | Check | Expected |
|---|--------|----------|
| 3.7.1 | Page loads | Contact/support form or info loads. |

### 3.8 Study Agent (`/employer/studyAgent`)

| # | Check | Expected |
|---|--------|----------|
| 3.8.1 | Study agent entry | `/employer/studyAgent` loads; onboarding/teacher/studyBuddy links work. |
| 3.8.2 | Teacher mode | `/employer/studyAgent/teacher` loads and core flow works. |
| 3.8.3 | Study Buddy mode | `/employer/studyAgent/studyBuddy` loads and core flow works. |
| 3.8.4 | Onboarding | `/employer/studyAgent/onboarding` loads if present. |

### 3.9 Pending approval (`/employer/pending-approval`)

| # | Check | Expected |
|---|--------|----------|
| 3.9.1 | Message | Clear “pending approval” message; no employer actions that require verification. |

### 3.10 Profile & sign out

| # | Check | Expected |
|---|--------|----------|
| 3.10.1 | Profile dropdown | Opens; sign out logs user out and redirects appropriately. |

---

## 4. Employee flows

### 4.1 Employee home (`/employee/home`)

| # | Check | Expected |
|---|--------|----------|
| 4.1.1 | Page loads | Dashboard with “View Documents” and any other employee menu items. |
| 4.1.2 | Nav | Nav and profile present; theme toggle works. |

### 4.2 Employee documents (`/employee/documents`)

| # | Check | Expected |
|---|--------|----------|
| 4.2.1 | List | Only documents assigned/visible to employee are shown. |
| 4.2.2 | Viewer | Opening a document shows viewer (PDF/DOCX/etc.). |
| 4.2.3 | AI Q&A | Chat/Q&A over documents works; answers are scoped to allowed content. |

### 4.3 Pending approval (`/employee/pending-approval`)

| # | Check | Expected |
|---|--------|----------|
| 4.3.1 | Message | “Pending approval” message; no access to full document list until verified. |

### 4.4 Profile & sign out

| # | Check | Expected |
|---|--------|----------|
| 4.4.1 | Sign out | Same as employer; clean redirect after sign out. |

---

## 5. Global UI & behavior

| # | Check | Expected |
|---|--------|----------|
| 5.1 | Theme toggle | Light/dark/system switch works; no flash or broken styles. |
| 5.2 | Responsive | Key pages (landing, dashboards, documents) are usable on narrow viewport (no critical overflow or hidden actions). |
| 5.3 | Errors | Network/server errors show user-friendly message or toast, not raw stack trace. |
| 5.4 | Loading | Loading states (skeletons/spinners) appear where appropriate; no permanent loading. |

---

## 6. API smoke checks (optional)

If you want to sanity-check APIs used by the app:

| # | Check | Expected |
|---|--------|----------|
| 6.1 | `GET /api/employerAuth` | 200 when signed in as employer. |
| 6.2 | `GET /api/employeeAuth` | 200 when signed in as employee. |
| 6.3 | `GET /api/company/analysis-dashboard` | 200 and JSON with dashboard data (as employer). |
| 6.4 | Document Q&A / RAG | `POST` to document Q&A endpoint returns answer or structured error. |
| 6.5 | `GET /api/metrics` | Returns Prometheus metrics if enabled. |

Use browser DevTools Network tab or `curl` with appropriate auth/cookies.

---

## 7. Regression tips

- **After auth/DB changes:** Re-test sign up (employer + employee), sign in redirects, and pending-approval flows.
- **After document/upload changes:** Re-test upload (multiple types), viewer (PDF/DOCX/XLSX/PPTX), and RAG/chat.
- **After role/permission changes:** Re-test employer vs employee access and wrong-role redirects.
- **After new pages:** Add a row to the relevant section (employer/employee/public) and run that subsection every PR.

---

## 8. Checklist summary (quick pass)

**Do this quick pass in both Run 1 (local dev) and Run 2 (Docker):**

1. [ ] Landing `/` and sign in `/signin` load.
2. [ ] Sign in as **employer** → `/employer/home` → open **Upload**, **Documents**, **Statistics**, **Employees**, **Settings**.
3. [ ] Upload one document; open it in **Documents** and run one **AI Q&A**.
4. [ ] Sign in as **employee** → `/employee/documents`; open a document and run Q&A.
5. [ ] Theme toggle and sign out on both roles.
6. [ ] Public `/deployment` and `/contact` load.

For **full confidence**, run every table in sections 1–5 (and 6 if desired) **in both local dev and Docker**.
