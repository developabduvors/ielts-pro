create table if not exists public.site_settings (
  id text primary key default 'main',
  brand_name text not null default 'IELTS Pro',
  logo_text text not null default 'IP',
  teacher_name text not null default 'Miravzal',
  teacher_title text not null default 'IELTS mentor',
  teacher_band text not null default 'Band-focused coaching',
  teacher_bio text not null default 'Teacher-led IELTS preparation with private student access, structured lessons, and reviewed progress.',
  hero_title text not null default 'Structured IELTS lessons, tests, and progress for Miravzal students.',
  hero_subtitle text not null default 'A clean practice workspace for reading, listening, writing, full tests, and reviewed student results.',
  student_app_url text,
  contact_email text,
  telegram_url text,
  phone text,
  payments_enabled boolean not null default false,
  free_course_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Public site settings are readable" on public.site_settings;
create policy "Public site settings are readable"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Teacher admins manage site settings" on public.site_settings;
create policy "Teacher admins manage site settings"
on public.site_settings
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

insert into public.site_settings (id)
values ('main')
on conflict (id) do nothing;

grant select on public.site_settings to anon, authenticated, service_role;
grant insert, update, delete on public.site_settings to authenticated, service_role;
