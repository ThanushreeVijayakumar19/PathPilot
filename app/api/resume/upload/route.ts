import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai/provider'
import { detectSkillGaps, generateGapSuggestions } from '@/lib/skill-gaps'
import { CAREER_SKILL_TAXONOMY } from '@/lib/career-skills'

interface AnalysisResult {
  score: number
  format_score: number
  content_score: number
  impact_score: number
  summary: string
  strengths: string[]
  improvements: string[]
  extracted_skills: string[]
  inferred_career_role: string
  projects: { name: string; description: string; tags: string[] }[]
  certifications: { name: string; issuer: string; year: string }[]
}

const KNOWN_ROLES = Object.keys(CAREER_SKILL_TAXONOMY).join('" | "')

const ANALYSIS_SYSTEM_PROMPT = `You are AIRA, an expert technical resume reviewer for students applying to internships.
Given the raw text of a resume, evaluate it and return a JSON object with EXACTLY this shape:
{
  "score": <integer 0-100, overall resume quality/ATS-friendliness score>,
  "format_score": <integer 0-100, how clean/ATS-friendly the formatting and structure is>,
  "content_score": <integer 0-100, how strong and relevant the written content is>,
  "impact_score": <integer 0-100, how well achievements are quantified with metrics/outcomes>,
  "summary": "<one or two sentence overall assessment>",
  "strengths": ["<short strength 1>", "<short strength 2>", "<short strength 3>"],
  "improvements": ["<short actionable improvement 1>", "<short actionable improvement 2>", "<short actionable improvement 3>"],
  "extracted_skills": ["<skill 1>", "<skill 2>", "... all technical skills, tools, and languages found in the resume"],
  "inferred_career_role": "<the SINGLE best-fit role from this exact list: "${KNOWN_ROLES}">,
  "projects": [{"name": "<project name found in resume>", "description": "<one sentence summary>", "tags": ["<tech 1>", "<tech 2>"]}],
  "certifications": [{"name": "<certification name found in resume>", "issuer": "<issuing org>", "year": "<year if mentioned, else empty string>"}]
}
Return 3-6 items for strengths/improvements, 5-15 for extracted_skills.
For projects and certifications, only include what is ACTUALLY found in the resume text — return an empty array if none are found. Do not invent them.`

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { fileName, storagePath, rawText } = body as {
    fileName?: string
    storagePath?: string
    rawText?: string
  }

  if (!fileName || !storagePath || !rawText || rawText.trim().length < 30) {
    return NextResponse.json(
      { error: 'Missing file info, or the resume text was too short to analyze.' },
      { status: 400 },
    )
  }

  // 1. Save the resume record
  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      file_name: fileName,
      storage_path: storagePath,
      raw_text: rawText.slice(0, 20000), // keep row size sane
    })
    .select()
    .single()

  if (resumeError || !resume) {
    return NextResponse.json(
      { error: resumeError?.message || 'Failed to save resume.' },
      { status: 500 },
    )
  }

  // 2. Run AI analysis via local Ollama
  let analysis: AnalysisResult
  try {
    analysis = await generateJSON<AnalysisResult>(
      `Resume text:\n"""\n${rawText.slice(0, 8000)}\n"""`,
      ANALYSIS_SYSTEM_PROMPT,
    )
  } catch (err) {
    return NextResponse.json(
      {
        error:
          (err as Error).message ||
          'Could not reach Ollama. Make sure "ollama serve" is running.',
      },
      { status: 502 },
    )
  }

  // 3. Compute embeddings for this resume's skills (cached for later
  //    semantic recommendation matching) and detect skill gaps
  //    deterministically against the curated taxonomy for their inferred role.
  const extractedSkills = analysis.extracted_skills ?? []
  const careerRole = analysis.inferred_career_role || 'Other'

  const { gaps, candidateEmbeddings } = await detectSkillGaps(extractedSkills, careerRole)

  // 4. Save the analysis
  const { data: savedAnalysis, error: analysisError } = await supabase
    .from('resume_analysis')
    .insert({
      resume_id: resume.id,
      user_id: user.id,
      score: Math.max(0, Math.min(100, Math.round(analysis.score))),
      format_score: Math.max(0, Math.min(100, Math.round(analysis.format_score ?? analysis.score))),
      content_score: Math.max(0, Math.min(100, Math.round(analysis.content_score ?? analysis.score))),
      impact_score: Math.max(0, Math.min(100, Math.round(analysis.impact_score ?? analysis.score))),
      summary: analysis.summary,
      strengths: analysis.strengths ?? [],
      improvements: analysis.improvements ?? [],
      extracted_skills: extractedSkills,
      extracted_skills_embeddings: candidateEmbeddings,
      inferred_career_role: careerRole,
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

  // 5. Generate targeted suggestions for the confirmed gaps and save them
  const gapSuggestions = await generateGapSuggestions(gaps, careerRole)
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

  return NextResponse.json({
    resumeId: resume.id,
    analysisId: savedAnalysis.id,
    analysis: savedAnalysis,
    storagePath,
  })
}
