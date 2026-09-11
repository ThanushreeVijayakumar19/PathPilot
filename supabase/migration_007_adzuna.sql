-- Run this in Supabase SQL Editor (New query -> paste -> Run)
-- Adds support for real internship listings pulled from Adzuna, alongside
-- the existing AI-generated fallback.

alter table internships add column if not exists source text default 'ai';
alter table internships drop constraint if exists internships_source_check;
alter table internships add constraint internships_source_check
  check (source in ('ai', 'adzuna'));
alter table internships add column if not exists apply_url text;

notify pgrst, 'reload schema';
