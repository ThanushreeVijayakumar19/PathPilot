'use client'

import { useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react'
import { Card, PageHeader } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { AiraMascot } from '@/components/mascot'

const careerRoles = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist / ML Engineer',
  'Mobile App Developer',
  'UI/UX Designer',
  'DevOps / Cloud Engineer',
  'Cybersecurity',
  'Product Management',
  'Other',
]

const suggestedSkills = [
  'Python',
  'JavaScript',
  'React',
  'SQL',
  'Java',
  'C++',
  'Excel',
  'Communication',
  'Figma',
  'Machine Learning',
]

function SkillInput({
  label,
  hint,
  skills,
  onChange,
  placeholder,
}: {
  label: string
  hint: string
  skills: string[]
  onChange: (skills: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  function add(raw: string) {
    const s = raw.trim()
    if (!s) return
    if (skills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      setInput('')
      return
    }
    onChange([...skills, s])
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && skills.length) {
      onChange(skills.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary/50 focus-within:ring-3 focus-within:ring-primary/15">
        {skills.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            {s}
            <button
              type="button"
              onClick={() => onChange(skills.filter((x) => x !== s))}
              aria-label={`Remove ${s}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(input)}
          placeholder={skills.length ? 'Add another...' : placeholder}
          className="min-w-[140px] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  )
}

export default function ProfileBuilderPage() {
  const router = useRouter()
  const [careerRole, setCareerRole] = useState(careerRoles[0])
  const [education, setEducation] = useState('')
  const [year, setYear] = useState('')
  const [cgpa, setCgpa] = useState('')
  const [strongSkills, setStrongSkills] = useState<string[]>([])
  const [learningSkills, setLearningSkills] = useState<string[]>([])
  const [projects, setProjects] = useState('')
  const [certifications, setCertifications] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allSuggested = suggestedSkills.filter(
    (s) => !strongSkills.includes(s) && !learningSkills.includes(s),
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (strongSkills.length === 0 && learningSkills.length === 0) {
      setError('Add at least a few skills — even ones you\'re just starting to learn.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerRole,
          education,
          year,
          cgpa,
          strongSkills,
          learningSkills,
          projects,
          certifications,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')

      router.refresh()
      router.push('/analysis')
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="No resume yet? No problem"
        title="Build your profile with AIRA"
        description="Answer honestly, including what you're still learning — AIRA scores you fairly based on real proficiency, not just a list of buzzwords."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up p-6 lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                Career role you&apos;re targeting <span className="text-destructive">*</span>
              </label>
              <select
                value={careerRole}
                onChange={(e) => setCareerRole(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
              >
                {careerRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold">
                  Education / course
                </label>
                <input
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. B.Tech CSE"
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">
                  Year / level
                </label>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2nd year"
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">
                  CGPA / % (optional)
                </label>
                <input
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.2 or 82%"
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
                />
              </div>
            </div>

            <SkillInput
              label="Skills you're actually confident in"
              hint="Things you could use unsupervised on a real task, not just heard of."
              skills={strongSkills}
              onChange={setStrongSkills}
              placeholder="Type a skill and press Enter"
            />

            <SkillInput
              label="Skills you're just starting to learn"
              hint="Be honest — this doesn't hurt your score, it makes your roadmap accurate."
              skills={learningSkills}
              onChange={setLearningSkills}
              placeholder="Type a skill and press Enter"
            />

            {allSuggested.length > 0 && (
              <div className="-mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground">Quick add:</span>
                {allSuggested.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLearningSkills((prev) => [...prev, s])}
                    className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                Any projects? (optional)
              </label>
              <textarea
                value={projects}
                onChange={(e) => setProjects(e.target.value)}
                placeholder="Briefly describe anything you've built, even a small class project"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                Real certifications or courses completed (optional)
              </label>
              <input
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="e.g. NPTEL Python, Coursera ML course — only actual completed ones"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Don&apos;t put a topic here just because you know it — that
                goes in the skills fields above.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                Anything else AIRA should know? (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Goals, timeline, specific companies you're interested in..."
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
              />
            </div>

            {error && (
              <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="brand-gradient w-full border-none text-primary-foreground disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  AIRA is building your profile...
                </>
              ) : (
                <>
                  Build my profile
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <Card glass className="animate-fade-up p-6">
          <div className="flex items-center gap-2.5">
            <AiraMascot className="size-8" animated />
            <h3 className="font-display font-bold">Why this works</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            AIRA scores you based on real proficiency, not just a list of
            skill names — so a beginner and someone with real project
            experience won&apos;t get the same score for typing the same
            word.
          </p>
          <div className="mt-4 rounded-xl bg-primary/[0.05] p-4 text-sm">
            <p className="font-semibold text-primary">Why we ask this way</p>
            <p className="mt-1 text-muted-foreground">
              Splitting skills into &quot;confident&quot; vs &quot;just
              learning&quot; means your roadmap actually starts from where
              you really are — not where a resume buzzword makes it look
              like you are.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
