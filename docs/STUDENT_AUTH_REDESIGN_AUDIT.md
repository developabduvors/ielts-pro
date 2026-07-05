# Student Auth Redesign Audit

Date: 2026-07-01

## Bolt Frontend Access

Requested repository: `https://github.com/Ismoilastren/ietls-front.git`.

Access result:

- `git clone` failed because GitHub requested credentials.
- GitHub connector fetch for `Ismoilastren/ietls-front/package.json` returned `404 Not Found`.

Because the Bolt repository was not readable in this environment, the implementation manually ports the design direction described in the brief: dark navy IELTS hero, grid background, blue/cyan gradient headline, polished private-access card, and premium student LMS styling.

## Current State Found

- Student login used full name + `student_code`, but it was presented as a generic student login.
- Student session was a signed cookie only; there was no server-side device/session row to revoke.
- Admin `/students` was read-only roster UI.
- `students.student_code` already acts as the access ID, so it is reused as `Student Access ID`.
- No Google, Apple, signup, forgot password, free trial, or public registration controls were found in the current student app.
- No `localStorage` or `sessionStorage` usage was found in student/admin auth.
- Supabase access is server-side through `createServerSupabaseClient`; service role key is not exposed through `NEXT_PUBLIC_*`.

## Replaced / Added

- Student login copy and styling now present the app as a private teacher-issued portal.
- Student session now includes a random device session token stored only in an HTTP-only signed cookie.
- Database stores only `session_token_hash` in `student_device_sessions`.
- Protected student routes validate the active device session and student access status on every request.
- Admin `/students` now manages Student Access IDs, open/closed access, and device session revocation.
- Student `/profile` shows masked access ID, progress stats, and active/revoked device sessions.

## Data Model Needed

Migration added:

- `supabase/migrations/20260701183000_student_access_device_sessions.sql`

It adds:

- `students.is_active`
- `students.access_status`
- `students.max_devices`
- `students.last_login_at`
- `students.updated_at`
- `student_device_sessions`
- `student_login_events`

`students.student_code` remains the unique Student Access ID to preserve existing production data.

## Files Changed

- Student auth/session: `apps/student-web/lib/session.ts`, `apps/student-web/app/actions/auth.ts`
- Student UI: `apps/student-web/app/page.tsx`, `apps/student-web/app/globals.css`, `apps/student-web/app/profile/page.tsx`
- Admin access UI/actions: `apps/admin-web/app/students/page.tsx`, `apps/admin-web/app/actions/lms.ts`, `apps/admin-web/app/globals.css`
- Shared data/types: `packages/shared/src/data.ts`, `packages/shared/src/types.ts`
- Supabase migration: `supabase/migrations/20260701183000_student_access_device_sessions.sql`

## Risks / Manual Steps

- Apply the Supabase migration before relying on device revocation in production.
- If the migration is not applied, private login will fail because `student_device_sessions` does not exist.
- The current app uses server-side service-role data access; RLS policies are still included for admin-side authenticated access, but student private access enforcement is performed in Next.js server actions/routes.
- Device identification uses secure session tokens plus user agent. It does not claim perfect browser fingerprinting.
