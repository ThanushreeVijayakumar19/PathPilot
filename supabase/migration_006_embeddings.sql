-- Run this in Supabase SQL Editor (New query -> paste -> Run)
-- Adds support for embedding-based semantic skill matching, replacing
-- purely literal string matching / free-form AI-guessed skill gaps.

alter table resume_analysis add column if not exists extracted_skills_embeddings jsonb default '[]'::jsonb;
alter table resume_analysis add column if not exists inferred_career_role text;
alter table internships add column if not exists required_skills_embeddings jsonb default '[]'::jsonb;

notify pgrst, 'reload schema';
