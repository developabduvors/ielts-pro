# QA Report

Date: 2026-07-01

## Skills Used

- `frontend-design`: used for the premium IELTS LMS visual direction and UI polish.
- `agent-browser`: used for reference-site inspection and local browser snapshots of the student/admin experiences.
- `web-design-guidelines`: used for accessibility and interface audit checks.
- `nextjs-best-practices`: used for App Router route/action boundaries and Vercel build checks.
- `supabase`: used for server-only Supabase Storage upload and Data API safety checks.
- `webapp-testing`: used to define the local browser QA workflow and smoke coverage expectations.

## Reference Review

`https://ieltsulugbeks.com/` was inspected as a UX benchmark. Homepage, skill selection, Reading practice, real-exam test list, dashboard-style cards, and exam-taking surfaces were reviewed where publicly reachable. The useful patterns were:

- IELTS skill-specific structure for Reading, Listening, Writing, and test practice.
- Compact exam-like test interface with top/bottom controls and question navigation.
- Clean educational SaaS palette: blue/slate base, amber accent, skill tones.
- Clear cards, badges, result states, and responsive task flow.

No logo, text, images, exact CSS, or exact layout were copied.

## Automated Checks

Run:

```bash
npm run build:vercel
LMS_APP_TARGET=admin npm run build:vercel
npm run typecheck
npm run test:smoke
git diff --check
```

Current validated in this pass:

- Student Vercel build: passed.
- Admin Vercel build: passed.
- Typecheck: passed.
- Smoke tests: passed.
- `git diff --check`: passed.

## Browser QA

Validated before this QA documentation pass:

- Student login loads on desktop.
- Admin login loads on desktop.
- Student login mobile layout at 390px width has no horizontal overflow.
- Buttons and visible copy render with the new visual system.

Smoke test coverage added:

- Student `/` renders.
- Student `/dashboard`, `/progress`, `/tests/smoke-task` redirect while unauthenticated.
- Student `/practice` and skill practice routes redirect while unauthenticated.
- Admin `/` renders.
- Admin `/dashboard`, `/students`, `/lessons`, `/full-tests`, `/full-tests/new`, `/submissions` redirect while unauthenticated.

Additional browser QA in this pass:

- Student login desktop screenshot passed with no console errors.
- Admin Full Test Builder desktop screenshot passed with no console errors.
- Admin Full Test Builder mobile screenshot passed with no console errors.
- Admin DB-backed pages require local Supabase env values; without them, `/lessons` correctly cannot render protected data locally.
- Builder errors from invalid JSON/upload/Supabase writes now return to `/full-tests/new` with a visible error message instead of crashing the page.
- Manual Reading/Listening question type controls now include completion-style question types.
- Student dashboard skill cards now open real skill pages instead of acting as static cards.
- Student writing answers now show live word count and target progress.
- Full-test section questions are flattened consistently for rendering and grading.

## Manual Live Checks Still Required

These require production Supabase env values and real seeded data:

1. Login as real student.
2. Open dashboard and verify published lessons/tasks load.
3. Open a real Reading task from a card.
4. Select/input answers and submit.
5. Open a real Listening task and verify audio if attached.
6. Submit a Writing response.
7. Login as admin with Supabase Auth.
8. Publish/unpublish a lesson.
9. Create a lesson.
10. Create a full test draft from `/full-tests/new`.
11. Import a full test JSON file.
12. Import Reading, Listening, and Writing JSON separately.
13. Upload a listening audio file to the `task-media` bucket and verify student playback.
14. Open a note completion task and verify blanks render inline.
15. Review a writing submission and save score/feedback.
16. Confirm student `/progress` shows the teacher feedback.
17. Open `/practice` and each skill page with real data.
18. Confirm unpublished task direct URL returns blocked/not found.

## Result

The UI is now substantially more premium and IELTS-specific. Full-test creation, split skill JSON import, student section rendering, skill practice pages, inline completion blanks, live writing word count, and server-side audio upload support are implemented. Remaining high-value work: add existing-test edit/reorder screens and run production Supabase smoke checks after deployment.
