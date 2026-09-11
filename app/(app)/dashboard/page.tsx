import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Briefcase,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { Card, MatchBadge, ProgressRing } from '@/components/ui-kit'
import { student } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { AiraMascot } from '@/components/mascot'
import { createClient } from '@/lib/supabase/server'
import { computeMatchScore } from '@/lib/match'

const palette = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981', '#0ea5e9']
function colorFor(seed: string) {
  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

const quickActions = [
  {
    href: '/resume',
    label: 'Upload Resume',
    desc: 'Get an instant AI score',
    icon: Upload,
  },
  {
    href: '/recommendations',
    label: 'Find Internships',
    desc: 'See your top matches',
    icon: Briefcase,
  },
  {
    href: '/roadmap',
    label: 'View Roadmap',
    desc: 'Plan your next steps',
    icon: Target,
  },
  {
    href: '/assistant',
    label: 'Ask AIRA',
    desc: 'Chat with your copilot',
    icon: Sparkles,
  },
]

// Always fetch fresh data — this page shows live resume/recommendation data
// that changes whenever the user uploads a new resume.
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, track')
    .eq('id', user!.id)
    .maybeSingle()

  const { data: analysis } = await supabase
    .from('resume_analysis')
    .select('score, extracted_skills')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: internships } = await supabase
    .from('internships')
    .select('*')
    .order('posted_at', { ascending: false })

  const name =
    profile?.full_name ||
    (user!.user_metadata?.full_name as string | undefined) ||
    user!.email?.split('@')[0] ||
    'Student'
  const firstName = name.split(' ')[0]
  const initials = name
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const track = profile?.track || 'Software Engineering'

  const hasResume = !!analysis
  const resumeScore = analysis?.score ?? null
  const userSkills = (analysis?.extracted_skills as string[] | undefined) ?? []
  const skillCount = userSkills.length

  const topMatches = (internships ?? [])
    .map((i) => ({
      id: i.id as string,
      role: i.title as string,
      company: i.company as string,
      location: i.location as string,
      stipend: i.stipend as string,
      logoColor: colorFor(i.company as string),
      match: hasResume
        ? computeMatchScore(userSkills, (i.required_skills ?? []) as string[])
        : 0,
    }))
    .sort((a, b) => b.match - a.match)
    .slice(0, 3)

  const stats = [
    {
      label: 'Resume Score',
      value: resumeScore !== null ? `${resumeScore}` : '—',
      sub: '/100',
      icon: FileText,
      trend: resumeScore !== null ? '+6' : null,
    },
    {
      label: 'Skills Detected',
      value: hasResume ? `${skillCount}` : '—',
      sub: 'found',
      icon: TrendingUp,
      trend: hasResume ? '+4' : null,
    },
    {
      label: 'Applications',
      value: `${student.applications}`,
      sub: 'active',
      icon: Briefcase,
      trend: '+3',
    },
    {
      label: 'Certifications',
      value: '3',
      sub: 'earned',
      icon: Award,
      trend: '+1',
    },
  ]

  return (
    <div className="space-y-6">
      {/* AIRA welcome hero */}
      <Card className="animate-fade-up brand-gradient relative overflow-hidden border-none text-primary-foreground">
        <div className="absolute -right-10 -top-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 right-24 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-xl gap-4">
            <div className="hidden shrink-0 items-center justify-center rounded-2xl bg-white/15 p-2 backdrop-blur sm:flex">
              <AiraMascot className="h-16 w-16" animated />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Sparkles className="size-3.5" />
                AIRA · Your AI Career Copilot
              </span>
              <h1 className="font-display mt-4 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                Welcome back, {firstName} 👋
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/85 text-pretty">
                {hasResume ? (
                  <>
                    Your latest resume score is <strong>{resumeScore}</strong>{' '}
                    with {skillCount} skills detected. Head to
                    Recommendations to see internships matched to your
                    profile.
                  </>
                ) : (
                  <>
                    You haven&apos;t analyzed a resume yet — upload one and
                    I&apos;ll score it and find matching internships for you.
                  </>
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={hasResume ? '/recommendations' : '/resume'}>
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90"
                  >
                    {hasResume ? 'View matches' : 'Upload resume'}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                {!hasResume && (
                  <Link href="/profile-builder">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                    >
                      No resume? Build profile
                    </Button>
                  </Link>
                )}
                <Link href="/assistant">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                  >
                    Chat with AIRA
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 rounded-2xl bg-white/10 p-6 backdrop-blur">
            <ProgressRing
              value={resumeScore ?? 0}
              size={120}
              label={resumeScore !== null ? `${resumeScore}%` : '—'}
              sublabel="resume score"
            />
            <div className="hidden sm:block">
              <p className="text-3xl font-bold">{track}</p>
              <p className="text-sm text-primary-foreground/80">
                your current track
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <Card
              key={s.label}
              className="animate-fade-up p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                {s.trend && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                    <ArrowUpRight className="size-3" />
                    {s.trend}
                  </span>
                )}
              </div>
              <p className="mt-4 font-display text-2xl font-bold">
                {s.value}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {s.sub}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: profile + recommendations */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile summary */}
          <Card className="animate-fade-up p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="brand-gradient flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                {initials}
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold">{name}</h2>
                <p className="text-sm text-muted-foreground">{user!.email}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="size-3.5" />
                    {track}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-muted-foreground">Resume score</p>
                <p className="font-display text-2xl font-bold text-primary">
                  {resumeScore !== null ? `${resumeScore}%` : '—'}
                </p>
              </div>
            </div>
          </Card>

          {/* Recent recommendations */}
          <Card className="animate-fade-up overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="font-display text-lg font-bold">
                  Recent Recommendations
                </h2>
                <p className="text-sm text-muted-foreground">
                  Fresh matches curated by AIRA
                </p>
              </div>
              <Link
                href="/recommendations"
                className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View all
                <ArrowRight className="size-4" />
              </Link>
            </div>
            {topMatches.length ? (
              <div className="divide-y divide-border">
                {topMatches.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                  >
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: r.logoColor }}
                    >
                      {r.company.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.role}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {r.company} · {r.location} · {r.stipend}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      {hasResume ? (
                        <MatchBadge match={r.match} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Upload resume
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">
                No internships available yet.
              </p>
            )}
          </Card>
        </div>

        {/* Right: resume score + quick actions */}
        <div className="space-y-6">
          <Card className="animate-fade-up flex flex-col items-center p-6 text-center">
            <h2 className="font-display self-start text-lg font-bold">
              Resume Score
            </h2>
            <p className="self-start text-sm text-muted-foreground">
              AIRA analysis summary
            </p>
            <div className="my-4">
              <ProgressRing
                value={resumeScore ?? 0}
                label={resumeScore !== null ? `${resumeScore}` : '—'}
                sublabel="out of 100"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {hasResume
                ? 'A few tweaks could push your score even higher.'
                : 'Upload a resume to see your score here.'}
            </p>
            <Link
              href={hasResume ? '/analysis' : '/resume'}
              className="mt-4 w-full"
            >
              <Button className="brand-gradient w-full border-none text-primary-foreground">
                {hasResume ? 'See full analysis' : 'Upload resume'}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </Card>

          <Card className="animate-fade-up p-5">
            <h2 className="font-display mb-3 text-lg font-bold">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {quickActions.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-primary/[0.04]"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
