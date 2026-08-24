'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  ScanLine,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Card, PageHeader } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AiraMascot } from '@/components/mascot'
import { createClient } from '@/lib/supabase/client'
import { extractTextFromPdf } from '@/lib/pdf'

type Stage = 'idle' | 'ready' | 'scanning' | 'done' | 'error'

const scanSteps = [
  'Extracting text from your PDF',
  'Uploading securely to your account',
  'AIRA is reading your resume',
  'Scoring & finding skill gaps',
]

export default function ResumeUploadPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(selected?: File) {
    if (!selected) return
    if (selected.type !== 'application/pdf') {
      setErrorMessage('Please upload a PDF file — that\'s all we can read for now.')
      setStage('error')
      return
    }
    setFile(selected)
    setStage('ready')
    setErrorMessage('')
  }

  async function analyze() {
    if (!file) return
    setStage('scanning')
    setErrorMessage('')

    try {
      setActiveStep(0)
      const rawText = await extractTextFromPdf(file)

      if (rawText.trim().length < 30) {
        throw new Error(
          'Could not extract readable text from this PDF. Try a different file (it may be a scanned image).',
        )
      }

      setActiveStep(1)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You need to be logged in to upload a resume.')
      }

      const storagePath = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, file, { upsert: true })

      if (uploadError) {
        throw new Error(
          `Storage upload failed: ${uploadError.message}. Did you create the "resumes" bucket in Supabase?`,
        )
      }

      setActiveStep(2)
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          storagePath,
          rawText,
        }),
      })

      setActiveStep(3)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed.')
      }

      setStage('done')
      router.refresh()
      setTimeout(() => router.push('/analysis'), 900)
    } catch (err) {
      setErrorMessage((err as Error).message)
      setStage('error')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Step 1"
        title="Upload Your Resume"
        description="Drop your resume and AIRA will scan it in seconds — extracting your skills, projects, and certifications to build your career profile."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up p-6 lg:col-span-2">
          {stage === 'error' && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/[0.06] p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {stage === 'scanning' || stage === 'done' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="relative mb-6 flex size-28 items-center justify-center">
                <span className="brand-gradient absolute inset-0 rounded-3xl opacity-20 blur-xl" />
                <span className="brand-gradient relative flex size-24 items-center justify-center rounded-3xl text-primary-foreground">
                  {stage === 'done' ? (
                    <CheckCircle2 className="size-11" />
                  ) : (
                    <ScanLine className="size-11 animate-pulse" />
                  )}
                </span>
                {stage === 'scanning' && (
                  <span className="absolute inset-x-2 top-1/2 h-0.5 animate-[float-slow_1.2s_ease-in-out_infinite] rounded-full bg-white/80 shadow-[0_0_12px_2px] shadow-white/60" />
                )}
              </div>
              <h3 className="font-display text-xl font-bold">
                {stage === 'done' ? 'Analysis complete!' : 'AIRA is scanning...'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {stage === 'done'
                  ? 'Redirecting you to your results'
                  : file?.name}
              </p>

              <div className="mt-6 w-full max-w-sm space-y-2.5">
                {scanSteps.map((s, i) => {
                  const complete = stage === 'done' || i < activeStep
                  const current = stage === 'scanning' && i === activeStep
                  return (
                    <div
                      key={s}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all',
                        complete
                          ? 'border-primary/20 bg-primary/[0.05]'
                          : current
                            ? 'border-primary/40 bg-primary/[0.08]'
                            : 'border-border opacity-50',
                      )}
                    >
                      {complete ? (
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      ) : current ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <span className="size-4 shrink-0 rounded-full border-2 border-border" />
                      )}
                      <span className={complete || current ? 'font-medium' : ''}>
                        {s}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  handleFile(e.dataTransfer.files?.[0])
                }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all',
                  dragging
                    ? 'border-primary bg-primary/[0.06]'
                    : 'border-border hover:border-primary/40 hover:bg-muted/40',
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <span
                  className={cn(
                    'mb-4 flex size-16 items-center justify-center rounded-2xl transition-transform',
                    dragging
                      ? 'brand-gradient scale-110 text-primary-foreground'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  <Upload className="size-7" />
                </span>
                <p className="font-display text-lg font-bold">
                  {file ? file.name : 'Drag & drop your resume here'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {file
                    ? 'Ready to analyze — or choose a different file'
                    : 'PDF only for now · up to 10MB'}
                </p>
                <Button
                  variant="outline"
                  className="mt-5 pointer-events-none"
                >
                  <FileUp className="size-4" />
                  Upload PDF
                </Button>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/profile-builder"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Don&apos;t have a resume? Build your profile with AIRA instead →
                </Link>
                <Button
                  size="lg"
                  className="brand-gradient border-none text-primary-foreground disabled:opacity-40"
                  disabled={stage !== 'ready'}
                  onClick={analyze}
                >
                  <Sparkles className="size-4" />
                  Analyze Resume
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card glass className="animate-fade-up p-6">
          <div className="flex items-center gap-2.5">
            <AiraMascot className="size-8" />
            <h3 className="font-display font-bold">AIRA Tips</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {[
              'Use a single-column, ATS-friendly layout for best parsing.',
              'Lead bullet points with strong action verbs and metrics.',
              'Keep it to one page for internship applications.',
              'List your most relevant projects near the top.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl bg-primary/[0.05] p-4 text-sm">
            <p className="font-semibold text-primary">Privacy first</p>
            <p className="mt-1 text-muted-foreground">
              Your resume is analyzed securely and never shared with employers
              without your consent.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
