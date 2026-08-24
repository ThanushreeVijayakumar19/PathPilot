# PathPilot Backend Setup

Follow these steps once to get the real backend working locally.

## 1. Run the database schema

1. Go to your Supabase project → **SQL Editor** → **New query**.
2. Paste in the entire contents of `supabase/schema.sql` (in this folder).
3. Click **Run**.

This creates all the tables (resumes, resume_analysis, internships, skill_gaps,
roadmap_items, chat_messages), sets up row-level security so users can only see
their own data, auto-creates a `profiles` row on signup, and seeds 6 sample
internships to match against.

## 2. Create a storage bucket for resume files

1. In Supabase, go to **Storage** → **New bucket**.
2. Name it exactly: `resumes`
3. Set it to **Private** (not public) — resumes are personal.
4. Click **Create bucket**.
5. Go to the bucket's **Policies** tab → **New policy** → choose the template
   **"Give users access to only their own top level folder"** (or create a
   custom policy allowing `insert`/`select` where
   `(storage.foldername(name))[1] = auth.uid()::text`).

## 3. Make sure Ollama is running

```
ollama serve
```

(If you installed the Ollama desktop app, it already runs this in the
background — you can check with `ollama list`.)

We use the `llama3.2` model by default. If you pulled a different one, add
this to `.env.local`:

```
OLLAMA_MODEL=your-model-name
```

## 4. Install the new dependency and run

```
npm install
npm run dev
```

That's it — resume upload now extracts real text from your PDF, sends it to
your local Ollama model for analysis, and stores the results in Supabase.

**Important:** since Ollama runs on your own machine, this only works while
you're running `npm run dev` locally with Ollama active. It won't work if you
deploy this app to a live server later — you'd need a hosted AI provider at
that point instead.
