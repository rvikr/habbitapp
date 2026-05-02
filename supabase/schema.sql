-- HabitApp schema. Run this in the Supabase SQL editor for your project.
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE / IF EXISTS.

create extension if not exists "pgcrypto";

create table if not exists public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  icon        text not null default 'spa',
  color       text not null default 'primary'
              check (color in ('primary', 'secondary', 'tertiary', 'neutral')),
  target      numeric,
  unit        text,
  reminder_time time,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists habits_user_id_idx on public.habits(user_id);

-- Newer columns: multi-time reminders + day-of-week filter (existing rows keep
-- their single reminder_time column for backward compatibility).
alter table public.habits add column if not exists reminder_times text[] default '{}'::text[];
alter table public.habits add column if not exists reminder_days  int[]  default '{0,1,2,3,4,5,6}'::int[];
alter table public.habits add column if not exists reminders_enabled boolean default false;

create table if not exists public.habit_completions (
  id            uuid primary key default gen_random_uuid(),
  habit_id      uuid not null references public.habits(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  completed_on  date not null default current_date,
  value         numeric,
  note          text,
  created_at    timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create index if not exists completions_user_date_idx
  on public.habit_completions(user_id, completed_on);

-- Row Level Security
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;

drop policy if exists "habits: owner read" on public.habits;
create policy "habits: owner read"
  on public.habits for select
  using (auth.uid() = user_id);

drop policy if exists "habits: owner insert" on public.habits;
create policy "habits: owner insert"
  on public.habits for insert
  with check (auth.uid() = user_id);

drop policy if exists "habits: owner update" on public.habits;
create policy "habits: owner update"
  on public.habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "habits: owner delete" on public.habits;
create policy "habits: owner delete"
  on public.habits for delete
  using (auth.uid() = user_id);

drop policy if exists "completions: owner read" on public.habit_completions;
create policy "completions: owner read"
  on public.habit_completions for select
  using (auth.uid() = user_id);

drop policy if exists "completions: owner insert" on public.habit_completions;
create policy "completions: owner insert"
  on public.habit_completions for insert
  with check (auth.uid() = user_id);

drop policy if exists "completions: owner delete" on public.habit_completions;
create policy "completions: owner delete"
  on public.habit_completions for delete
  using (auth.uid() = user_id);

drop policy if exists "completions: owner update" on public.habit_completions;
create policy "completions: owner update"
  on public.habit_completions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
