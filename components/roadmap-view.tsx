'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  FolderGit2,
  Loader2,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AiraMascot } from '@/components/mascot'
import { createClient } from '@/lib/supabase/client'

const typeMeta = {
  skill: { icon: Zap, label: 'Skill' },
  course: { icon: BookOpen, label: 'Course' },
  project: { icon: FolderGit2, label: 'Project' },
  cert: { icon: Award, label: 'Certification' },
} as const

export interface RoadmapItem {
  id: string
  title: string
  item_type: keyof typeof typeMeta
  completed: boolean
}

export interface RoadmapPhaseGroup {
  phase: string
  phase_title: string
  items: RoadmapItem[]
}

export function RoadmapView({
  phases,
  hasResume,
  isOutdated = false,
  isFromResume = false,
}: {
  phases: RoadmapPhaseGroup[]
  hasResume: boolean
  isOutdated?: boolean
  isFromResume?: boolean
}) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState(phases)

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/roadmap/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap.')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  async function toggleItem(phaseIdx: number, itemId: string) {
    const supabase = createClient()
    const current = items[phaseIdx].items.find((i) => i.id === itemId)
    if (!current) return
    const newCompleted = !current.completed

    setItems((prev) => {
      const next = [...prev]
      next[phaseIdx] = {
        ...next[phaseIdx],
        items: next[phaseIdx].items.map((i) =>
          i.id === itemId ? { ...i, completed: newCompleted } : i,
        ),
      }
      return next
    })

    await supabase
      .from('roadmap_items')
      .update({ completed: newCompleted })
      .eq('id', itemId)
  }

  const totalItems = items.reduce((a, s) => a + s.items.length, 0)
  const doneItems = items.reduce(
    (a, s) => a + s.items.filter((i) => i.completed).length,
    0,
  )
  const progress = totalItems ? Math.round((doneItems / totalItems) * 100) : 0

  if (!items.length) {
    return (
      <Card className="animate-fade-up flex flex-col items-center gap-4 p-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl">
          <AiraMascot className="size-16" animated />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">
            {hasResume ? 'No roadmap yet' : 'Upload a resume first'}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {hasResume
              ? 'AIRA can build you a personalized, phase-by-phase plan based on your actual skill gaps.'
              : 'AIRA needs to know your skills and gaps before it can build a roadmap — analyze your resume first.'}
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
          disabled={!hasResume || generating}
          onClick={generate}
          className="brand-gradient border-none text-primary-foreground disabled:opacity-40"
        >
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Building your roadmap...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate my roadmap
            </>
          )}
        </Button>
        {!hasResume && (
          <Link href="/profile-builder" className="text-sm font-medium text-primary hover:underline">
            No resume? Build your profile with AIRA instead →
          </Link>
        )}
      </Card>
    )
  }

  let activeAssigned = false
  const phaseStatuses = items.map((p) => {
    const allDone = p.items.every((i) => i.completed)
    if (allDone) return 'done' as const
    if (!activeAssigned) {
      activeAssigned = true
      return 'active' as const
    }
    return 'upcoming' as const
  })

  return (
    <div>
      {isOutdated && (
        <Card className="animate-fade-up mb-6 flex flex-col items-center gap-3 border-accent/30 bg-accent/[0.05] p-4 text-center sm:flex-row sm:text-left">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <AlertCircle className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              This roadmap is based on an older resume
            </p>
            <p className="text-sm text-muted-foreground">
              You&apos;ve uploaded a newer resume since this was generated —
              regenerate to get an up-to-date plan.
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

      <Card className="animate-fade-up mb-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold">Overall Progress</h2>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  isFromResume
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/10 text-accent',
                )}
              >
                {isFromResume ? 'From resume' : 'From self-reported profile'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {doneItems} of {totalItems} milestones complete
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-3 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="brand-gradient h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-display text-2xl font-bold text-primary">
              {progress}%
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={generating}
              onClick={generate}
            >
              {generating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Regenerate
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </p>
        )}
      </Card>

      <div className="relative">
        <div className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-border sm:left-[27px]" />
        <div className="space-y-6">
          {items.map((stage, i) => {
            const status = phaseStatuses[i]
            const active = status === 'active'
            const done = status === 'done'
            return (
              <div
                key={stage.phase}
                className="animate-fade-up relative flex gap-4 sm:gap-6"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative z-10 shrink-0">
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full border-4 border-background sm:size-14',
                      done
                        ? 'brand-gradient text-primary-foreground'
                        : active
                          ? 'brand-gradient text-primary-foreground ring-4 ring-primary/20'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="size-5 sm:size-6" />
                    ) : (
                      <Target className="size-5 sm:size-6" />
                    )}
                  </span>
                </div>

                <Card
                  className={cn(
                    'flex-1 p-5',
                    active && 'border-primary/30 ring-1 ring-primary/15',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="brand-gradient-text text-xs font-bold uppercase tracking-widest">
                      {stage.phase}
                    </span>
                    {active && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        In progress
                      </span>
                    )}
                    {done && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="font-display mt-1 text-lg font-bold">
                    {stage.phase_title}
                  </h3>

                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {stage.items.map((item) => {
                      const meta = typeMeta[item.item_type] ?? typeMeta.skill
                      const Icon = meta.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(i, item.id)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                            item.completed
                              ? 'border-primary/20 bg-primary/[0.04]'
                              : 'border-border hover:bg-muted/40',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-lg',
                              item.completed
                                ? 'brand-gradient text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {item.completed ? (
                              <Check className="size-4" />
                            ) : (
                              <Icon className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'truncate text-sm font-medium',
                                item.completed &&
                                  'text-muted-foreground line-through',
                              )}
                            >
                              {item.title}
                            </p>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {meta.label}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
