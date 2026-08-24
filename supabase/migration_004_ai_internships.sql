-- Run this in Supabase SQL Editor (New query -> paste -> Run)
-- Converts internships from a shared static dataset into per-user,
-- AI-generated listings (each user gets their own personalized batch).

-- 1. Add the user_id column
alter table internships add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 1b. Ensure opportunity_type exists too (in case migration_003 was never run)
alter table internships add column if not exists opportunity_type text default 'internship';
alter table internships drop constraint if exists internships_opportunity_type_check;
alter table internships add constraint internships_opportunity_type_check
  check (opportunity_type in ('internship', 'externship'));
update internships set opportunity_type = 'internship' where opportunity_type is null;

-- 2. Remove the old sample/seed listings — they have no user_id and were
--    only ever meant as placeholder data before AI generation existed.
delete from internships where user_id is null;

-- 3. Replace the old "everyone can read everything" policy with
--    per-user ownership policies.
drop policy if exists "Anyone signed in can read internships" on internships;

drop policy if exists "Users can read their own AI-generated internships" on internships;
create policy "Users can read their own AI-generated internships"
  on internships for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own AI-generated internships" on internships;
create policy "Users can insert their own AI-generated internships"
  on internships for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own AI-generated internships" on internships;
create policy "Users can delete their own AI-generated internships"
  on internships for delete using (auth.uid() = user_id);

-- Force Supabase's API layer to pick up the schema changes immediately
-- instead of waiting for its normal cache refresh cycle.
notify pgrst, 'reload schema';
