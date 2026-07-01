# QA Audit

Date: 2026-07-01

## Scope

- Student app: `/`, `/dashboard`, `/progress`, `/tests/[taskId]`
- Admin app: `/`, `/dashboard`, `/students`, `/lessons`, `/submissions`
- Shared packages: Supabase data layer, UI components, Vercel build selector
- Reference benchmark: `https://ieltsulugbeks.com/` inspected for IELTS-focused UX patterns, skill cards, test-taking chrome, and result/progress structure. No brand assets, copy, logo, or exact layout were copied.

## Findings

| Severity | Route | File | Problem | Repro | Expected | Actual | Fix Plan / Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | Vercel admin deployment | `scripts/vercel-build.js` | Vercel previously failed on copied `.next` function paths. | Deploy admin with copied subapp output. | Admin deploy builds from valid root output. | `_global-error` function path failure. | Fixed before this pass by building selected app at root. |
| P0 | Student test direct URL | `packages/shared/src/data.ts` | Direct URL must not expose unpublished tasks. | Request unpublished task ID. | Return `notFound()` or redirect. | Data function checks `lessons.published === true`. | Verified by code review; live unpublished task requires production data check. |
| P1 | Automated tests | `package.json`, `scripts/qa-smoke.mjs` | No repeatable QA smoke test existed. | Run test command before this pass. | Local smoke test validates public and protected routes. | Missing. | Added `npm run test:smoke`. |
| P1 | Student visual quality | `apps/student-web/app/*`, CSS | Student app still felt too simple for premium IELTS LMS. | Open `/` and `/dashboard`. | Distinctive IELTS practice system with skill flow and test UI. | Basic dashboard. | Redesigned login, dashboard, progress, and test UI. |
| P1 | Admin visual quality | `apps/admin-web/app/*`, CSS | Admin panel needed stronger teacher SaaS structure. | Open admin pages. | Sidebar, stats, queue, tables, clear actions. | Functional but plain. | Redesigned admin login, shell, dashboard, lessons, students, submissions. |
| P1 | Student/admin route protection | `apps/*/lib/session.ts` | Protected routes must not load without signed cookie. | Visit protected routes unauthenticated. | Redirect to login. | Redirect enforced before Supabase access. | Automated in `test:smoke`. |
| P2 | Writing word count | `apps/student-web/app/tests/[taskId]/page.tsx` | Writing editor does not currently show live word count. | Open a writing task. | Word count visible. | Textarea only. | Remaining enhancement; requires client component. |
| P2 | Question management | `apps/admin-web/app/lessons/page.tsx` | Admin can create lessons and publish/unpublish, but no full question builder UI yet. | Open `/lessons`. | Create/edit questions from admin. | Existing schema stores task content; question builder not implemented. | Documented as next backend/UI scope. |
| P2 | Live Supabase submit QA | Student/admin actions | Real submit/review flows need production env and seeded data. | Run without env or data. | Submit/review works or clear server error. | Build verified; full live DB flow not executed in local smoke. | Manual checks listed in `QA_REPORT.md`. |
| P3 | Empty states | Student/admin tables | Empty states exist for major lists but not every table branch is rich. | Empty submissions/admin data. | Helpful empty state. | Some table fallback is plain. | Low-risk polish follow-up. |

## Security Checks

- Service role key is referenced only through server environment access in `packages/shared/src/supabase.ts`.
- No `.env` files are tracked.
- Student sessions and admin sessions use signed HTTP-only cookies.
- Admin allow-list is enforced through `ADMIN_EMAILS`.
- RLS migration draft exists at `supabase/migrations/20260630190000_harden_lms_access.sql`; it still requires manual Supabase application after production smoke testing.

