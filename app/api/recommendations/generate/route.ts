import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON, embedBatch } from '@/lib/ai/provider'

interface GeneratedListing {
  title: string
  company: string
  location: string
  duration: string
  stipend: string
  description: string
  required_skills: string[]
}

interface GenerateResult {
  listings: GeneratedListing[]
}

function buildPrompt(candidateInfo: string, kind: 'internship' | 'externship') {
  const guidance =
    kind === 'internship'
      ? `Internships are longer (3-6 months), usually paid with a monthly stipend, and closer to a real junior-employee role.`
      : `Externships are SHORT (2-6 weeks), project-based, often unpaid or a small one-time stipend plus a certificate, and don't require as long a commitment as an internship.`

  return `You are AIRA, an AI career copilot generating realistic ${kind} opportunities tailored to a specific student's actual skills and field.

${candidateInfo}

Return a JSON object with EXACTLY this shape:
{
  "listings": [
    {
      "title": "<realistic role title>",
      "company": "<a plausible INVENTED company name — never a real company>",
      "location": "<city, India, or 'Remote'>",
      "duration": "<realistic duration for a ${kind}>",
      "stipend": "<realistic pay for a ${kind}, e.g. '₹18,000/mo' or 'Unpaid · Certificate'>",
      "description": "<one sentence on what the role involves>",
      "required_skills": ["<4-6 skills — mostly skills the candidate already has, plus 1-2 reach skills for growth>"]
    }
  ]
}

${guidance}
Generate exactly 4 listings, all of them ${kind}s. Base every listing on the
candidate's ACTUAL skills and field above — don't generate generic/unrelated
roles. Vary companies, titles, and locations realistically.
IMPORTANT: These are AI-generated realistic postings for practice/matching
purposes, not real live job listings — invented company names are required.`
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: analysis } = await supabase
    .from('resume_analysis')
    .select('score, extracted_skills, summary')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!analysis) {
    return NextResponse.json(
      { error: 'Upload and analyze a resume first so AIRA knows your skills.' },
      { status: 400 },
    )
  }

  const candidateInfo = `Candidate summary: ${analysis.summary}
Resume score: ${analysis.score}/100
Skills: ${(analysis.extracted_skills ?? []).join(', ') || 'none listed'}`

  let internshipResult: GenerateResult
  let externshipResult: GenerateResult
  try {
    ;[internshipResult, externshipResult] = await Promise.all([
      generateJSON<GenerateResult>(
        candidateInfo,
        buildPrompt(candidateInfo, 'internship'),
      ),
      generateJSON<GenerateResult>(
        candidateInfo,
        buildPrompt(candidateInfo, 'externship'),
      ),
    ])
  } catch (err) {
    return NextResponse.json(
      {
        error:
          (err as Error).message ||
          'Could not reach the AI provider. Make sure "ollama serve" is running (or GROQ_API_KEY is set).',
      },
      { status: 502 },
    )
  }

  const internshipRows = (internshipResult.listings ?? []).map((l) => ({
    user_id: user.id,
    title: l.title,
    company: l.company,
    location: l.location,
    duration: l.duration,
    stipend: l.stipend,
    description: l.description,
    required_skills: l.required_skills ?? [],
    opportunity_type: 'internship' as const,
  }))

  const externshipRows = (externshipResult.listings ?? []).map((l) => ({
    user_id: user.id,
    title: l.title,
    company: l.company,
    location: l.location,
    duration: l.duration,
    stipend: l.stipend,
    description: l.description,
    required_skills: l.required_skills ?? [],
    opportunity_type: 'externship' as const,
  }))

  const rows = [...internshipRows, ...externshipRows]

  if (!rows.length) {
    return NextResponse.json(
      { error: 'AIRA could not generate recommendations. Try again.' },
      { status: 502 },
    )
  }

  // Precompute skill embeddings for semantic matching later — cached here
  // so the recommendations page doesn't need to call the AI provider on
  // every view, just cheap vector math.
  let rowsWithEmbeddings = rows.map((r) => ({ ...r, required_skills_embeddings: [] as number[][] }))
  try {
    const skillCounts = rows.map((r) => r.required_skills.length)
    const allSkills = rows.flatMap((r) => r.required_skills)
    const allEmbeddings = await embedBatch(allSkills)

    let cursor = 0
    rowsWithEmbeddings = rows.map((r, i) => {
      const count = skillCounts[i]
      const embeds = allEmbeddings.slice(cursor, cursor + count)
      cursor += count
      return { ...r, required_skills_embeddings: embeds }
    })
  } catch {
    // Embeddings are a nice-to-have here — if they fail, recommendations
    // still work via the string-matching fallback in lib/match.ts.
  }

  // Replace this user's previous generated batch with the fresh one
  await supabase.from('internships').delete().eq('user_id', user.id)

  const { error: insertError } = await supabase.from('internships').insert(rowsWithEmbeddings)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    count: rows.length,
    internships: internshipRows.length,
    externships: externshipRows.length,
  })
}
