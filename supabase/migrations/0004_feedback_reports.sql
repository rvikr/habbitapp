-- Tester feedback collected from the in-app Settings > Send Feedback screen.

create table if not exists public.feedback_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text,
  category     text not null check (category in ('bug', 'idea', 'usability', 'other')),
  rating       int not null check (rating between 1 and 5),
  message      text not null check (char_length(message) between 10 and 2000),
  app_version  text,
  build_number text,
  platform     text,
  os_version   text,
  device_name  text,
  status       text not null default 'new'
               check (status in ('new', 'reviewed', 'planned', 'resolved', 'closed')),
  created_at   timestamptz not null default now()
);

create index if not exists feedback_reports_user_id_idx
  on public.feedback_reports(user_id);

create index if not exists feedback_reports_status_created_at_idx
  on public.feedback_reports(status, created_at desc);

alter table public.feedback_reports enable row level security;

drop policy if exists "feedback: owner insert" on public.feedback_reports;
create policy "feedback: owner insert"
  on public.feedback_reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "feedback: owner read" on public.feedback_reports;
create policy "feedback: owner read"
  on public.feedback_reports for select
  using (auth.uid() = user_id);
