-- Speed up the student login "checking" step.
-- The login looks a student up by student_code (exact) + name (ilike), then reads
-- that student's device sessions. Without these indexes those become sequential
-- scans, which get slower as the tables grow.

-- Exact-match lookup on the access ID used at login.
create index if not exists idx_students_student_code
  on public.students (student_code);

-- Case-insensitive name lookup (matches .ilike("name", ...) in getStudentByCode).
create index if not exists idx_students_lower_name
  on public.students (lower(name));

-- Device-session reads/counts are always scoped to one student.
create index if not exists idx_student_device_sessions_student_id
  on public.student_device_sessions (student_id);
