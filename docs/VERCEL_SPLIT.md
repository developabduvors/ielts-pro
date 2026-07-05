# Vercel Split Deployment

Create two Vercel projects from the same GitHub repository.

Each project uses the app folder as its **Root Directory**. Vercel auto-detects Next.js and
runs a plain `next build` — the `@ielts-pro/shared` and `@ielts-pro/ui` packages are compiled
from source via `transpilePackages`, so there is no custom build script.

## Student App

- Project name: `ielts-pro-student`
- Root directory: `apps/student-web`
- Framework preset: Next.js (auto-detected)
- Install command: `npm ci` (runs at repo root; Vercel detects the npm workspace)
- Build command: default (`next build`)
- Output directory: `.next` (default)

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` - server-only, never expose in browser
- `STUDENT_SESSION_SECRET` - strong random string

Suggested production domain:

- `ielts-pro-chi.vercel.app` after QA, or a new student subdomain first.

## Admin App

- Project name: `ielts-pro-admin`
- Root directory: `apps/admin-web`
- Framework preset: Next.js (auto-detected)
- Install command: `npm ci` (runs at repo root; Vercel detects the npm workspace)
- Build command: default (`next build`)
- Output directory: `.next` (default)

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` - server-only, needed for admin data management
- `ADMIN_SESSION_SECRET` - strong random string
- `ADMIN_EMAILS` - comma-separated admin emails, e.g. `miravzalsalakhiddinov@gmail.com`

Suggested production domain:

- Private admin URL such as `ielts-pro-admin.vercel.app` or `admin.your-domain`.

## Cutover Plan

1. Deploy both apps as Vercel previews from `codex/lms-next-rebuild`.
2. Verify student login, dashboard, published tests, task submission, and progress.
3. Verify admin login, dashboard, lesson publish toggle, roster, and writing feedback.
4. Apply Supabase RLS only after server-side data access is confirmed.
5. Move the public student domain to `apps/student-web`.
6. Keep admin on its own Vercel project and do not link it from student UI.
