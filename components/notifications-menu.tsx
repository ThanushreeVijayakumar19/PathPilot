'use client'

import { useEffect, useRef, useState } from 'react'
import { notifications } from '@/lib/data'
import { cn } from '@/lib/utils'

export function NotificationsMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = notifications.filter((n) => n.unread).length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        {children}
      </button>

      {open && (
        <div className="animate-fade-up absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <span className="brand-gradient rounded-full px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              {unread} new
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-3 px-4 py-3 transition-colors hover:bg-muted',
                  n.unread && 'bg-primary/[0.04]',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    n.unread ? 'brand-gradient' : 'bg-border',
                  )}
                />
                <div>
                  <p className="text-sm font-medium leading-snug">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full border-t border-border py-2.5 text-center text-xs font-semibold text-primary hover:bg-muted">
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}
