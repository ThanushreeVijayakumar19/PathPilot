import Link from 'next/link'
import {
  Award,
  Edit3,
  FileText,
  FolderGit2,
  Mail,
  Route,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react'
import { Card, Chip, PageHeader, ProgressRing } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: analysis }, { data: roadmapItems }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, track, updated_at')
        .eq('id', user!.id)
        .maybeSingle(),
      supabase
        .from('resume_analysis')
        .select(
          'score, summary, extracted_skills, inferred_career_role, projects, certifications, created_at, resumes(file_name, storage_path)',
        )
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('roadmap_items')
        .select('completed')
        .eq('user_id', user!.id),
    ])

  const name =
    profile?.full_name ||
    (user!.user_metadata?.full_name as string | undefined) ||
    user!.email?.split('@')[0] ||
    'Student'
  const initials = name
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const hasAnalysis = !!analysis
  const track = analysis?.inferred_career_role || profile?.track || 'Not set yet'
  const resumeScore = analysis?.score ?? null
  const skills = (analysis?.extracted_skills as string[] | undefined) ?? []
  const projects =
    (analysis?.projects as { name: string; description: string; tags: string[] }[] | undefined) ?? []
  const certifications =
    (analysis?.certifications as { name: string; issuer: string; year: string }[] | undefined) ?? []

  const resumeFile = analysis?.resumes as
    | { file_name: string; storage_path: string }[]
    | { file_name: string; storage_path: string }
    | null
    | undefined
  const resumeInfo = Array.isArray(resumeFile) ? resumeFile[0] : resumeFile
  const hasRealResumeFile = !!resumeInfo?.storage_path

  const completedCount = (roadmapItems ?? []).filter((r) => r.completed).length
  const totalRoadmapItems = (roadmapItems ?? []).length

  return (
    <div>
      <PageHeader
        eyebrow="Your account"
        title="My Profile"
        description="Everything AIRA knows about you — your details, career track, skills, and progress so far."
        action={
          <Link href="/profile-builder">
            <Button size="lg" variant="outline">
              <Edit3 className="size-4" />
              Edit details
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="animate-fade-up p-6 lg:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="brand-gradient flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
              {initials}
            </span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">{name}</h2>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5" />
                {user!.email}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="size-3.5" />
                  Targeting: {track}
                </span>
              </div>
            </div>
          </div>

          {hasAnalysis && analysis?.summary && (
            <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>
          )}

          {!hasAnalysis && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border p-4">
              <p className="flex-1 text-sm text-muted-foreground">
                You haven&apos;t uploaded a resume or built a profile yet —
                do that so AIRA can fill in your details here.
              </p>
              <Link href="/resume">
                <Button size="sm" className="brand-gradient border-none text-primary-foreground">
                  <Upload className="size-4" />
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Resume score */}
        <Card className="animate-fade-up flex flex-col items-center p-6 text-center">
          <h2 className="font-display self-start text-lg font-bold">
            Resume Score
          </h2>
          <div className="my-4">
            <ProgressRing
              value={resumeScore ?? 0}
              label={resumeScore !== null ? `${resumeScore}` : '—'}
              sublabel="out of 100"
            />
          </div>
          <Link href={hasAnalysis ? '/analysis' : '/resume'} className="w-full">
            <Button className="brand-gradient w-full border-none text-primary-foreground">
              {hasAnalysis ? 'See full analysis' : 'Upload resume'}
            </Button>
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Skills */}
        <Card className="animate-fade-up p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold">Skills</h2>
          </div>
          {skills.length ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills on file yet — upload a resume or build your profile
              to add some.
            </p>
          )}
        </Card>

        {/* Progress */}
        <Card className="animate-fade-up p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Route className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold">Roadmap Progress</h2>
          </div>
          {totalRoadmapItems ? (
            <>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalRoadmapItems} steps completed
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="brand-gradient h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round((completedCount / totalRoadmapItems) * 100)}%`,
                  }}
                />
              </div>
              <Link href="/roadmap" className="mt-4 block">
                <Button size="sm" variant="outline" className="w-full">
                  View roadmap
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                No roadmap generated yet.
              </p>
              <Link href="/roadmap" className="mt-4 block">
                <Button size="sm" variant="outline" className="w-full">
                  Generate roadmap
                </Button>
              </Link>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Certifications */}
        <Card className="animate-fade-up p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Award className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold">Certifications</h2>
          </div>
          {certifications.length ? (
            <div className="space-y-3">
              {certifications.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="brand-gradient flex size-10 shrink-0 items-center justify-center rounded-lg text-primary-foreground">
                    <Award className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.issuer}</p>
                  </div>
                  {c.year && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {c.year}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No certifications on file yet.
            </p>
          )}
        </Card>

        {/* Projects */}
        <Card className="animate-fade-up p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderGit2 className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold">Projects</h2>
          </div>
          {projects.length ? (
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p.name} className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(p.tags ?? []).map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No projects on file yet.
            </p>
          )}
        </Card>
      </div>

      {hasRealResumeFile && (
        <Card className="animate-fade-up mt-6 flex items-center gap-3 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{resumeInfo?.file_name}</p>
            <p className="text-xs text-muted-foreground">
              Your latest uploaded resume
            </p>
          </div>
          <Link href="/analysis">
            <Button size="sm" variant="outline">
              View analysis
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
