# Changelog

## 2026-07-01

- Rebuilt the student UI into a premium IELTS practice portal.
- Added skill cards, visual band path, progress summary, recent attempts, and improved test cards.
- Redesigned the test-taking screen with exam header, answer sheet, question navigator, and better reading/listening/writing surfaces.
- Redesigned the admin panel as a teacher SaaS dashboard with sidebar, stat cards, recent submissions, content studio, roster, and writing review queue.
- Added reusable `TestCard` and `QuestionNavigator` components.
- Added Node-based smoke tests with `npm run test:smoke`.
- Added QA documentation: `QA_AUDIT.md`, `QA_REPORT.md`, `TESTING.md`, and `DEPLOYMENT.md`.
- Improved Vercel split deployment documentation and kept student/admin build selection through `LMS_APP_TARGET`.
- Rebuilt admin `/lessons` into a Content Studio with skill overview, publish controls, task visibility matrix, and student preview links.
- Added `/full-tests` library and `/full-tests/new` Full Test Builder with Reading, Listening, Writing, JSON import, and Supabase Storage audio upload support.
- Added `docs/FULL_TEST_IMPORT.md` for the full-test JSON schema and publishing workflow.
- Updated the student test player to render full-test sections instead of treating them like reading-only tasks.
- Prevented JSON/import failures from crashing the builder page; errors now return as visible builder messages.
- Added separate Reading, Listening, and Writing JSON import flows.
- Added manual question-type controls and inline completion blanks for note/summary/table-style questions.
