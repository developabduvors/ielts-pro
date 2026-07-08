# Deployment

The student site and the admin workspace ship as **one** Next.js app
(`apps/web`) deployed from a **single** Vercel project. Student pages live at the
root (`/`, `/dashboard`, ...) and the admin workspace lives under `/admin`.

Vercel points at the app folder via **Root Directory**. It auto-detects Next.js
there and runs a plain `next build`; the shared/ui packages are compiled from
source by `transpilePackages`, so no custom build script is needed.

## Vercel Project

- Root directory: `apps/web`
- Framework preset: Next.js (auto-detected)
- Install command: `npm ci` (run at repo root — Vercel detects the workspace automatically)
- Build command: default (`next build`)
- Output directory: `.next` (default)

Environment variables (all in one project):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose in the browser
- `STUDENT_SESSION_SECRET` — strong random string
- `ADMIN_SESSION_SECRET` — strong random string
- `ADMIN_EMAILS` — comma-separated admin emails, e.g. `miravzalsalakhiddinov@gmail.com`

`NEXT_PUBLIC_STUDENT_APP_URL` is no longer needed — the admin login links back to
the same-origin `/login`.

Before enabling the private access login in production, apply:

- `supabase/migrations/20260701183000_student_access_device_sessions.sql`

## Smoke Checklist After Deploy

Student (root):

- `/` loads the premium student login.
- Student login works with a real student.
- Invalid or closed Student Access ID is rejected.
- Revoked device session redirects back to login.
- `/dashboard` shows published tests only.
- `/practice` opens the skill selection page.
- `/practice/reading`, `/practice/listening`, `/practice/writing`, and `/practice/full-tests` show the correct published tasks.
- Reading / Listening / Writing tasks open; Writing submits with live word count.
- `/progress` shows attempts and feedback.

Admin (`/admin`):

- `/admin` loads the teacher login.
- Admin auth works for an email in `ADMIN_EMAILS`.
- `/admin/dashboard`, `/admin/students`, `/admin/lessons`, `/admin/submissions` load.
- `/admin/students` can create/open/close Student Access IDs and kick devices.
- `/admin/full-tests` and `/admin/full-tests/new` load; JSON import + publish works.
- Writing review saves score and feedback.
- Any `/admin/*` route without an admin cookie redirects to `/admin`.

## Supabase Security

After the app is confirmed in production, apply and verify:

- `supabase/migrations/20260630190000_harden_lms_access.sql`
- `supabase/migrations/20260701183000_student_access_device_sessions.sql`

Rotate any service role key that was pasted into chat or shared outside
Vercel/Supabase secret storage.
