import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON, embedBatch } from '@/lib/ai/provider'
import {
  adzunaConfigured,
  searchAdzunaJobs,
  formatStipend,
  guessOpportunityType,
  type AdzunaJob,
} from '@/lib/adzuna'
import { extractSkillsFromText } from '@/lib/skill-extraction'

interface InternshipRow {
  user_id: string
  title: string
  company: string
  location: string
  duration: string
  stipend: string
  description: string
  required_skills: string[]
  opportunity_type: 'internship' | 'externship'
  source: 'ai' | 'adzuna'
  apply_url: string | null
}

// Map our internal career role labels to good Adzuna search terms
const ROLE_SEARCH_TERMS: Record<string, string> = {
  'Frontend Developer': 'frontend developer intern',
  'Backend Developer': 'backend developer intern',
  'Full Stack Developer': 'full stack developer intern',
  'Data Analyst': 'data analyst intern',
  'Data Scientist / ML Engineer': 'data science intern',
  'Mobile App Developer': 'mobile app developer intern',
  'UI/UX Designer': 'ui ux designer intern',
  'DevOps / Cloud Engineer': 'devops intern',
  Cybersecurity: 'cybersecurity intern',
  'Product Management': 'product management intern',
  Other: 'intern',
}

async function fetchRealListings(
  userId: string,
  careerRole: string,
): Promise<InternshipRow[]> {
  const query = ROLE_SEARCH_TERMS[careerRole] || `${careerRole} intern`
  const jobs = await searchAdzunaJobs(query, { resultsPerPage: 12, maxDaysOld: 45 })

  return jobs.slice(0, 8).map((job: AdzunaJob) => ({
    user_id: userId,
    title: job.title,
    company: job.company,
    location: job.location,
    duration: 'See listing for details',
    stipend: formatStipend(job),
    description: job.description.slice(0, 400),
    required_skills: extractSkillsFromText(`${job.title} ${job.description}`),
    opportunity_type: guessOpportunityType(job),
    source: 'adzuna' as const,
    apply_url: job.applyUrl || null,
  }))
}

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

function buildAiFallbackPrompt(candidateInfo: string, kind: 'internship' | 'externship') {
  const guidance =
    kind === 'internship'
      ? `Internships are longer (3-6 months), usually paid with a monthly stipend, and closer to a real junior-employee role.`
      : `Externships are SHORT (2-6 weeks), project-based, often unpaid or a small one-time stipend plus a certificate, and don't require as long a commitment as an internship.`

  return `You are AIRA, an AI career copilot generating realistic ${kind} opportunities tailored to a specific student's actual skills and field. (Real listings weren't available right now, so generate plausible practice ones instead.)

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
Generate exactly 3 listings, all of them ${kind}s. Base every listing on the
candidate's ACTUAL skills and field above.
IMPORTANT: invented company names are required — never use a real company.`
}

async function fetchAiFallbackListings(
  userId: string,
  candidateInfo: string,
): Promise<InternshipRow[]> {
  const [internshipResult, externshipResult] = await Promise.all([
    generateJSON<GenerateResult>(candidateInfo, buildAiFallbackPrompt(candidateInfo, 'internship')),
    generateJSON<GenerateResult>(candidateInfo, buildAiFallbackPrompt(candidateInfo, 'externship')),
  ])

  const toRows = (result: GenerateResult, type: 'internship' | 'externship'): InternshipRow[] =>
    (result.listings ?? []).map((l) => ({
      user_id: userId,
      title: l.title,
      company: l.company,
      location: l.location,
      duration: l.duration,
      stipend: l.stipend,
      description: l.description,
      required_skills: l.required_skills ?? [],
      opportunity_type: type,
      source: 'ai' as const,
      apply_url: null,
    }))

  return [...toRows(internshipResult, 'internship'), ...toRows(externshipResult, 'externship')]
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const [{ data: analysis }, { data: profile }] = await Promise.all([
    supabase
      .from('resume_analysis')
      .select('score, extracted_skills, summary, inferred_career_role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('profiles').select('track').eq('id', user.id).maybeSingle(),
  ])

  if (!analysis) {
    return NextResponse.json(
      { error: 'Upload and analyze a resume first so AIRA knows your skills.' },
      { status: 400 },
    )
  }

  const careerRole = analysis.inferred_career_role || profile?.track || 'Other'

  let rows: InternshipRow[] = []
  let usedFallback = false

  // Try real listings first
  if (adzunaConfigured) {
    try {
      rows = await fetchRealListings(user.id, careerRole)
    } catch {
      rows = []
    }
  }

  // Fall back to AI-generated practice listings if real ones aren't
  // available or came back too thin to be useful
  if (rows.length < 4) {
    usedFallback = true
    const candidateInfo = `Candidate summary: ${analysis.summary}
Resume score: ${analysis.score}/100
Skills: ${(analysis.extracted_skills ?? []).join(', ') || 'none listed'}
Target role: ${careerRole}`

    try {
      const aiRows = await fetchAiFallbackListings(user.id, candidateInfo)
      // Keep any real listings we did get, top up with AI ones
      rows = [...rows, ...aiRows]
    } catch (err) {
      if (!rows.length) {
        return NextResponse.json(
          {
            error:
              (err as Error).message ||
              'Could not fetch real listings or reach the AI provider. Try again.',
          },
          { status: 502 },
        )
      }
      // We at least have some real listings — proceed with those
    }
  }

  if (!rows.length) {
    return NextResponse.json(
      { error: 'No recommendations could be generated. Try again.' },
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
    const allEmbeddings = allSkills.length ? await embedBatch(allSkills) : []

    let cursor = 0
    rowsWithEmbeddings = rows.map((r, i) => {
      const count = skillCounts[i]
      const embeds = allEmbeddings.slice(cursor, cursor + count)
      cursor += count
      return { ...r, required_skills_embeddings: embeds }
    })
  } catch {
    // Embeddings are a nice-to-have — if they fail, matching falls back
    // to string comparison in lib/match.ts.
  }

  await supabase.from('internships').delete().eq('user_id', user.id)

  const { error: insertError } = await supabase.from('internships').insert(rowsWithEmbeddings)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const realCount = rows.filter((r) => r.source === 'adzuna').length

  return NextResponse.json({
    success: true,
    count: rows.length,
    realListings: realCount,
    usedFallback,
  })
}
