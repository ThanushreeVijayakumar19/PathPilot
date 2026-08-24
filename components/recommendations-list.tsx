'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowUpRight,
  Bookmark,
  Check,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { Card, Chip, MatchBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { AiraMascot } from '@/components/mascot'
import { cn } from '@/lib/utils'

export interface MatchedInternship {
  id: string
  company: string
  role: string
  location: string
  mode: 'Remote' | 'Hybrid' | 'On-site'
  opportunityType: 'internship' | 'externship'
  duration: string
  stipend: string
  posted: string
  skills: string[]
  matchedSkills: string[]
  missingSkills: string[]
  match: number
  logoColor: string
}

const modeFilters = ['All', 'Remote', 'Hybrid', 'On-site'] as const
const typeFilters = ['All', 'Internship', 'Externship'] as const

export function RecommendationsList({
  items,
  hasResume,
  isOutdated = false,
}: {
  items: MatchedInternship[]
  hasResume: boolean
  isOutdated?: boolean
}) {
  const router = useRouter()
  const [modeFilter, setModeFilter] = useState<(typeof modeFilters)[number]>('All')
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>('All')
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/recommendations/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate recommendations.')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const list = items.filter((r) => {
    const modeOk = modeFilter === 'All' || r.mode === modeFilter
    const typeOk =
      typeFilter === 'All' || r.opportunityType === typeFilter.toLowerCase()
    return modeOk && typeOk
  })

  if (!hasResume) {
    return (
      <Card
        glass
        className="animate-fade-up flex flex-col items-center gap-3 p-8 text-center"
      >
        <span className="brand-gradient flex size-14 items-center justify-center rounded-2xl text-primary-foreground">
          <Sparkles className="size-6" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold">
            No skills on file yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            AIRA needs to know your actual skills before it can generate
            internships and externships that genuinely fit you.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/resume">
            <Button className="brand-gradient border-none text-primary-foreground">
              Upload resume
            </Button>
          </Link>
          <Link href="/profile-builder">
            <Button variant="outline">No resume? Build profile</Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (!items.length) {
    return (
      <Card className="animate-fade-up flex flex-col items-center gap-4 p-12 text-center">
        <AiraMascot className="size-16" animated />
        <div>
          <h3 className="font-display text-lg font-bold">
            No recommendations generated yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            AIRA can generate internships and externships tailored to your
            actual resume skills — not a generic list.
          </p>
        </div>
        {error && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </p>
        )}
        <Button
          size="lg"
          disabled={generating}
          onClick={generate}
          className="brand-gradient border-none text-primary-foreground disabled:opacity-40"
        >
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating your matches...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate my recommendations
            </>
          )}
        </Button>
      </Card>
    )
  }

  return (
    <div>
      {isOutdated && (
        <Card className="animate-fade-up mb-6 flex flex-col items-center gap-3 border-accent/30 bg-accent/[0.05] p-4 text-center sm:flex-row sm:text-left">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <AlertCircle className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              These are based on an older resume
            </p>
            <p className="text-sm text-muted-foreground">
              You&apos;ve uploaded a newer resume since these were generated —
              regenerate for up-to-date matches.
            </p>
          </div>
          <Button
            size="sm"
            disabled={generating}
            onClick={generate}
            className="brand-gradient border-none text-primary-foreground"
          >
            {generating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Regenerate now
          </Button>
        </Card>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {typeFilters.map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
              typeFilter === f
                ? 'brand-gradient border-transparent text-primary-foreground shadow-md shadow-primary/20'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {f}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={generating}
          onClick={generate}
          className="ml-auto"
        >
          {generating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Regenerate
        </Button>
      </div>
      {error && (
        <p className="mb-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </p>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {modeFilters.map((f) => (
          <button
            key={f}
            onClick={() => setModeFilter(f)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
              modeFilter === f
                ? 'border-primary/40 bg-primary/[0.08] text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {list.length} matches found
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((r, i) => (
          <Card
            key={r.id}
            className="animate-fade-up group flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-12 items-center justify-center rounded-xl text-base font-bold text-white shadow-sm"
                  style={{ backgroundColor: r.logoColor }}
                >
                  {r.company.slice(0, 2)}
                </span>
                <div>
                  <p className="font-semibold leading-tight">{r.company}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        r.opportunityType === 'externship'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-primary/10 text-primary',
                      )}
                    >
                      {r.opportunityType}
                    </span>
                    <p className="text-xs text-muted-foreground">{r.posted}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  setSaved((s) => ({ ...s, [r.id]: !s[r.id] }))
                }
                aria-label="Save internship"
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg border border-border transition-colors',
                  saved[r.id]
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Bookmark
                  className={cn('size-4', saved[r.id] && 'fill-current')}
                />
              </button>
            </div>

            <h3 className="font-display mt-4 text-lg font-bold leading-snug">
              {r.role}
            </h3>

            <div className="mt-2">
              <MatchBadge match={r.match} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {r.location}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4 text-primary" />
                {r.duration}
              </span>
              <span className="col-span-2 flex items-center gap-1.5 font-semibold text-foreground">
                <Wallet className="size-4 text-primary" />
                {r.stipend}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {r.matchedSkills.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="size-3" />
                    You have ({r.matchedSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {r.missingSkills.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <X className="size-3" />
                    Still need ({r.missingSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.missingSkills.map((s) => (
                      <Chip key={s}>{s}</Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2 border-t border-border pt-4">
              <Button className="brand-gradient flex-1 border-none text-primary-foreground">
                Apply now
                <ArrowUpRight className="size-4" />
              </Button>
              <Button variant="outline">Details</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card
        glass
        className="animate-fade-up mt-6 flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left"
      >
        <span className="brand-gradient flex size-12 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
          <Sparkles className="size-6" />
        </span>
        <div className="flex-1">
          <h3 className="font-display font-bold">
            Want more precise matches?
          </h3>
          <p className="text-sm text-muted-foreground">
            Close your top skill gaps and your match scores will climb.
          </p>
        </div>
        <Link href="/analysis">
          <Button className="brand-gradient border-none text-primary-foreground">
            View skill gaps
          </Button>
        </Link>
      </Card>
    </div>
  )
}
