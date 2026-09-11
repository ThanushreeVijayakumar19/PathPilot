'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Send, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { airaSuggestedPrompts } from '@/lib/data'
import { cn } from '@/lib/utils'
import { AiraMascot } from '@/components/mascot'
import { createClient } from '@/lib/supabase/client'

type Message = {
  role: 'aira' | 'user'
  text: string
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [initials, setInitials] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [firstName, setFirstName] = useState('there')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split('@')[0] ||
        'there'
      setFirstName(name.split(' ')[0])
      setInitials(
        name
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      )

      const { data: history } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (history && history.length > 0) {
        setMessages(
          history.map((m) => ({
            role: m.role as 'aira' | 'user',
            text: m.content,
          })),
        )
      } else {
        setMessages([
          {
            role: 'aira',
            text: `Hi ${name.split(' ')[0]}! I'm AIRA, your AI career copilot. I can review your resume, recommend internships, plan your learning roadmap, and prep you for interviews. What would you like to work on today?`,
          },
        ])
      }
      setLoadingHistory(false)
    }

    load()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, typing])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return

    setErrorMessage('')
    setMessages((m) => [...m, { role: 'user', text: trimmed }])
    setInput('')
    setTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          data.error || `AIRA couldn't respond (status ${res.status}).`,
        )
      }

      // Add an empty AIRA bubble we'll stream text into
      setMessages((m) => [...m, { role: 'aira', text: '' }])
      setTyping(false)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((m) => {
          const next = [...m]
          next[next.length - 1] = {
            role: 'aira',
            text: next[next.length - 1].text + chunk,
          }
          return next
        })
      }
    } catch (err) {
      setTyping(false)
      setErrorMessage((err as Error).message)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="animate-fade-up mb-4 flex items-center gap-3">
        <span className="brand-gradient relative flex size-12 items-center justify-center rounded-2xl p-1.5 text-primary-foreground shadow-lg shadow-primary/25">
          <AiraMascot className="size-full" />
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background bg-emerald-500" />
        </span>
        <div>
          <h1 className="font-display flex items-center gap-2 text-xl font-bold">
            AIRA
            <span className="brand-gradient-text text-xs font-semibold uppercase tracking-widest">
              AI Assistant
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Online · Your personal career copilot
          </p>
        </div>
      </div>

      {/* Chat window */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {loadingHistory ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading conversation...
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-3',
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                    m.role === 'aira'
                      ? 'brand-gradient p-1 text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground',
                  )}
                >
                  {m.role === 'aira' ? (
                    <AiraMascot className="size-full" />
                  ) : (
                    initials || 'You'
                  )}
                </span>
                <div
                  className={cn(
                    'max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]',
                    m.role === 'aira'
                      ? 'rounded-tl-sm bg-muted text-foreground'
                      : 'brand-gradient rounded-tr-sm text-primary-foreground',
                  )}
                >
                  {m.text || (
                    <span className="inline-flex items-center gap-1">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                          style={{ animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {typing && (
            <div className="flex gap-3">
              <span className="brand-gradient flex size-9 shrink-0 items-center justify-center rounded-xl p-1 text-primary-foreground">
                <AiraMascot className="size-full" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-4">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/[0.06] p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && !loadingHistory && (
          <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
            {airaSuggestedPrompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.05] px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Sparkles className="size-3" />
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border bg-card/60 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Ask AIRA about your resume, skills, or internships..."
              className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
            />
            <Button
              type="submit"
              size="icon-lg"
              disabled={!input.trim() || typing}
              className="brand-gradient size-11 shrink-0 border-none text-primary-foreground disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="size-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
