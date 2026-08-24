import { PageHeader } from '@/components/ui-kit'
import { createClient } from '@/lib/supabase/server'
import { computeMatchDetailsSemantic, timeAgo } from '@/lib/match'
import {
  RecommendationsList,
  type MatchedInternship,
} from '@/components/recommendations-list'

const palette = [
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#0ea5e9',
]

function colorFor(seed: string) {
  const hash = seed
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

export const dynamic = 'force-dynamic'

export default async function RecommendationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: analysis } = await supabase
    .from('resume_analysis')
    .select('extracted_skills, extracted_skills_embeddings, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: internships } = await supabase
    .from('internships')
    .select('*')
    .eq('user_id', user!.id)
    .order('posted_at', { ascending: false })

  const userSkills = (analysis?.extracted_skills ?? []) as string[]
  const userEmbeddings = (analysis?.extracted_skills_embeddings ?? []) as number[][]
  const hasResume = !!analysis

  const items: MatchedInternship[] = (internships ?? []).map((i) => {
    const requiredSkills = (i.required_skills ?? []) as string[]
    const requiredEmbeddings = (i.required_skills_embeddings ?? []) as number[][]
    const details = hasResume
      ? computeMatchDetailsSemantic(userSkills, userEmbeddings, requiredSkills, requiredEmbeddings)
      : { score: 0, matched: [], missing: requiredSkills }
    const mode: MatchedInternship['mode'] =
      i.location.toLowerCase() === 'remote' ? 'Remote' : 'On-site'

    return {
      id: i.id,
      company: i.company,
      role: i.title,
      location: i.location,
      mode,
      opportunityType:
        (i.opportunity_type as 'internship' | 'externship') ?? 'internship',
      duration: i.duration ?? '',
      stipend: i.stipend ?? '',
      posted: timeAgo(i.posted_at),
      skills: requiredSkills,
      matchedSkills: details.matched,
      missingSkills: details.missing,
      match: details.score,
      logoColor: colorFor(i.company),
    }
  })

  items.sort((a, b) => b.match - a.match)

  const isOutdated =
    hasResume &&
    !!internships?.length &&
    new Date(analysis.created_at) > new Date(internships[0].posted_at)

  return (
    <div>
      <PageHeader
        eyebrow="Step 3"
        title="Internship & Externship Recommendations"
        description={
          hasResume
            ? "AIRA generated roles tailored to your actual resume — ranked by real match score, showing exactly what you have and what you're missing."
            : 'Upload and analyze your resume first so AIRA can generate roles that actually fit your skills.'
        }
      />
      <RecommendationsList
        items={items}
        hasResume={hasResume}
        isOutdated={isOutdated}
      />
    </div>
  )
}
