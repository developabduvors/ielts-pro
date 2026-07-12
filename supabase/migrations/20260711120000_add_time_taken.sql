-- Track how long each test attempt took (seconds).
alter table public.submissions add column if not exists time_taken integer null;
