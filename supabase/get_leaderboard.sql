-- Leaderboard function — run this once in Supabase Dashboard → SQL Editor
-- Returns top 50 users ranked by XP (100 XP per habit completion)
-- Supports period: 'week' | 'month' | 'all'

create or replace function get_leaderboard(period text default 'all')
returns table (
  rank        bigint,
  user_id     uuid,
  display_name text,
  xp          bigint,
  streak      int,
  is_current_user boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_start_date date;
begin
  v_start_date := case
    when period = 'week'  then current_date - interval '7 days'
    when period = 'month' then current_date - interval '30 days'
    else '1970-01-01'::date
  end;

  return query
  with user_xp as (
    select
      hc.user_id,
      count(*)::bigint * 100 as xp
    from habit_completions hc
    where hc.completed_on >= v_start_date
    group by hc.user_id
  ),
  user_streak as (
    -- consecutive days up to today (looks back 60 days)
    select
      hc.user_id,
      count(distinct hc.completed_on)::int as streak
    from habit_completions hc
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
          from habit_completions hc2
          where hc2.user_id = hc.user_id
        )
      )
    group by hc.user_id
  )
  select
    row_number() over (order by ux.xp desc)::bigint as rank,
    ux.user_id,
    coalesce(
      p.display_name,
      split_part(au.email, '@', 1),
      'Anonymous'
    )::text as display_name,
    ux.xp,
    coalesce(us.streak, 0)::int as streak,
    (ux.user_id = v_user_id) as is_current_user
  from user_xp ux
  left join profiles    p  on p.user_id  = ux.user_id
  left join auth.users  au on au.id      = ux.user_id
  left join user_streak us on us.user_id = ux.user_id
  order by ux.xp desc
  limit 50;
end;
$$;

-- Allow authenticated users to call this function
grant execute on function get_leaderboard(text) to authenticated;
