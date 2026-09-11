import Link from 'next/link'
import {
  Award,
  Eye,
  FolderGit2,
  Lightbulb,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react'
import {
  Card,
  Chip,
  PageHeader,
  ProgressRing,
} from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

interface SkillGap {
  skill: string
  importance: string
  resource_suggestion: string
}

const importanceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

export const dynamic = 'force-dynamic'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: analysis } = await supabase
    .from('resume_analysis')
    .select('*, resumes(file_name, storage_path, uploaded_at)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: skillGapsRaw } = await supabase
    .from('skill_gaps')
    .select('*')
    .eq('user_id', user!.id)

  const skillGaps = (skillGapsRaw ?? []).slice().sort(
    (a, b) => (importanceOrder[a.importance] ?? 1) - (importanceOrder[b.importance] ?? 1),
  )

  let resumeUrl: string | null = null
  const resumeFile = analysis?.resumes as
    | { file_name: string; storage_path: string; uploaded_at: string }
    | null
    | undefined
  if (resumeFile?.storage_path) {
    const { data: signed } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resumeFile.storage_path, 60 * 60) // 1 hour
    resumeUrl = signed?.signedUrl ?? null
  }

  if (!analysis) {
    return (
      <div>
        <PageHeader
          eyebrow="Step 2"
          title="Resume Analysis"
          description="Upload a resume first and AIRA will break it down here."
        />
        <Card className="animate-fade-up flex flex-col items-center gap-4 p-12 text-center">
          <span className="brand-gradient flex size-16 items-center justify-center rounded-2xl text-primary-foreground">
            <Upload className="size-7" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">
              No resume analyzed yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your resume and AIRA will score it and extract your
              skills, projects, and certifications.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/resume">
              <Button
                size="lg"
                className="brand-gradient border-none text-primary-foreground"
              >
                <Upload className="size-4" />
                Upload your resume
              </Button>
            </Link>
            <Link href="/profile-builder">
              <Button size="lg" variant="outline">
                No resume? Build profile
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const projects = (analysis.projects ?? []) as {
    name: string
    description: string
    tags: string[]
  }[]
  const certifications = (analysis.certifications ?? []) as {
    name: string
    issuer: string
    year: string
  }[]
  const extractedSkills = (analysis.extracted_skills ?? []) as string[]
  const strengths = (analysis.strengths ?? []) as string[]
  const improvements = (analysis.improvements ?? []) as string[]
  const gaps = (skillGaps ?? []) as SkillGap[]

  return (
    <div>
      <PageHeader
        eyebrow="Step 2"
        title="Resume Analysis"
        description="AIRA broke down your resume into skills, projects and credentials, and scored it for internship readiness."
        action={
          <div className="flex flex-wrap gap-2">
            {resumeUrl && (
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">
                  <Eye className="size-4" />
                  View my resume
                </Button>
              </a>
            )}
            <Link href="/recommendations">
              <Button
                size="lg"
                className="brand-gradient border-none text-primary-foreground"
              >
                <Sparkles className="size-4" />
                See matched internships
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score */}
        <Card className="animate-fade-up flex flex-col items-center p-6 text-center">
          <ProgressRing
            value={analysis.score}
            size={148}
            label={`${analysis.score}`}
            sublabel="out of 100"
          />
          <h2 className="font-display mt-4 text-lg font-bold">Resume Score</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {analysis.summary}
          </p>
          <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
            {[
              { l: 'Format', v: analysis.format_score },
              { l: 'Content', v: analysis.content_score },
              { l: 'Impact', v: analysis.impact_score },
            ].map((m) => (
              <div key={m.l} className="rounded-xl bg-muted/60 p-3">
                <p className="font-display text-lg font-bold text-primary">
                  {m.v}
                </p>
                <p className="text-xs text-muted-foreground">{m.l}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Extracted skills */}
        <Card className="animate-fade-up p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="size-4" />
            </span>
            <h2 className="font-display text-lg font-bold">Extracted Skills</h2>
          </div>
          {extractedSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {extractedSkills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills detected in this resume.
            </p>
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
                    <p className="text-xs text-muted-foreground">
                      {c.issuer}
                    </p>
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
              No certifications found in this resume. Adding a couple of
              relevant ones can boost your score.
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
                <div
                  key={p.name}
                  className="rounded-xl border border-border p-4"
                >
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
              No distinct projects found — make sure your resume has a clear
              &quot;Projects&quot; section.
            </p>
          )}
        </Card>
      </div>

      {/* Skill gap analysis */}
      <Card className="animate-fade-up mt-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Target className="size-4" />
          </span>
          <h2 className="font-display text-lg font-bold">Skill Gap Analysis</h2>
        </div>
        {gaps.length ? (
          <div className="space-y-3">
            {gaps.map((g) => (
              <div
                key={g.skill}
                className="flex items-start gap-3 rounded-xl border border-border p-4"
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                    g.importance === 'high'
                      ? 'bg-accent/10 text-accent'
                      : g.importance === 'low'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/10 text-primary',
                  )}
                >
                  <Target className="size-4" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{g.skill}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
                        g.importance === 'high'
                          ? 'bg-accent/10 text-accent'
                          : g.importance === 'low'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary',
                      )}
                    >
                      {g.importance} priority
                    </span>
                  </div>
                  {g.resource_suggestion && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-relaxed text-muted-foreground">
                      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {g.resource_suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No major skill gaps detected — nice work!
          </p>
        )}
      </Card>

      {/* AI suggestions */}
      <Card
        glass
        className="animate-fade-up relative mt-6 overflow-hidden p-6"
      >
        <div className="brand-gradient absolute -right-8 -top-8 size-32 rounded-full opacity-10 blur-2xl" />
        <div className="mb-4 flex items-center gap-2">
          <span className="brand-gradient flex size-8 items-center justify-center rounded-lg text-primary-foreground">
            <Lightbulb className="size-4" />
          </span>
          <h2 className="font-display text-lg font-bold">
            AIRA&apos;s Suggestions
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...strengths.map((s) => `Strength: ${s}`), ...improvements].map(
            (s, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-border bg-card/60 p-4"
              >
                <span className="brand-gradient flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{s}</p>
              </div>
            ),
          )}
        </div>
      </Card>
    </div>
  )
}
