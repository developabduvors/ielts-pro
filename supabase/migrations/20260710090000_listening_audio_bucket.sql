-- Listening audio uploads: teacher-uploaded MP3/M4A files for listening tests.
-- Public bucket so the student <audio> player can stream directly from the
-- Supabase CDN (with range/seek support) without proxying through Vercel.
-- Writes are only possible via signed upload URLs minted by the admin server
-- action with the service role, so no insert/update policies are needed.
insert into storage.buckets (id, name, public)
values ('listening-audio', 'listening-audio', true)
on conflict (id) do nothing;
