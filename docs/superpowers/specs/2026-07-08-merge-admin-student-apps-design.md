# Merge admin-web + student-web into a single Next.js app

**Date:** 2026-07-08
**Status:** Approved (design)
**Author:** Abduvoris (with Claude)

## Problem

The platform currently ships as two separate Next.js apps in one npm-workspace
monorepo:

- `apps/student-web` — public student site + student dashboard (port 3000)
- `apps/admin-web` — teacher/admin workspace (port 3001)

They are deployed as **two** Vercel projects from the same repo (see
`docs/VERCEL_SPLIT.md`). The owner wants a **single app** so there is one GitHub
repo and one Vercel deployment to manage. Separately (later phase, not in scope
here) the database will move from Supabase to Railway Postgres because Supabase
reads are slow.

## Scope

**In scope (Phase 1):**
- Merge the two apps into one Next.js app `apps/web`.
- Student routes at root (`/`), admin routes under `/admin`.
- One Vercel project, one `.env.local`.
- Keep Supabase exactly as-is (no DB layer changes).

**Out of scope (later phases):**
- Supabase → Railway migration.
- Creating the new GitHub repo / Vercel project (owner does this after merge).
- Any feature/UX changes beyond what the merge requires.

## Non-goals / YAGNI

- No redesign of student or admin UI.
- No shared design system unification — the two `globals.css` stay separate.
- No change to auth model (still two independent cookie sessions).
- No flattening of the workspace; `packages/shared` and `packages/ui` stay.

## Target architecture

New single app `apps/web`, built by copying `student-web` as the base (it owns
the public root) and moving `admin-web` pages under `app/admin/`.

```
apps/web/
  next.config.mjs            # copy of existing config (dotenv, transpilePackages)
  package.json               # single app: dev/build/start/typecheck
  tsconfig.json              # extends base, "@/*": ["./*"]
  app/
    layout.tsx               # root: only <html><body>{children}</body></html>, no global css
    (student)/
      layout.tsx             # imports ./globals.css (student), student chrome
      globals.css            # student design system (was student-web globals)
      page.tsx               # / (public landing)
      login/ dashboard/ lessons/ practice/ tests/ speaking/ vocabulary/
      profile/ progress/ results/ analytics/ mock/ mock-exam/ blog/ about/
      contact/ demo/ free-course/ article/ article-lessons/ writing-practice/
      practice-tests/ student-results/
      components/            # StudentShell, StudentNav, PublicShell, WritingAnswerBox
      actions/               # attempts.ts, auth.ts (student)
      api/                   # /api/html-attempts, /api/site-settings (unchanged URLs)
    admin/
      layout.tsx             # imports ./globals.css (admin) + requireAdminSession + AdminShell
      globals.css            # admin design system (was admin-web globals)
      page.tsx               # /admin (admin login)
      dashboard/ students/ groups/ lessons/ analytics/ submissions/
      full-tests/ html-tests/ content-studio/ student-control/ settings/
      test-builder/
      components/            # AdminNav, AdminShell, AdminPageTitle, CopyButton
      actions/               # auth.ts, lms.ts (admin)
  lib/                       # sibling of app/ (matches "@/*": ["./*"] -> @/lib/*)
    student-session.ts       # was student-web/lib/session.ts
    admin-session.ts         # was admin-web/lib/session.ts
packages/shared/             # UNCHANGED
packages/ui/                 # UNCHANGED
supabase/                    # UNCHANGED
```

### Why route groups

Next.js App Router loads any imported global (non-module) CSS for every route in
the segment where it is imported. The two apps have different, conflicting
design systems (`globals.css`: 3981 lines student vs 1426 lines admin) that
likely share class names (`.btn`, `.card`, etc.).

Putting student CSS in the `(student)` group layout and admin CSS in the
`admin/` layout means:
- On a student route, only `(student)` layout CSS is in the tree → only student CSS loads.
- On an admin route, only `admin/` layout CSS is in the tree → only admin CSS loads.

They are never loaded together, so class collisions cannot occur. The root
layout carries no heavy global CSS (only the `<html>`/`<body>` shell).

## Collision resolution

| Collision | Resolution |
|---|---|
| `app/dashboard`, `app/analytics`, `app/lessons` (both) | admin copies live under `app/admin/*`; student stay at root under `(student)` |
| `app/page.tsx` (student landing vs admin login) | student landing → `app/(student)/page.tsx` (`/`); admin login → `app/admin/page.tsx` (`/admin`) |
| `app/layout.tsx` (both) | one minimal root layout; per-group layouts hold each app's chrome + CSS |
| `app/globals.css` (both, different) | two files, imported only in their group layout |
| `lib/session.ts` (both, different content) | `lib/student-session.ts` + `lib/admin-session.ts`; update all `@/lib/session` imports |
| `app/actions/auth.ts` (both) | student → `app/(student)/actions/auth.ts`; admin → `app/admin/actions/auth.ts` |
| Post-login redirects | `adminLogin` → `/admin/dashboard`; `adminLogout` → `/admin`; `requireAdminSession` → `/admin`. Student redirects unchanged (`/dashboard`, `/login`). |
| Admin internal links (nav, forms, route handlers) | any `/dashboard`, `/students`, `/submissions/export`, etc. referenced in admin UI/actions become `/admin/...` |

Route groups (`(student)`) and the `admin` folder do **not** change API/route
handler URLs except where the folder path itself changes:
- Student `app/api/*` and `app/tests/html/[taskId]/route.ts` → same URLs.
- Admin `app/submissions/export/route.ts` → `/admin/submissions/export`; update
  the admin export link/button accordingly.

## Config & build

- `apps/web/next.config.mjs`: copy existing config verbatim (both apps are
  identical): dotenv from repo-root `.env.local`, `transpilePackages`, webpack
  `extensionAlias`, turbopack root.
- `apps/web/package.json`: single app. Scripts:
  - `dev`: `next dev --webpack --port 3000`
  - `build`: `next build --webpack`
  - `build:vercel`: build shared + ui, then `next build --webpack`
  - `start`, `typecheck` as today.
- Root `package.json` scripts collapse to a single app:
  - `dev` → `npm run dev --workspace web`
  - `build` → `npm run build --workspace web`
  - remove `dev:student` / `dev:admin` / `build:student` / `build:admin`.
- Root `.env.local` already contains all required keys and is unchanged:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `STUDENT_SESSION_SECRET`,
  `ADMIN_SESSION_SECRET`, `ADMIN_EMAILS`.
- Delete `apps/admin-web` and `apps/student-web` once `apps/web` builds.
- Update `docs/VERCEL_SPLIT.md` (or replace with a single-project deploy note:
  Root Directory = `apps/web`, all env vars in one project).

## Security note

Admin now lives at `/admin/*` on the same origin as the student site. Access is
still gated by the admin cookie session (`requireAdminSession` in the `admin/`
layout redirects to `/admin` when absent). The student UI must not link to
`/admin`. This preserves the intent of the old split-deploy isolation.

## Testing / verification

1. `npm run typecheck` clean.
2. `npm run build` (single app) succeeds.
3. Manual student flow: `/` → login → `/dashboard` → practice → open a test →
   submit → progress/results.
4. Manual admin flow: `/admin` → login → `/admin/dashboard` → students/groups →
   writing feedback → submissions export.
5. Security: hitting any `/admin/*` route without an admin cookie redirects to
   `/admin`; student session cannot reach admin pages.
6. CSS: student pages render with student styles, admin pages with admin styles;
   no visual bleed either direction.

## Migration approach (high level, detailed in the plan)

1. Scaffold `apps/web` from `student-web` (config, package.json, tsconfig, app
   tree wrapped in `(student)` group, root layout extracted).
2. Move admin pages/components/actions/session into `app/admin/*` +
   `lib/admin-session.ts`; split CSS; fix redirects and internal links.
3. Wire root/group layouts; rename session modules and fix imports.
4. Update root `package.json`; delete old apps; update deploy docs.
5. Typecheck, build, manual QA per above.

Each step is independently verifiable (typecheck/build between steps).
