-- Keep account deletion audit rows after the auth user is removed.
-- The app data should be deleted, but the audit record is operational evidence
-- that the request completed.

create table if not exists public.account_deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  email        text,
  reason       text,
  status       text not null default 'requested'
               check (status in ('requested', 'processing', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

-- Earlier schema tied this table to auth.users with ON DELETE CASCADE, which
-- deletes the audit row at exactly the moment we need to keep it.
do $$
declare
  fk_name text;
begin
  for fk_name in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any(c.conkey)
    where c.conrelid = 'public.account_deletion_requests'::regclass
      and c.confrelid = 'auth.users'::regclass
      and c.contype = 'f'
      and a.attname = 'user_id'
  loop
    execute format('alter table public.account_deletion_requests drop constraint %I', fk_name);
  end loop;
end $$;

create index if not exists account_deletion_requests_user_id_idx
  on public.account_deletion_requests(user_id);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "deletion requests: owner insert" on public.account_deletion_requests;
create policy "deletion requests: owner insert"
  on public.account_deletion_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "deletion requests: owner read" on public.account_deletion_requests;
create policy "deletion requests: owner read"
  on public.account_deletion_requests for select
  using (auth.uid() = user_id);
