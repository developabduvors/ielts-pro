# Supabase Security Notes

The static app currently depends on open anon access. The Next.js rebuild changes that direction:

- Student login runs on the server and stores a signed HTTP-only cookie.
- Admin login uses Supabase Auth and stores a signed HTTP-only admin cookie.
- Admin data access is server-side.
- The service role key is required only as a Vercel server environment variable.

Do not commit:

- `.env`
- `.env.local`
- service role keys
- database passwords

Before running strict RLS:

1. Deploy the Next.js apps.
2. Confirm server-side routes can read/write needed tables.
3. Confirm no frontend bundle contains `SUPABASE_SERVICE_ROLE_KEY`.
4. Apply `supabase/migrations/20260630190000_harden_lms_access.sql` through the Supabase SQL editor or CLI.
5. Retest direct student/admin URLs.

The `admins` table should be treated as legacy and locked down. Admin access should use Supabase Auth plus `ADMIN_EMAILS` or the `teacher_admins` table introduced in the migration draft.
