import { PageHeader } from '@/components/ui-kit'
import { createClient } from '@/lib/supabase/server'
import { RoadmapView, type RoadmapPhaseGroup } from '@/components/roadmap-view'

export const dynamic = 'force-dynamic'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: analysis }, { data: roadmapItems }] = await Promise.all([
    supabase
      .from('resume_analysis')
      .select('id, created_at, score, resumes(storage_path)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('roadmap_items')
      .select('*')
      .eq('user_id', user!.id)
      .order('order_index', { ascending: true }),
  ])

  const hasResume = !!analysis
  const resumeFile = analysis?.resumes as { storage_path: string } | null | undefined
  const isFromResume = !!resumeFile?.storage_path
  const roadmapCreatedAt = roadmapItems?.[0]?.created_at
  const isOutdated =
    hasResume &&
    !!roadmapCreatedAt &&
    new Date(analysis.created_at) > new Date(roadmapCreatedAt)

  const grouped: RoadmapPhaseGroup[] = []
  for (const item of roadmapItems ?? []) {
    let group = grouped.find((g) => g.phase === item.phase)
    if (!group) {
      group = {
        phase: item.phase,
        phase_title: item.phase_title || item.phase,
        items: [],
      }
      grouped.push(group)
    }
    group.items.push({
      id: item.id,
      title: item.title,
      item_type: item.item_type ?? 'skill',
      completed: item.completed,
    })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Step 4"
        title="Career Roadmap"
        description={
          hasResume
            ? `A personalized, phase-by-phase plan AIRA built from ${
                isFromResume ? 'your uploaded resume' : 'your self-reported profile'
              } (starting score: ${analysis.score}/100) — check items off as you complete them.`
            : 'A personalized, phase-by-phase plan AIRA built from your actual skill gaps — check items off as you complete them.'
        }
      />
      <RoadmapView
        phases={grouped}
        hasResume={hasResume}
        isOutdated={isOutdated}
        isFromResume={isFromResume}
      />
    </div>
  )
}
