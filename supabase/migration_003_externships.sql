-- Run this in Supabase SQL Editor (New query -> paste -> Run)
-- Adds internship-vs-externship distinction, and seeds 4 externship listings.
-- Safe to run even if you already ran schema.sql / migration_002.

alter table internships add column if not exists opportunity_type text default 'internship';
alter table internships drop constraint if exists internships_opportunity_type_check;
alter table internships add constraint internships_opportunity_type_check
  check (opportunity_type in ('internship', 'externship'));

-- Existing rows default to 'internship' already via the column default,
-- but set it explicitly in case they were inserted before this migration.
update internships set opportunity_type = 'internship' where opportunity_type is null;

insert into internships (title, company, location, duration, stipend, description, required_skills, opportunity_type)
select * from (values
  ('Product Design Externship', 'Northlight Studio', 'Remote', '4 weeks', 'Unpaid · Certificate',
   'Short, project-based externship redesigning a real product flow and presenting to the design team.',
   '["Figma", "UI Design", "User Research", "Prototyping"]'::jsonb, 'externship'),
  ('Growth Marketing Externship', 'Marketly', 'Remote', '3 weeks', '₹5,000 stipend',
   'A short externship running a real campaign experiment and reporting results to the growth team.',
   '["SEO", "Content Writing", "Analytics", "A/B Testing"]'::jsonb, 'externship'),
  ('Software Engineering Externship', 'Craftbox', 'Remote', '6 weeks', '₹8,000 stipend',
   'Project-based externship building one scoped feature end-to-end with mentor code reviews.',
   '["JavaScript", "React", "Git", "REST APIs"]'::jsonb, 'externship'),
  ('Data Science Externship', 'DeepField AI', 'Remote', '4 weeks', 'Unpaid · Certificate',
   'Short externship solving a real applied ML problem with weekly mentor check-ins.',
   '["Python", "Pandas", "Machine Learning", "SQL"]'::jsonb, 'externship')
) as new_rows(title, company, location, duration, stipend, description, required_skills, opportunity_type)
where not exists (
  select 1 from internships i where i.title = new_rows.title
);
