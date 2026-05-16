-- Restrict the SECURITY DEFINER leaderboard RPC to signed-in callers.
--
-- Postgres grants EXECUTE on functions to PUBLIC by default, so the earlier
-- authenticated grant did not prevent anon REST/RPC calls. Revoke the default
-- grants and make the function fail closed if a future grant is broadened.

create or replace function public.get_leaderboard(period text default 'all')
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  xp bigint,
  streak int,
  is_current_user boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_start_date date;
begin
  if auth.uid() is null then
    raise exception 'authenticated user required' using errcode = '28000';
  end if;

  v_start_date := case
    when period = 'week' then current_date - interval '7 days'
    when period = 'month' then current_date - interval '30 days'
    else '1970-01-01'::date
  end;

  return query
  with user_xp as (
    select
      hc.user_id,
      count(*)::bigint * 10 as xp
    from public.habit_completions hc
    where hc.completed_on >= v_start_date
    group by hc.user_id
  ),
  user_streak as (
    select
      hc.user_id,
      count(distinct hc.completed_on)::int as streak
    from public.habit_completions hc
    where hc.completed_on >= current_date - interval '60 days'
      and hc.completed_on <= current_date
      and not exists (
        select 1
        from generate_series(
          hc.completed_on + 1,
          current_date,
          interval '1 day'
        ) gs(d)
        where gs.d::date not in (
          select distinct completed_on
          from public.habit_completions hc2
          where hc2.user_id = hc.user_id
        )
      )
    group by hc.user_id
  )
  select
    row_number() over (order by ux.xp desc)::bigint as rank,
    ux.user_id,
    p.display_name,
    ux.xp,
    coalesce(us.streak, 0)::int as streak,
    (ux.user_id = v_user_id) as is_current_user
  from user_xp ux
  join public.profiles p on p.user_id = ux.user_id and p.display_name is not null
  left join user_streak us on us.user_id = ux.user_id
  order by ux.xp desc
  limit 50;
end;
$$;

revoke execute on function public.get_leaderboard(text) from public;
revoke execute on function public.get_leaderboard(text) from anon;
grant execute on function public.get_leaderboard(text) to authenticated;
