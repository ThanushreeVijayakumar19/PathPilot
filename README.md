# PathPilot

AI-powered internship discovery platform — real auth, real resume analysis,
real skill-matched recommendations, real AI chatbot, and a real personalized
roadmap.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (Postgres database + Auth + Storage)
- AI: Groq (cloud, used in production) or Ollama (local, used in development)

## Local development

See `BACKEND_SETUP.md` for full setup (Supabase schema, storage bucket, Ollama).

```
npm install
npm run dev
```

## Deploying to Vercel (production)

Since Ollama only runs on your own machine, the deployed version uses
**Groq** instead — a free, cloud-hosted AI provider with an OpenAI-compatible
API. The app automatically switches to Groq whenever a `GROQ_API_KEY`
environment variable is present, and falls back to Ollama otherwise — no
code changes needed between local dev and production.

### 1. Get a free Groq API key

1. Go to **console.groq.com** and sign up (no credit card required)
2. Go to **API Keys** → **Create API Key**
3. Copy the key (starts with `gsk_...`)

### 2. Push your code to GitHub

(See earlier setup — `git init`, `git add .`, `git commit`, `git push`.)

### 3. Deploy on Vercel

1. Go to **vercel.com**, sign up/log in with GitHub
2. Click **Add New** → **Project**
3. Select your `pathpilot` repository → **Import**
4. Before deploying, add these **Environment Variables**:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase publishable key |
   | `GROQ_API_KEY` | your Groq API key from step 1 |

5. Click **Deploy**
6. Once done, Vercel gives you a live URL like `https://pathpilot-yourname.vercel.app`

### 4. Update Supabase auth settings

Supabase needs to know your live URL is allowed to redirect after login:

1. Supabase dashboard → your project → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL** and **Redirect URLs**

That's it — your live site now uses Supabase (same as local) for data/auth,
and Groq (instead of Ollama) for AI features. Every `git push` to your main
branch automatically redeploys.

## Notes

- Groq's free tier: 30 requests/minute, 14,400 requests/day — plenty for a
  project like this.
- The Vercel Hobby (free) plan is for personal/non-commercial use, which
  covers a student project.
