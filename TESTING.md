# Testing

## Commands

Install:

```bash
npm ci
```

Typecheck:

```bash
npm run typecheck
```

Student Vercel build:

```bash
npm run build:vercel
```

Admin Vercel build:

```bash
LMS_APP_TARGET=admin npm run build:vercel
```

Local smoke test:

```bash
npm run test:smoke
```

Static whitespace check:

```bash
git diff --check
```

## What `test:smoke` Covers

- Starts student app on `localhost:3000`.
- Starts admin app on `localhost:3001`.
- Verifies student login page renders.
- Verifies unauthenticated student protected routes redirect.
- Verifies unauthenticated student practice routes (`/practice` and skill pages) redirect.
- Verifies admin login page renders.
- Verifies unauthenticated admin protected routes redirect.
- Verifies new admin content routes (`/full-tests`, `/full-tests/new`) are protected.

## What Requires Live Manual QA

The following need real Vercel/Supabase env variables and production data:

- Student login with real student ID.
- Student `/practice` and `/practice/[skill]` with real published tasks.
- Reading/listening/full-test answer submission.
- Writing submission and live word-count behavior.
- Admin Supabase Auth login.
- Lesson create/publish/unpublish.
- Full Test Builder save with real Supabase data.
- Full Test JSON import with real Supabase data.
- Listening audio upload to the `task-media` bucket.
- Writing review save.
- Student progress showing saved feedback.
