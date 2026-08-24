-- PathPilot database schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run

-- 1. Profiles (extends auth.users with app-specific info)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  track text default 'Software Engineering',
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. Resumes (uploaded files + extracted text)
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  storage_path text not null,
  raw_text text,
  uploaded_at timestamptz default now()
);

alter table resumes enable row level security;

create policy "Users can manage their own resumes"
  on resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Resume analysis (AI-generated results for a given resume)
create table if not exists resume_analysis (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  score int not null,
  format_score int default 75,
  content_score int default 75,
  impact_score int default 75,
  summary text,
  strengths jsonb default '[]'::jsonb,
  improvements jsonb default '[]'::jsonb,
  extracted_skills jsonb default '[]'::jsonb,
  extracted_skills_embeddings jsonb default '[]'::jsonb,
  inferred_career_role text,
  projects jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table resume_analysis enable row level security;

create policy "Users can manage their own analysis"
  on resume_analysis for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Internships (public catalog, seeded once, read-only to users)
create table if not exists internships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  company text not null,
  location text not null,
  duration text,
  stipend text,
  description text,
  required_skills jsonb default '[]'::jsonb,
  required_skills_embeddings jsonb default '[]'::jsonb,
  opportunity_type text default 'internship' check (opportunity_type in ('internship', 'externship')),
  posted_at timestamptz default now()
);

alter table internships enable row level security;

create policy "Users can read their own AI-generated internships"
  on internships for select using (auth.uid() = user_id);

create policy "Users can insert their own AI-generated internships"
  on internships for insert with check (auth.uid() = user_id);

create policy "Users can delete their own AI-generated internships"
  on internships for delete using (auth.uid() = user_id);

-- 5. Skill gaps (per-user, generated from resume analysis)
create table if not exists skill_gaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  skill text not null,
  importance text default 'medium',
  resource_suggestion text,
  created_at timestamptz default now()
);

alter table skill_gaps enable row level security;

create policy "Users can manage their own skill gaps"
  on skill_gaps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. Roadmap items (per-user AI-generated learning plan)
create table if not exists roadmap_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  phase text not null,
  phase_title text default '',
  title text not null,
  item_type text default 'skill' check (item_type in ('skill', 'course', 'project', 'cert')),
  description text,
  order_index int default 0,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table roadmap_items enable row level security;

create policy "Users can manage their own roadmap"
  on roadmap_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. Chat messages (AIRA chatbot history)
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'aira')),
  content text not null,
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;

create policy "Users can manage their own chat messages"
  on chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 9. Migration-safe column additions (in case this file is re-run on an
--    existing database that was set up before these columns existed)
alter table roadmap_items add column if not exists phase_title text default '';
alter table roadmap_items add column if not exists item_type text default 'skill';

