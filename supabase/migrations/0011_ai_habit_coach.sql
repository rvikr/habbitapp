alter table public.profiles
  add column if not exists coach_tone text not null default 'friendly';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_coach_tone_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_coach_tone_check
      check (coach_tone in ('friendly', 'motivational', 'calm', 'strict', 'military'));
  end if;
end $$;
