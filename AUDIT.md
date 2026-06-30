# IELTS Pro LMS Audit

Date: 2026-06-30

## Scope

The repository is a static HTML/CSS/JavaScript app deployed from GitHub to Vercel. There is no package manager, build system, framework, test runner, type checker, or existing migration folder.

Current app files:

- `index.html` - student login
- `student.html` - student dashboard, lesson list, writing tasks, embedded HTML task shell
- `reading-test.html` - reading/full-test runner
- `listening-test.html` - listening runner
- `admin.html` - teacher/admin dashboard and CRUD
- `shared.js` - Supabase config, REST helpers, session helpers, grading helpers
- `shared.css` - global UI styling

Supabase tables detected through REST schema:

- `admins`
- `groups`
- `students`
- `lessons`
- `tasks`
- `submissions`

Storage buckets detected:

- `task-html`
- `task-media`

## Architecture Decision

Updated decision for the rebuild branch:

1. Keep the old static files in place while the replacement is built.
2. Add a practical npm workspace monorepo:
   - `apps/student-web`
   - `apps/admin-web`
   - `packages/shared`
   - `packages/ui`
3. Deploy student and admin as separate Vercel projects from the same GitHub repository.
4. Use server-side Next.js actions and signed HTTP-only cookies for student/admin sessions.
5. Keep Supabase service role usage server-only through Vercel environment variables.
6. Continue using the existing production schema for compatibility, then migrate toward richer LMS tables once core flows are verified.

This is safer than deleting the static app in one patch because it allows preview deployment and QA before switching production domains.

## Rebuild Progress

The preview branch introduces the first dynamic architecture:

- `apps/student-web` - Next.js student LMS with login, dashboard, published task listing, test taking, and progress history.
- `apps/admin-web` - Next.js teacher workspace with Supabase Auth login, dashboard analytics, student roster, lesson publish controls, and writing review.
- `packages/shared` - Supabase client setup, data access functions, shared types, grading, and teacher HTML sanitization.
- `packages/ui` - reusable Button, Card, Badge, Input, Textarea, Select, Table, EmptyState, LoadingSkeleton, StatCard, ProgressBar, and AppShell components.

The current schema is adapted rather than replaced:

- `lessons` maps to published lesson/course units.
- `tasks` maps to tests/tasks.
- `submissions` maps to attempts and writing submissions.
- `students` maps to student profiles.
- A future migration can add `tests`, `test_sections`, `questions`, `answer_options`, `test_attempts`, `student_answers`, and `teacher_feedback` without destroying current data.

## P0 Findings

### Public database access is unsafe

Problem: anonymous users can read sensitive tables and mutate at least some production data.

Evidence:

- `shared.js:13-17` sends direct REST requests from the browser using the public anon key.
- Live probe showed anon `GET` succeeds for `admins`, `students`, `submissions`, `lessons`, `tasks`, and `groups`.
- Live probe showed anon `POST`, `PATCH`, and `DELETE` succeeded on `groups`.

Affected files:

- `shared.js`
- Supabase RLS/policies

Risk: anyone with the deployed frontend bundle can enumerate students, read submissions, and modify some LMS records.

Recommended fix: move sensitive reads/writes behind server-side Vercel API routes or security-definer RPCs, then enable strict RLS. A migration draft is included under `supabase/migrations`.

Fix now or later: now for migration plan and frontend safety; full RLS lock requires manual SQL application and API/RPC scoping.

### `admins` table exposes credential-shaped data

Problem: `admins` table is visible via anon access and includes `username` and `password` columns.

Evidence:

- REST schema exposes `admins(id, username, password)`.
- Live anon read returned the table shape.

Affected files:

- Supabase table `admins`
- `admin.html` uses Supabase Auth instead, so this table appears legacy/unsafe.

Risk: credential leakage and confusion between real Supabase Auth and legacy password storage.

Recommended fix: stop using `admins`; lock table with RLS; migrate to Supabase Auth plus teacher role policy.

Fix now or later: now in RLS migration plan; do not delete production data without confirmation.

### Student authentication is not real authentication

Problem: student login reads a matching student row by name/code and stores that row in `sessionStorage`.

Evidence:

- `index.html:46-50` queries `students` directly and stores returned row.
- `shared.js:52-60` trusts `sessionStorage`.

Affected files:

- `index.html`
- `shared.js`
- `student.html`
- `reading-test.html`
- `listening-test.html`

Risk: students can spoof sessions or inspect public tables if RLS stays open.

Recommended fix: add proper student auth or signed server-issued student sessions. Short-term: route login through a security-definer RPC/API and keep direct table access disabled.

Fix now or later: foundational architecture phase.

### Stored XSS risk through `innerHTML`

Problem: many Supabase fields and student answers are interpolated into `innerHTML`.

Evidence:

- `student.html:328-346` rendered writing prompt, image URL, answer, feedback directly.
- `admin.html:181-288` rendered names, lesson titles, task titles, and submission metadata directly.
- `admin.html:1085-1092` rendered writing answer and feedback directly inside review modal.

Risk: a student answer or edited content can execute script in the admin browser and steal the admin session token.

Recommended fix: escape all user/data output by default and only allow trusted rich content for lesson passages.

Fix now or later: fixed now for the highest-risk renders.

## P1 Findings

### Students can access unpublished tasks by direct URL

Problem: student dashboard originally loaded all lessons/tasks and test pages accepted any `task` query id.

Evidence:

- `student.html:97-100` queried all lessons and all tasks.
- `reading-test.html:470` and `listening-test.html:214` loaded task ids directly.

Risk: drafts or teacher-only content can be opened before publish.

Recommended fix: filter student lessons to `published=eq.true`, filter tasks by published lesson, and block direct task URLs when the parent lesson is unpublished.

Fix now or later: fixed now at frontend level; RLS still required.

### Admin authorization is not role-based

Problem: any successful Supabase Auth session is treated as admin.

Evidence:

- `admin.html:119-125` accepts any password grant result and stores token.
- No role/profile/admin policy is checked in client code.

Risk: if another auth user is created, that user may access admin UI and database operations if RLS permits.

Recommended fix: add `teacher_admins` or `profiles.role`, then enforce it in RLS/API and client.

Fix now or later: migration draft included; full enforcement requires SQL and API/RPC phase.

### Delete actions are direct and broad

Problem: admin delete calls accept arbitrary table names and ids.

Evidence:

- `admin.html:1013-1017` calls generic `api(`${table}?id=eq.${id}`, DELETE)`.

Risk: if an attacker reaches admin context or exploits XSS, generic delete can target broad resources.

Recommended fix: whitelist resources server-side; keep confirmation; move deletes behind admin API.

Fix now or later: later when API layer is introduced.

### No duplicate attempt guard

Problem: submission inserts do not enforce one attempt per student/task.

Evidence:

- `student.html:355`
- `reading-test.html:427`
- `listening-test.html:189`

Risk: double-clicks or refresh/retry can create duplicate submissions and corrupt progress counts.

Recommended fix: add unique index on `(student_id, task_id)` or introduce `attempts` with attempt numbers; use upsert or explicit retake logic.

Fix now or later: later, because production data may already contain duplicates and needs a non-destructive cleanup plan.

## P2 Findings

### UI is not production LMS quality

Problem: the app looks like a small static school project rather than a polished SaaS/LMS.

Evidence:

- `shared.css:39-43` generic gradient login card.
- `shared.css:102-135` generic dashboard cards.
- `admin.html:35-75` simple admin screen with limited hierarchy.

Risk: poor trust and teacher/student usability.

Recommended fix: redesign around a cleaner LMS system: compact admin SaaS layout, student dashboard with real test cards, consistent empty/loading/error states.

Fix now or later: after P0/P1 foundation.

### Accessibility gaps

Problem: many interactive elements were `<div onclick>`/`<a onclick>`, focus styles were missing or removed, and toasts are not announced.

Evidence:

- `admin.html:46-50`
- `student.html:170`, `student.html:199`, `student.html:222`
- `shared.css:51`, `shared.css:58`
- `shared.js:44-48`

Risk: keyboard and assistive technology users have unreliable access.

Recommended fix: use buttons/links correctly, add focus-visible styles, add `aria-live` to toasts.

Fix now or later: partially fixed now; broader pass later.

## P3 Findings

### No build, lint, or automated tests

Problem: there is no `package.json`, no lint/typecheck/build command, and no test runner.

Risk: regressions are likely in a large single-file static app.

Recommended fix: add a minimal toolchain or migrate to a small framework when architecture work starts.

Fix now or later: later.

### Single large files

Problem: `admin.html` is over 1,100 lines and mixes UI rendering, storage upload, validation, auth, CRUD, and review flows.

Risk: changes are hard to test and easy to break.

Recommended fix: extract shared helpers and eventually move to components/modules.

Fix now or later: later.
