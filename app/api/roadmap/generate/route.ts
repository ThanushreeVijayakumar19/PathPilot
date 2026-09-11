import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai/provider'

interface RoadmapPhase {
  phase: string
  phase_title: string
  duration_estimate: string
  items: {
    title: string
    type: 'skill' | 'course' | 'project' | 'cert'
  }[]
}

interface RoadmapResult {
  phases: RoadmapPhase[]
}

const ROADMAP_SYSTEM_PROMPT = `You are AIRA, an AI career copilot building a personalized internship-readiness roadmap for a student.
Given their profile score, current skills, and skill gaps, return a JSON object with EXACTLY this shape:
{
  "phases": [
    {
      "phase": "Phase 1",
      "phase_title": "<short phase name, e.g. 'Programming Fundamentals' or 'Strengthen Core Skills'>",
      "duration_estimate": "<realistic time to complete this phase, e.g. '2-3 weeks'>",
      "items": [
        {"title": "<specific actionable item, e.g. 'Learn Docker basics'>", "type": "skill" | "course" | "project" | "cert"}
      ]
    }
  ]
}

CRITICAL — scale the starting point to their ACTUAL level, given by their score below:
- Score under 35 (true beginner, few/no confident skills): Phase 1 MUST start from genuine fundamentals
  for their target field (e.g. programming basics, not frameworks) — do NOT assume they already know
  syntax, tools, or concepts they didn't list as a confident skill.
- Score 35-65 (has some real foundation): Phase 1 can build on their stated skills but should still
  reinforce weak spots before introducing advanced topics.
- Score over 65 (solid foundation): Phase 1 can focus on polish, portfolio depth, and closing specific gaps.

Create exactly 3 phases, progressing from their real starting point to internship-ready. Each phase
should have 3-5 items and a realistic duration_estimate. Base the plan on their ACTUAL skill gaps and
current skills — never assume a skill they didn't list, even if it's "obviously related."
"type" must be one of: "skill" (a skill/technology to learn), "course" (a specific course/tutorial to take),
"project" (a project to build for their portfolio), or "cert" (a certification to earn).`

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const [{ data: analysis }, { data: skillGaps }] = await Promise.all([
    supabase
      .from('resume_analysis')
      .select('score, extracted_skills, summary, resumes(storage_path)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('skill_gaps').select('skill, importance').eq('user_id', user.id),
  ])

  if (!analysis) {
    return NextResponse.json(
      { error: 'Upload a resume or build your profile first so AIRA knows where to start.' },
      { status: 400 },
    )
  }

  const resumeFile = analysis.resumes as unknown as { storage_path: string }[] | { storage_path: string } | null
  const storagePath = Array.isArray(resumeFile) ? resumeFile[0]?.storage_path : resumeFile?.storage_path
  const isFromResume = !!storagePath

  const prompt = `Profile score: ${analysis.score}/100 (this reflects their REAL current level — treat it as accurate)
Source: ${isFromResume ? 'Built from an uploaded resume' : 'Self-reported profile (no resume yet) — be extra careful not to assume unlisted skills'}
Summary: ${analysis.summary}
Current skills: ${(analysis.extracted_skills ?? []).join(', ') || 'none listed'}
Skill gaps to close: ${(skillGaps ?? []).map((g) => `${g.skill} (${g.importance} priority)`).join(', ') || 'none listed'}`

  let result: RoadmapResult
  try {
    result = await generateJSON<RoadmapResult>(prompt, ROADMAP_SYSTEM_PROMPT)
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

  if (!result.phases?.length) {
    return NextResponse.json(
      { error: 'AIRA could not generate a roadmap. Try again.' },
      { status: 502 },
    )
  }

  // Replace any previous roadmap with the fresh one
  await supabase.from('roadmap_items').delete().eq('user_id', user.id)

  const rows = result.phases.flatMap((phase, phaseIdx) =>
    phase.items.map((item, itemIdx) => ({
      user_id: user.id,
      phase: phase.phase,
      phase_title: phase.duration_estimate
        ? `${phase.phase_title} · ${phase.duration_estimate}`
        : phase.phase_title,
      title: item.title,
      item_type: item.type,
      order_index: phaseIdx * 100 + itemIdx,
      completed: false,
    })),
  )

  const { error: insertError } = await supabase.from('roadmap_items').insert(rows)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, isFromResume })
}
