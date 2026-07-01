# QA Audit

Date: 2026-07-01

## Scope

- Student app: `/`, `/dashboard`, `/practice`, `/practice/[skill]`, `/progress`, `/tests/[taskId]`
- Admin app: `/`, `/dashboard`, `/students`, `/lessons`, `/full-tests`, `/full-tests/new`, `/submissions`
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
| P2 | Writing word count | `apps/student-web/app/components/WritingAnswerBox.tsx` | Writing editor should show word count and target progress. | Open a writing task and type. | Word count updates live. | Client component updates locally. | Fixed in this pass. |
| P1 | Skill practice flow | `apps/student-web/app/practice/*` | Student skill cards need real navigation and skill-specific practice lists. | Click Dashboard skill cards. | Opens Reading/Listening/Writing/Full Tests lists. | Dedicated routes filter published tasks by skill. | Fixed in this pass. |
| P1 | Full test creation | `apps/admin-web/app/full-tests/new/page.tsx` | Admin needed a real full-test builder instead of only lesson shells. | Open `/full-tests/new`. | Create full IELTS practice with Reading, Listening, Writing, audio, and JSON import. | Missing before this pass. | Added Full Test Builder, JSON import, and server-side Supabase Storage upload path. |
| P1 | Student full-test view | `apps/student-web/app/tests/[taskId]/page.tsx` | Full tests should not render as simple reading-only tasks. | Open a published full-test task. | Student sees Reading, Listening, and Writing sections. | Previously fell through to reading-style layout. | Added full-test section rendering and writing response capture. |
| P1 | Full-test section grading | `apps/student-web/app/actions/attempts.ts` | Full-test JSON can store questions inside `sections`, but grading only read top-level questions. | Submit imported section-based full test. | Section questions render and grade. | Top-level-only grading would miss answers. | Fixed by flattening top-level and section questions consistently. |
| P2 | Question editing | `apps/admin-web/app/full-tests/new/page.tsx` | Admin can create/import full tests, but editing existing task JSON is not a dedicated screen yet. | Open existing full test. | Edit/reorder every existing question. | Library shows tests and preview state, builder creates/imports new tests. | Remaining enhancement; current safe path is draft/import replacement. |
| P2 | Live Supabase submit QA | Student/admin actions | Real submit/review flows need production env and seeded data. | Run without env or data. | Submit/review works or clear server error. | Build verified; full live DB flow not executed in local smoke. | Manual checks listed in `QA_REPORT.md`. |
| P3 | Empty states | Student/admin tables | Empty states exist for major lists but not every table branch is rich. | Empty submissions/admin data. | Helpful empty state. | Some table fallback is plain. | Low-risk polish follow-up. |

## Security Checks

- Service role key is referenced only through server environment access in `packages/shared/src/supabase.ts`.
- No `.env` files are tracked.
- Student sessions and admin sessions use signed HTTP-only cookies.
- Admin allow-list is enforced through `ADMIN_EMAILS`.
- Listening audio upload is handled in server actions only; `SUPABASE_SERVICE_ROLE_KEY` is not exposed to client code.
- RLS migration draft exists at `supabase/migrations/20260630190000_harden_lms_access.sql`; it still requires manual Supabase application after production smoke testing.
