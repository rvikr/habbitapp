-- Narrow the public visibility of profiles.
-- Before: any authenticated user could read every column of every profile
-- where display_name is not null — including is_pro and platform.
-- After: a dedicated public_profiles view exposes only display fields, and
-- the table itself is owner-only.

-- Drop the broad "anyone read named" policy on profiles.
drop policy if exists "profiles: anyone read named" on public.profiles;

-- Public-facing view: only display attributes, only opted-in users.
create or replace view public.public_profiles
with (security_invoker = true)
as
select
  user_id,
  display_name,
  avatar_style,
  avatar_seed
from public.profiles
where display_name is not null;

grant select on public.public_profiles to authenticated;

-- Re-grant select on profiles to owner only via existing "profiles: owner read self".
-- Other features that previously read profiles to render display_name/avatar_*
-- (leaderboard, share-card, etc.) should switch to public_profiles.
