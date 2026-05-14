alter table public.habits add column if not exists habit_type text default 'custom';
alter table public.habits add column if not exists metric_type text default 'boolean';
alter table public.habits add column if not exists visual_type text default 'progress_ring';
alter table public.habits add column if not exists reminder_strategy text default 'manual';
alter table public.habits add column if not exists reminder_interval_minutes int;
alter table public.habits add column if not exists default_log_value numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'habits_habit_type_check'
      and conrelid = 'public.habits'::regclass
  ) then
    alter table public.habits add constraint habits_habit_type_check
      check (habit_type in ('water_intake', 'walk', 'sleep', 'read', 'run', 'cycling', 'meditate', 'workout', 'journal', 'vitamins', 'healthy_eating', 'cold_shower', 'no_social_media', 'coding', 'stretch', 'cooking', 'custom'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'habits_metric_type_check'
      and conrelid = 'public.habits'::regclass
  ) then
    alter table public.habits add constraint habits_metric_type_check
      check (metric_type in ('volume_ml', 'steps', 'hours', 'pages', 'minutes', 'distance_km', 'boolean'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'habits_visual_type_check'
      and conrelid = 'public.habits'::regclass
  ) then
    alter table public.habits add constraint habits_visual_type_check
      check (visual_type in ('water_bottle', 'step_path', 'sleep_moon', 'reading_book', 'progress_ring'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'habits_reminder_strategy_check'
      and conrelid = 'public.habits'::regclass
  ) then
    alter table public.habits add constraint habits_reminder_strategy_check
      check (reminder_strategy in ('manual', 'interval', 'conditional_interval'));
  end if;
end $$;

update public.habits
set
  habit_type = case
    when lower(coalesce(name, '') || ' ' || coalesce(icon, '') || ' ' || coalesce(unit, '')) similar to '%(water|hydrate|hydration|drink)%' then 'water_intake'
    when lower(coalesce(name, '') || ' ' || coalesce(icon, '') || ' ' || coalesce(unit, '')) similar to '%(walk|steps|stroll)%' then 'walk'
    when lower(coalesce(name, '') || ' ' || coalesce(icon, '') || ' ' || coalesce(unit, '')) similar to '%(sleep|bedtime)%' then 'sleep'
    when lower(coalesce(name, '') || ' ' || coalesce(icon, '') || ' ' || coalesce(unit, '')) similar to '%(read|book|pages)%' then 'read'
    when lower(coalesce(name, '') || ' ' || coalesce(icon, '') || ' ' || coalesce(unit, '')) similar to '%(run|running|jog)%' then 'run'
    when lower(coalesce(name, '') || ' ' || coalesce(icon, '') || ' ' || coalesce(unit, '')) similar to '%(cycle|cycling|bike|bicycle)%' then 'cycling'
    else coalesce(habit_type, 'custom')
  end
where habit_type is null or habit_type = 'custom';

update public.habits
set
  metric_type = case habit_type
    when 'water_intake' then 'volume_ml'
    when 'walk' then 'steps'
    when 'sleep' then 'hours'
    when 'read' then 'pages'
    when 'run' then 'distance_km'
    when 'cycling' then 'distance_km'
    else coalesce(metric_type, 'boolean')
  end,
  visual_type = case habit_type
    when 'water_intake' then 'water_bottle'
    when 'walk' then 'step_path'
    when 'sleep' then 'sleep_moon'
    when 'read' then 'reading_book'
    else coalesce(visual_type, 'progress_ring')
  end,
  reminder_strategy = case habit_type
    when 'water_intake' then 'interval'
    when 'walk' then 'conditional_interval'
    else coalesce(reminder_strategy, 'manual')
  end,
  reminder_interval_minutes = case habit_type
    when 'water_intake' then coalesce(reminder_interval_minutes, 120)
    when 'walk' then coalesce(reminder_interval_minutes, 60)
    else reminder_interval_minutes
  end,
  default_log_value = case habit_type
    when 'water_intake' then coalesce(default_log_value, 250)
    when 'walk' then coalesce(default_log_value, 1000)
    when 'sleep' then coalesce(default_log_value, 1)
    when 'read' then coalesce(default_log_value, 10)
    else default_log_value
  end;
