# Deployment

The repository supports two Vercel projects from the same `main` branch.

## Student Project

- Root directory: `./`
- Install command: `npm ci`
- Build command: `npm run build:vercel`
- Output directory: `.next`

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STUDENT_SESSION_SECRET`

Do not set `LMS_APP_TARGET` for the student project. It defaults to `student`.

## Admin Project

- Root directory: `./`
- Install command: `npm ci`
- Build command: `npm run build:vercel`
- Output directory: `.next`

Environment variables:

- `LMS_APP_TARGET=admin`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SESSION_SECRET`
- `ADMIN_EMAILS`

## Smoke Checklist After Deploy

Student:

- `/` loads the premium student login.
- Student login works with a real student.
- `/dashboard` shows published tests only.
- A Reading task opens.
- A Listening task opens and audio appears when attached.
- A Writing task opens and submits.
- `/progress` shows attempts and feedback.

Admin:

- `/` loads the teacher login.
- Admin auth works for an email in `ADMIN_EMAILS`.
- `/dashboard`, `/students`, `/lessons`, `/submissions` load.
- Publish/unpublish works.
- Writing review saves score and feedback.

## Supabase Security

After the Next apps are confirmed in production, apply and verify:

- `supabase/migrations/20260630190000_harden_lms_access.sql`

Rotate any service role key that was pasted into chat or shared outside Vercel/Supabase secret storage.

