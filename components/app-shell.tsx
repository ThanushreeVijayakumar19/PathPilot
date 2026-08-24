'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Menu, Search, X } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { NotificationsMenu } from '@/components/notifications-menu'
import { student } from '@/lib/data'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [account, setAccount] = useState<{
    name: string
    email: string
    initials: string
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split('@')[0] ||
        'Student'
      const initials = name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
      setAccount({ name, email: user.email ?? '', initials })
    })
  }, [])

  return (
    <div className="aura-bg min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:block">
        <AppSidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            'absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-4 z-10 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>

            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search internships, skills, companies..."
                className="h-10 w-full rounded-xl border border-border bg-card/60 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-3 focus:ring-primary/15"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <NotificationsMenu>
                <span className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground">
                  <Bell className="size-[18px]" />
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-card" />
                </span>
              </NotificationsMenu>

              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-muted"
              >
                <span className="brand-gradient flex size-7 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground">
                  {account?.initials ?? student.initials}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block max-w-[140px] truncate text-xs font-semibold">
                    {account?.name ?? student.name}
                  </span>
                  <span className="block max-w-[140px] truncate text-[11px] text-muted-foreground">
                    {account?.email || student.graduation}
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
