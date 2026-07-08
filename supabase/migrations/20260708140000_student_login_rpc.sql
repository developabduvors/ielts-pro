-- Collapse the multi-step student login into ONE database round-trip.
--
-- Before this, login did 3 sequential Supabase calls (lookup student -> count
-- device sessions -> insert session), and each round-trip to the DB region costs
-- ~1s+. This RPC does the lookup, status check, device-limit check, session
-- insert and last_login update in a single call. The app falls back to the old
-- multi-call path if this function is not present, so applying it is optional but
-- makes login several times faster.

begin;

create or replace function public.student_login(
  p_name text,
  p_code text,
  p_session_token_hash text,
  p_user_agent text default null,
  p_device_label text default 'Student browser'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students%rowtype;
  v_active_count integer;
  v_session_id uuid;
begin
  -- Match on the unique student_code (exact, trimmed) and a normalized name so a
  -- valid Access ID is not rejected over spacing/case differences. Mirrors the
  -- TypeScript normalizeStudentName() fallback.
  select * into v_student
  from public.students
  where student_code = btrim(p_code)
    and lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(p_name), '\s+', ' ', 'g'))
  limit 1;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if v_student.is_active is false or v_student.access_status = 'closed' then
    return jsonb_build_object('outcome', 'closed');
  end if;

  if v_student.max_devices is not null and v_student.max_devices > 0 then
    select count(*) into v_active_count
    from public.student_device_sessions
    where student_id = v_student.id
      and is_active is true
      and revoked_at is null;
    if v_active_count >= v_student.max_devices then
      return jsonb_build_object('outcome', 'device_limit');
    end if;
  end if;

  insert into public.student_device_sessions (student_id, session_token_hash, user_agent, device_label, is_active)
  values (v_student.id, p_session_token_hash, p_user_agent, coalesce(p_device_label, 'Student browser'), true)
  returning id into v_session_id;

  update public.students
    set last_login_at = now(), updated_at = now()
    where id = v_student.id;

  return jsonb_build_object(
    'outcome', 'ok',
    'device_session_id', v_session_id,
    'student', jsonb_build_object(
      'id', v_student.id,
      'name', v_student.name,
      'student_code', v_student.student_code,
      'group_id', v_student.group_id
    )
  );
end;
$$;

-- Server routes call this with the service role only; keep it off the public API.
revoke all on function public.student_login(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.student_login(text, text, text, text, text) to service_role;

commit;
