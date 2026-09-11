'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Compass,
  FileUp,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { AiraMascot } from '@/components/mascot'
import { createClient } from '@/lib/supabase/client'

export default function WelcomePage() {
  const router = useRouter()
  const [name, setName] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const fullName = (user.user_metadata?.full_name as string | undefined) || null
      setName(fullName ? fullName.split(' ')[0] : null)

      // If this account already has a resume/profile on file, there's
      // nothing to choose — send them straight to the dashboard.
      const { data: existing } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (existing) {
        router.replace('/dashboard')
        return
      }

      setChecking(false)
    }

    check()
  }, [router])

  if (checking) {
    return (
      <div className="aura-bg flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="aura-bg relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="animate-float-slow absolute -left-24 top-16 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 size-80 rounded-full bg-accent/15 blur-3xl [animation-delay:1.5s]" />

      <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card/40 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <span className="brand-gradient flex size-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg shadow-primary/25">
            <Compass className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            PathPilot
          </span>
        </Link>

        <AiraMascot className="mx-auto -mb-2 h-24 w-24" animated />

        <div className="mt-4 text-center">
          <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            {name ? `Welcome, ${name}` : 'Welcome to PathPilot'}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-balance">
            Let&apos;s get your skill profile started
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
            AIRA needs to know your skills and goals before it can score you,
            find matches, and build a roadmap. Pick whichever is faster for
            you — both give the same result.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/profile-builder"
            className="group flex flex-col rounded-2xl border border-border bg-card/60 p-5 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <span className="mt-3 font-display text-base font-bold">
              Build profile with AIRA
            </span>
            <span className="mt-1 text-sm leading-relaxed text-muted-foreground">
              No resume? Answer a few quick questions about your skills,
              education, and interests.
            </span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Get started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/resume"
            className="group flex flex-col rounded-2xl border border-border bg-card/60 p-5 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FileUp className="size-5" />
            </span>
            <span className="mt-3 font-display text-base font-bold">
              Upload my resume
            </span>
            <span className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Already have a resume? Upload the PDF and AIRA will read it in
              seconds.
            </span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Get started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mx-auto mt-6 block text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
