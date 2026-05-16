-- Add server-side AI quota enforcement and tighten executable privileges.

create table if not exists public.ai_usage_counters (
  user_id      uuid not null references auth.users(id) on delete cascade,
  feature      text not null check (feature in ('coach-message', 'habit-routine')),
  bucket_kind  text not null check (bucket_kind in ('hour', 'day')),
  bucket_start timestamptz not null,
  count        integer not null default 0 check (count >= 0),
  updated_at   timestamptz not null default now(),
  primary key (user_id, feature, bucket_kind, bucket_start)
);

create table if not exists public.ai_usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  feature    text not null check (feature in ('coach-message', 'habit-routine')),
  status     text not null check (status in ('allowed', 'blocked', 'succeeded', 'failed', 'fallback')),
  reason     text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_feature_created_idx
  on public.ai_usage_events(user_id, feature, created_at desc);

alter table public.ai_usage_counters enable row level security;
alter table public.ai_usage_events enable row level security;

revoke all on table public.ai_usage_counters from anon, authenticated;
revoke all on table public.ai_usage_events from anon, authenticated;
revoke all on table public.ai_usage_counters from public;
revoke all on table public.ai_usage_events from public;

create or replace function public.consume_ai_quota(
  p_user_id uuid,
  p_feature text,
  p_hourly_limit integer,
  p_daily_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text := current_setting('request.jwt.claim.role', true);
  v_now timestamptz := now();
  v_hour_start timestamptz := date_trunc('hour', v_now);
  v_day_start timestamptz := date_trunc('day', v_now);
  v_hour_count integer;
  v_day_count integer;
  v_feature_enabled boolean;
begin
  if v_role is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '28000';
  end if;

  if p_feature not in ('coach-message', 'habit-routine') then
    raise exception 'invalid AI feature' using errcode = '22023';
  end if;

  if p_hourly_limit < 1 or p_daily_limit < 1 then
    raise exception 'AI quota limits must be positive' using errcode = '22023';
  end if;

  select coalesce(enabled, false)
    into v_feature_enabled
    from public.feature_flags
   where key = 'ai_suggestions';

  if not coalesce(v_feature_enabled, false) then
    insert into public.ai_usage_events (user_id, feature, status, reason)
    values (p_user_id, p_feature, 'blocked', 'feature_disabled');
    return jsonb_build_object('allowed', false, 'reason', 'feature_disabled');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_feature, 0));

  select coalesce(count, 0)
    into v_hour_count
    from public.ai_usage_counters
   where user_id = p_user_id
     and feature = p_feature
     and bucket_kind = 'hour'
     and bucket_start = v_hour_start
   for update;

  select coalesce(count, 0)
    into v_day_count
    from public.ai_usage_counters
   where user_id = p_user_id
     and feature = p_feature
     and bucket_kind = 'day'
     and bucket_start = v_day_start
   for update;

  if coalesce(v_hour_count, 0) >= p_hourly_limit then
    insert into public.ai_usage_events (user_id, feature, status, reason, metadata)
    values (
      p_user_id,
      p_feature,
      'blocked',
      'hourly_quota_exceeded',
      jsonb_build_object('limit', p_hourly_limit)
    );
    return jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exceeded',
      'bucket', 'hour',
      'retryAfterSeconds', greatest(1, extract(epoch from (v_hour_start + interval '1 hour' - v_now))::int)
    );
  end if;

  if coalesce(v_day_count, 0) >= p_daily_limit then
    insert into public.ai_usage_events (user_id, feature, status, reason, metadata)
    values (
      p_user_id,
      p_feature,
      'blocked',
      'daily_quota_exceeded',
      jsonb_build_object('limit', p_daily_limit)
    );
    return jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exceeded',
      'bucket', 'day',
      'retryAfterSeconds', greatest(1, extract(epoch from (v_day_start + interval '1 day' - v_now))::int)
    );
  end if;

  insert into public.ai_usage_counters (user_id, feature, bucket_kind, bucket_start, count)
  values
    (p_user_id, p_feature, 'hour', v_hour_start, 1),
    (p_user_id, p_feature, 'day', v_day_start, 1)
  on conflict (user_id, feature, bucket_kind, bucket_start)
  do update set count = public.ai_usage_counters.count + 1,
                updated_at = now();

  insert into public.ai_usage_events (user_id, feature, status)
  values (p_user_id, p_feature, 'allowed');

  return jsonb_build_object('allowed', true);
end;
$$;

revoke execute on function public.consume_ai_quota(uuid, text, integer, integer) from public;
revoke execute on function public.consume_ai_quota(uuid, text, integer, integer) from anon;
revoke execute on function public.consume_ai_quota(uuid, text, integer, integer) from authenticated;
grant execute on function public.consume_ai_quota(uuid, text, integer, integer) to service_role;

-- Trigger/internal functions do not need default PUBLIC execute.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- Keep public aggregate stats available to the landing page, but remove the
-- implicit PUBLIC grant so access is explicit.
revoke execute on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon;

-- Keep the leaderboard RPC restricted if this migration is applied alone.
revoke execute on function public.get_leaderboard(text) from public;
revoke execute on function public.get_leaderboard(text) from anon;
grant execute on function public.get_leaderboard(text) to authenticated;
