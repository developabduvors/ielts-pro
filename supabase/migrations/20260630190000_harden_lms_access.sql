-- IELTS Pro LMS access hardening draft.
--
-- IMPORTANT:
-- Do not run this on production until the frontend has been moved to
-- server-side API routes or security-definer RPCs for student dashboard,
-- submissions, and admin CRUD. The current static frontend still reads some
-- tables directly with the anon key, so strict RLS will intentionally block
-- parts of the current UI.
--
-- This migration is non-destructive: it does not delete existing data.

begin;

create table if not exists public.teacher_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

insert into public.teacher_admins (user_id, email)
select id, email
from auth.users
where email = 'miravzalsalakhiddinov@gmail.com'
on conflict (user_id) do nothing;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teacher_admins ta
    where ta.user_id = auth.uid()
  );
$$;

alter table public.teacher_admins enable row level security;
alter table public.admins enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.lessons enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "teachers can read teacher_admins" on public.teacher_admins;
create policy "teachers can read teacher_admins"
on public.teacher_admins
for select
to authenticated
using (public.is_teacher());

drop policy if exists "teachers can manage groups" on public.groups;
create policy "teachers can manage groups"
on public.groups
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

drop policy if exists "teachers can manage students" on public.students;
create policy "teachers can manage students"
on public.students
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

drop policy if exists "teachers can manage lessons" on public.lessons;
create policy "teachers can manage lessons"
on public.lessons
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

drop policy if exists "anon can read published lessons" on public.lessons;
create policy "anon can read published lessons"
on public.lessons
for select
to anon
using (published is true);

drop policy if exists "teachers can manage tasks" on public.tasks;
create policy "teachers can manage tasks"
on public.tasks
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

drop policy if exists "anon can read tasks from published lessons" on public.tasks;
create policy "anon can read tasks from published lessons"
on public.tasks
for select
to anon
using (
  exists (
    select 1
    from public.lessons l
    where l.id = tasks.lesson_id
      and l.published is true
  )
);

drop policy if exists "teachers can manage submissions" on public.submissions;
create policy "teachers can manage submissions"
on public.submissions
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

-- Keep direct anon reads/writes for students disabled in the target state.
-- Student-facing login, dashboard, and submissions should be implemented
-- through signed API routes or security-definer RPCs before applying this.

commit;
