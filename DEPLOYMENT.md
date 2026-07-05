# Deployment

The repository supports two Vercel projects from the same `main` branch.

Each Vercel project points at one app folder via **Root Directory**. Vercel auto-detects
Next.js there and runs a plain `next build`; the shared/ui packages are compiled from source
by `transpilePackages`, so no custom build script is needed.

## Student Project

- Root directory: `apps/student-web`
- Framework preset: Next.js (auto-detected)
- Install command: `npm ci` (run at repo root — Vercel detects the workspace automatically)
- Build command: default (`next build`)
- Output directory: `.next` (default)

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STUDENT_SESSION_SECRET`

Before enabling the new private access login in production, apply:

- `supabase/migrations/20260701183000_student_access_device_sessions.sql`

## Admin Project

- Root directory: `apps/admin-web`
- Framework preset: Next.js (auto-detected)
- Install command: `npm ci` (run at repo root)
- Build command: default (`next build`)
- Output directory: `.next` (default)

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SESSION_SECRET`
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_STUDENT_APP_URL` for admin "Preview as student" links, for example `https://ielts-pro-student.vercel.app`

## Smoke Checklist After Deploy

Student:

- `/` loads the premium student login.
- Student login works with a real student.
- Invalid or closed Student Access ID is rejected.
- Revoked device session redirects back to login.
- `/dashboard` shows published tests only.
- `/practice` opens the skill selection page.
- `/practice/reading`, `/practice/listening`, `/practice/writing`, and `/practice/full-tests` show the correct published tasks.
- A Reading task opens.
- A Listening task opens and audio appears when attached.
- A Writing task opens and submits.
- Writing answer box shows live word count.
- `/progress` shows attempts and feedback.

Admin:

- `/` loads the teacher login.
- Admin auth works for an email in `ADMIN_EMAILS`.
- `/dashboard`, `/students`, `/lessons`, `/submissions` load.
- `/students` can create/open/close Student Access IDs.
- `/students` shows active/revoked device sessions and can kick a device.
- `/full-tests` and `/full-tests/new` load.
- Full Test Builder can save a draft and optional listening audio upload.
- JSON import creates a full-test lesson and task.
- Publish/unpublish works.
- Writing review saves score and feedback.

## Supabase Security

After the Next apps are confirmed in production, apply and verify:

- `supabase/migrations/20260630190000_harden_lms_access.sql`
- `supabase/migrations/20260701183000_student_access_device_sessions.sql`

Rotate any service role key that was pasted into chat or shared outside Vercel/Supabase secret storage.
