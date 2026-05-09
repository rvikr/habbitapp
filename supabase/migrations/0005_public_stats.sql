-- Public stats function for the landing page.
-- SECURITY DEFINER lets it count all rows regardless of RLS,
-- which is safe because it only returns aggregate counts, no PII.
create or replace function public.get_public_stats()
returns json
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select json_build_object(
    'user_count',        (select count(distinct user_id)::int from public.habits),
    'completions_count', (select count(*)::int from public.habit_completions),
    'habits_count',      (select count(*)::int from public.habits where archived_at is null)
  )
$$;

grant execute on function public.get_public_stats() to anon;
