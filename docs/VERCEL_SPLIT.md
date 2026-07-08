# Vercel Deployment (single project)

> The old split-deploy (two projects: student + admin) is gone. Student and
> admin are now one Next.js app (`apps/web`): student at the root, admin under
> `/admin`. Deploy it as a single Vercel project.

See `DEPLOYMENT.md` for the full checklist. Quick reference:

- Project: one Vercel project from this repo
- Root directory: `apps/web`
- Framework: Next.js (auto-detected), default `next build`
- Install: `npm ci` at repo root (workspace auto-detected)
- Env vars (one project): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `STUDENT_SESSION_SECRET`, `ADMIN_SESSION_SECRET`,
  `ADMIN_EMAILS`.

Admin lives at `/admin` on the same origin, gated by the admin cookie session.
Do not add a link to `/admin` from the student UI.
