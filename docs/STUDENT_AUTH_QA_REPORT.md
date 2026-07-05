# Student Auth QA Report

Date: 2026-07-01

## Scope

- Private student login page
- Server-side Student Access ID validation
- HTTP-only signed student session cookie
- Device session hash storage and revocation model
- Admin Student Access management UI
- Student profile/device session UI
- Vercel student/admin build readiness

## Automated Checks Run

```bash
npm run typecheck
npm run build:vercel
LMS_APP_TARGET=admin npm run build:vercel
npm run test:smoke
```

Results:

- Typecheck: passed.
- Student Vercel build: passed.
- Admin Vercel build: passed.
- Smoke tests: passed.

## Verified By Code Review

- Student login fields are only Full Name and Student Access ID.
- No Google, Apple, signup, forgot password, watch demo, public trial, or admin links are present on the student login page.
- Login server action validates the student in Supabase.
- Closed/disabled access is rejected.
- Device limit is enforced when `students.max_devices` is set.
- Device session token is generated server-side.
- Only the hash is stored in `student_device_sessions.session_token_hash`.
- Protected student routes validate the session row on each request.
- Revoked or closed access redirects to login.
- Admin `/students` can create access IDs, close/open access, revoke one device, and revoke all devices.
- Student `/profile` shows masked access ID and device sessions.

## Browser QA

Local unauthenticated browser checks are safe without production Supabase data:

- Student `/` loads the private access page.
- Student protected routes redirect to `/`.
- Admin `/` loads.
- Admin protected routes redirect to `/`.

Live authenticated checks require applying the Supabase migration first.

## Supabase Manual Checks Required

Apply:

```sql
supabase/migrations/20260701183000_student_access_device_sessions.sql
```

Then verify in production/staging:

1. Admin creates a Student Access ID.
2. Student logs in with Full Name + Student Access ID.
3. `student_device_sessions` receives a row with a hashed token.
4. Student dashboard opens.
5. Student profile shows the active device.
6. Admin kicks that device.
7. Same browser is redirected to login on next protected route load.
8. Admin closes the Student Access ID.
9. Future login attempts fail with the closed-access message.
10. Reopen access and confirm login works again.

## Known Limits

- Device identification uses a secure session token plus user agent metadata. It does not pretend to be perfect fingerprinting.
- The Bolt repository was not accessible from this environment, so the design was manually ported from the provided description rather than copied from files.
