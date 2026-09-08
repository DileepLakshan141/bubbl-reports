# bubbl — Weekly Report Management System

A full-stack, role-based weekly reporting platform built for teams to log progress, track blockers and achievements, and route reports through a structured review/approval workflow.

**Live App:** [bubbl-reports.vercel.app](https://bubbl-reports.vercel.app/)
**Backend API:** `https://bubbl-reports-production.up.railway.app`
**Repository:** [github.com/DileepLakshan141/bubbl-reports](https://github.com/DileepLakshan141/bubbl-reports)

---

## Demo Credentials

Use these to log in and explore the app as each role.

| Role            | Email               | Password     |
| --------------- | ------------------- | ------------ |
| **Admin**       | `dileep@gmail.com`  | `dileep123`  |
| **Manager**     | `sam@gmail.com`     | `sam123`     |
| **Team Member** | `vihanga@gmail.com` | `vihanga123` |

> Note: the app is deployed on free-tier infrastructure (Railway + Neon). The first request after a period of inactivity may take a few seconds while the database wakes up — this is expected.

---

## Tech Stack

**Backend**

- NestJS
- Prisma 7 (`@prisma/adapter-pg`)
- PostgreSQL (Neon)
- JWT authentication (Passport)
- class-validator

**Frontend**

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Redux
- React Hook Form + Zod
- Recharts
- Sonner (toasts)
- `jose` (server-side session handling)

**Infrastructure**

- Frontend: Vercel
- Backend + Database: Railway (API) + Neon (Postgres)
- Auth pattern: BFF (Backend-for-Frontend) — browser ↔ Next.js (httpOnly cookie) ↔ NestJS (Bearer token)

---

## Roles & Permissions

| Capability                                 | Admin                   | Manager                      | Team Member                       |
| ------------------------------------------ | ----------------------- | ---------------------------- | --------------------------------- |
| View projects                              | All projects (org-wide) | Only projects they created   | Only projects they're assigned to |
| Create / edit / soft-delete projects       | ✅ Any project          | ✅ Own projects only         | ❌                                |
| Assign team members to projects            | ✅                      | ✅ (own projects)            | ❌                                |
| Create / edit weekly reports               | ❌                      | ❌                           | ✅ Own reports, current week only |
| View report content                        | Any report              | Reports under their projects | Only their own reports            |
| Approve / Request Changes on reports       | ❌                      | ✅                           | ❌                                |
| Manage users (add / remove / assign roles) | ✅                      | ❌                           | ❌                                |
| View team dashboard & analytics            | ✅                      | ✅ (scoped to own projects)  | ❌                                |

Access control is enforced at the service layer on every request — a user's identity is always derived from their JWT (`req.user.userId`), never from client-supplied fields.

---

## Key Features

- **Draft → Submit → Review → Correction → Approved workflow**, with full version history preserved per report (`Report` / `ReportVersion` split — each submission and resubmission creates a new version rather than overwriting history).
- **Weekly report builder** — task tracker (planned vs. actual progress, time planned vs. spent), blockers with a single "key issue" flag, achievements with a single "key achievement" flag, and optional notes.
- **Manager review workflow** — approve or request changes on a submitted report with a required comment; the report returns to the team member for correction and resubmission.
- **Role-scoped project management** — Admin manages all projects org-wide; Managers manage only the projects they created; Team Members see only projects they're assigned to.
- **Team dashboard & analytics** — submission compliance, tasks-completed trend, report status breakdown by team member, workload by project, and time logged by task type.
- **User management (Admin)** — view all users and update their role.
- **Team member profile view** — report history and stats for an individual team member, accessible to managers.
- **Current-week-only report creation** — new reports are locked to the current week to prevent backdating; existing Draft/Needs Correction reports remain editable regardless of calendar date.

---

## Architecture Notes

- **BFF pattern**: the browser never talks to the NestJS API directly. Next.js API routes proxy requests (`app/api/backend/[...path]/route.ts`), holding the JWT in an httpOnly cookie and attaching it as a Bearer token on the way to the backend.
- **Report / ReportVersion split**: each `Report` row represents one project+week combination; each edit/resubmission creates a new `ReportVersion` row, with `Report.currentVersionId` pointing to the latest one for O(1) lookups. This preserves a full audit trail without needing to sort by timestamp.
- **Soft delete for projects**: projects are deactivated (`is_active = false`) rather than hard-deleted, since `Report.project_id` has no cascading delete — this protects historical report data and dashboard accuracy.
- **Shared week-boundary utility**: a single `getStartOfWeek()`-style function is used consistently across report creation, the "due this week" indicator, and the create-report guard, so they can never disagree on what "this week" means.

---

## Local Setup

### Prerequisites

- Node.js 22+
- PostgreSQL database (or a Neon project)

### Backend

```bash
git clone https://github.com/DileepLakshan141/bubbl-reports.git
cd bubbl-reports/backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"
PORT=3001
```

> If using Neon, use the **direct** (non-pooled) connection string — i.e. the hostname without `-pooler` — since the backend uses Prisma interactive transactions, which are not compatible with PgBouncer's transaction-mode pooling.

```bash
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

### Frontend

```bash
cd ../frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
JWT_SECRET="same-secret-as-backend"
```

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Known Limitations & Possible Improvements

- **Manager project scoping is per-creator, not per-team.** A manager only sees projects they personally created. In a multi-manager org this could be relaxed to org-wide visibility, or scoped via an explicit manager→team relationship if one were added to the schema.
- **Report creation is limited to the current calendar week** by design, to prevent backdated submissions and keep compliance metrics honest. Editing an existing Draft or Needs Correction report remains available regardless of the calendar date.
- **User invite flow is simplified** — users are created directly by an Admin rather than via an email invitation flow.
- **Automated RBAC test coverage** could be expanded — the highest-value scenario to verify is that a Team Member cannot access another Team Member's report by ID, and that a Manager cannot update a project they didn't create.

---

## License

Built as a technical assignment.
