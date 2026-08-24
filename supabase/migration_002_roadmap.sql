-- Run this in Supabase SQL Editor (New query -> paste -> Run)
-- Adds the two new columns needed for the real AI-generated roadmap feature.
-- Safe to run even if you already ran the original schema.sql.

alter table roadmap_items add column if not exists phase_title text default '';
alter table roadmap_items add column if not exists item_type text default 'skill';
