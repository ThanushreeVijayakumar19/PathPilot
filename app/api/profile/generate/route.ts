import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai/provider'
import { detectSkillGaps, generateGapSuggestions } from '@/lib/skill-gaps'

interface ProfileInput {
  careerRole: string
  education: string
  year: string
  cgpa: string
  strongSkills: string[]
  learningSkills: string[]
  projects: string
  certifications: string
  notes: string
}

interface AnalysisResult {
  score: number
  format_score: number
  content_score: number
  impact_score: number
  summary: string
  strengths: string[]
  improvements: string[]
  extracted_skills: string[]
  projects: { name: string; description: string; tags: string[] }[]
  certifications: { name: string; issuer: string; year: string }[]
}

/**
 * Computes a grounded baseline score from real, structured signal —
 * proficiency levels, project count, real certifications, CGPA — instead
 * of letting the AI freely invent a number from a flat list of skill names.
 * The AI is told to treat this as an anchor and only nudge it slightly,
 * so a beginner who lists 3 skills they've "just started learning" can't
 * end up with the same score as someone with real project experience.
 */
function computeBaselineScore(input: ProfileInput) {
  let score = 15 // floor: everyone starts somewhere

  // Confident skills matter far more than ones you're just starting.
  score += Math.min(input.strongSkills.length * 6, 30)
  score += Math.min(input.learningSkills.length * 2, 10)

  // Real projects are the strongest signal of applied ability.
  const projectCount = input.projects.trim()
    ? input.projects.split(/[.\n]/).filter((s) => s.trim().length > 10).length
    : 0
  score += Math.min(projectCount * 10, 20)

  // Real certifications, modestly weighted (they're not projects).
  const certCount = input.certifications.trim()
    ? input.certifications.split(',').filter((s) => s.trim()).length
    : 0
  score += Math.min(certCount * 4, 12)

  // Small CGPA bonus if provided and parseable.
  const cgpaMatch = input.cgpa.match(/[\d.]+/)
  if (cgpaMatch) {
    const num = parseFloat(cgpaMatch[0])
    const normalized = input.cgpa.includes('%') || num > 10 ? num / 10 : num
    if (normalized >= 6) score += Math.round(((normalized - 6) / 4) * 8) // up to +8 for a 10/10
  }

  return Math.max(15, Math.min(90, Math.round(score)))
}

const PROFILE_SYSTEM_PROMPT = `You are AIRA, an encouraging but HONEST AI career copilot helping a student who does NOT have a resume yet build their profile from scratch, based on a short form they filled out.

You are given a BASELINE SCORE that was computed deterministically from their actual proficiency levels, project count, real certifications, and CGPA. This baseline is your anchor — it already accounts for the difference between "skills I'm confident in" vs "skills I'm just starting to learn."

Return a JSON object with EXACTLY this shape:
{
  "score": <integer — start from the given baseline score and adjust it by AT MOST ±8 points based on genuine qualitative judgment of their answers. Do NOT ignore the baseline or invent an unrelated number.>,
  "format_score": <integer 0-100, always around 40-60 since there's no resume format yet>,
  "content_score": <integer 0-100, based on how much real substance they gave — weight confident skills and real projects much higher than skills they're "just learning">,
  "impact_score": <integer 0-100, LOW (under 30) unless they described a concrete project with an outcome — most beginners should score low here, that's expected and fine>,
  "summary": "<one or two encouraging but honest sentences summarizing where they're starting from — don't overstate their level>",
  "strengths": ["<genuine strength based on what they entered>", "..."],
  "improvements": ["<actionable next step, e.g. 'Build a project using X and add it here', 'Practice Y until you'd call yourself confident, not just familiar'>", "..."],
  "extracted_skills": ["<their CONFIDENT skills as given, plus their LEARNING skills clearly labeled as such, e.g. 'Python (learning)'>"],
  "projects": [{"name": "<if they described any project, name it, else omit>", "description": "<one sentence>", "tags": ["<tech used>"]}],
  "certifications": [{"name": "<ONLY from the certifications field they filled — never pull from skills fields>", "issuer": "<issuer if known else 'Self-reported'>", "year": ""}]
}
Return 3-6 strengths/improvements.
Only include projects/certifications the person actually described in those specific fields — never invent one, and never treat a skill as a certification.
Be encouraging in TONE, but honest in SCORE — inflating a beginner's score doesn't help them, it just makes their roadmap and match scores meaningless later.`

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = (await request.json()) as ProfileInput
  const {
    careerRole,
    education,
    year,
    cgpa,
    strongSkills,
    learningSkills,
    projects,
    certifications,
    notes,
  } = body

  if ((strongSkills?.length ?? 0) === 0 && (learningSkills?.length ?? 0) === 0) {
    return NextResponse.json(
      { error: 'Please list at least a few skills so AIRA has something to work with.' },
      { status: 400 },
    )
  }

  const baselineScore = computeBaselineScore(body)

  const profileText = `Target career role: ${careerRole || 'not specified'}
Education: ${education || 'not specified'}
Year/level: ${year || 'not specified'}
CGPA/percentage: ${cgpa || 'not provided'}
Skills they are CONFIDENT in: ${strongSkills?.length ? strongSkills.join(', ') : 'none'}
Skills they are JUST STARTING to learn: ${learningSkills?.length ? learningSkills.join(', ') : 'none'}
Projects (self-described): ${projects || 'none mentioned'}
Real certifications/courses completed (self-described): ${certifications || 'none mentioned'}
Additional notes: ${notes || 'none'}

BASELINE SCORE (computed from the above, use as your anchor): ${baselineScore}`

  let analysis: AnalysisResult
  try {
    analysis = await generateJSON<AnalysisResult>(profileText, PROFILE_SYSTEM_PROMPT)
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

  // Clamp the AI's score to stay within ±8 of the deterministic baseline,
  // no matter what it returned — this is the real guarantee against
  // inflated/ungrounded scores, not just a prompt instruction.
  const clampedScore = Math.max(
    baselineScore - 8,
    Math.min(baselineScore + 8, Math.round(analysis.score)),
  )

  // Save as a "resume" record with no actual file, so every other page
  // (Analysis, Recommendations, Roadmap, Dashboard) works identically to
  // how it does for an uploaded PDF — they just read the latest analysis.
  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      file_name: 'AIRA-built profile (no resume file)',
      storage_path: '',
      raw_text: profileText,
    })
    .select()
    .single()

  if (resumeError || !resume) {
    return NextResponse.json(
      { error: resumeError?.message || 'Failed to save profile.' },
      { status: 500 },
    )
  }

  // Detect skill gaps deterministically against the curated taxonomy for
  // their explicitly chosen target role (more reliable than an inference).
  const candidateSkillNames = [...(strongSkills ?? []), ...(learningSkills ?? [])]
  const { gaps, candidateEmbeddings } = await detectSkillGaps(
    candidateSkillNames,
    careerRole || 'Other',
  )

  const { data: savedAnalysis, error: analysisError } = await supabase
    .from('resume_analysis')
    .insert({
      resume_id: resume.id,
      user_id: user.id,
      score: Math.max(0, Math.min(100, clampedScore)),
      format_score: Math.max(0, Math.min(100, Math.round(analysis.format_score ?? 50))),
      content_score: Math.max(0, Math.min(100, Math.round(analysis.content_score ?? clampedScore))),
      impact_score: Math.max(0, Math.min(100, Math.round(analysis.impact_score ?? clampedScore))),
      summary: analysis.summary,
      strengths: analysis.strengths ?? [],
      improvements: analysis.improvements ?? [],
      extracted_skills: analysis.extracted_skills ?? [],
      extracted_skills_embeddings: candidateEmbeddings,
      inferred_career_role: careerRole || 'Other',
      projects: analysis.projects ?? [],
      certifications: analysis.certifications ?? [],
    })
    .select()
    .single()

  if (analysisError || !savedAnalysis) {
    return NextResponse.json(
      { error: analysisError?.message || 'Failed to save analysis.' },
      { status: 500 },
    )
  }

  const gapSuggestions = await generateGapSuggestions(gaps, careerRole || 'Other')
  await supabase.from('skill_gaps').delete().eq('user_id', user.id)
  if (gapSuggestions.length) {
    await supabase.from('skill_gaps').insert(
      gapSuggestions.map((g) => ({
        user_id: user.id,
        skill: g.skill,
        importance: g.importance,
        resource_suggestion: g.resource_suggestion,
      })),
    )
  }

  // Save their target career role to their profile for future reference
  if (careerRole) {
    await supabase.from('profiles').update({ track: careerRole }).eq('id', user.id)
  }

  return NextResponse.json({ resumeId: resume.id, analysisId: savedAnalysis.id })
}
