'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  Bot,
  CheckCircle2,
  Compass,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  Target,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { AiraMascot } from '@/components/mascot'

const highlights = [
  {
    icon: Bot,
    title: 'AIRA, your AI copilot',
    desc: 'Chat with an assistant that knows your resume, skills, and goals.',
  },
  {
    icon: Target,
    title: 'Personalized matches',
    desc: 'Internships ranked by real fit, not just keyword search.',
  },
  {
    icon: Award,
    title: 'Skill gap analysis',
    desc: 'See exactly what to learn next to land your dream role.',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const name = String(form.get('name') || '').trim()

    if (mode === 'signup' && !name) {
      setError('Please enter your full name.')
      return
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })

      setLoading(false)

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // If email confirmation is enabled in Supabase, there's no session yet.
      if (data.session) {
        router.push('/welcome')
        router.refresh()
      } else {
        setCheckEmail(true)
      }
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.push('/welcome')
    router.refresh()
  }

  return (
    <div className="aura-bg relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="animate-float-slow absolute -left-24 top-16 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 size-80 rounded-full bg-accent/15 blur-3xl [animation-delay:1.5s]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card/40 shadow-2xl shadow-primary/10 backdrop-blur-xl lg:grid-cols-2">
        {/* Left: brand + highlights */}
        <div className="brand-gradient relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-10 size-56 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Compass className="size-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-lg font-bold tracking-tight">
                  PathPilot
                </span>
                <span className="text-xs text-primary-foreground/80">
                  Career Copilot
                </span>
              </span>
            </Link>

            <div className="flex items-center justify-center py-2">
              <div className="flex size-40 items-center justify-center rounded-full bg-white/90 shadow-xl shadow-black/10">
                <AiraMascot className="h-32 w-32" animated />
              </div>
            </div>

            <h1 className="font-display text-3xl font-bold leading-tight text-balance">
              Your AI-powered path to the right internship.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/85 text-pretty">
              PathPilot analyzes your resume, matches you to real
              opportunities, and builds a roadmap to get you there — guided
              by AIRA every step of the way.
            </p>
          </div>

          <div className="relative space-y-4">
            {highlights.map((h) => {
              const Icon = h.icon
              return (
                <div key={h.title} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{h.title}</p>
                    <p className="text-xs leading-relaxed text-primary-foreground/80">
                      {h.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: auth card */}
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="brand-gradient flex size-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg shadow-primary/25">
              <Compass className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              PathPilot
            </span>
          </div>

          <AiraMascot className="mx-auto -mb-2 h-24 w-24 lg:hidden" animated />

          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            {mode === 'login' ? 'Welcome back' : 'Get started free'}
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-balance">
            {mode === 'login' ? 'Log in to your account' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Pick up where you left off with AIRA.'
              : 'Takes less than a minute — no credit card needed.'}
          </p>

          {/* Mode toggle */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
                setCheckEmail(false)
              }}
              className={cn(
                'rounded-lg py-2 text-sm font-semibold transition-all',
                mode === 'login'
                  ? 'brand-gradient text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
                setCheckEmail(false)
              }}
              className={cn(
                'rounded-lg py-2 text-sm font-semibold transition-all',
                mode === 'signup'
                  ? 'brand-gradient text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Sign Up
            </button>
          </div>

          {checkEmail ? (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Mail className="size-4" />
                Check your inbox
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We&apos;ve sent a confirmation link to your email. Click it to
                activate your account, then come back and log in.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCheckEmail(false)
                  setMode('login')
                }}
                className="mt-4 text-sm font-semibold text-primary hover:underline"
              >
                Back to log in
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Aditya Sharma"
                    className="h-11 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  className="h-11 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-foreground"
                >
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="brand-gradient flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Log In' : 'Create Account'}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
          )}

          {!checkEmail && (
            <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-primary" />
              No spam. Your data stays private and secure.
            </div>
          )}

          {!checkEmail && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-semibold text-primary hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
