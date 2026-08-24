'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bot,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  Route,
  Sparkles,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { student } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { AiraMascot } from '@/components/mascot'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resume', label: 'Resume Upload', icon: Upload },
  { href: '/analysis', label: 'Resume Analysis', icon: FileText },
  { href: '/recommendations', label: 'Recommendations', icon: Sparkles },
  { href: '/roadmap', label: 'Roadmap', icon: Route },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
]

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 px-2 pt-2"
      >
        <span className="brand-gradient flex size-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg shadow-primary/25">
          <Compass className="size-5" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight">
            PathPilot
          </span>
          <span className="text-xs text-muted-foreground">Career Copilot</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'brand-gradient text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        <div className="glass relative overflow-hidden rounded-2xl p-4">
          <div className="brand-gradient absolute -right-6 -top-6 size-20 rounded-full opacity-20 blur-xl" />
          <div className="flex items-center gap-2">
            <AiraMascot className="size-8" animated />
            <span className="text-sm font-semibold">AIRA Pro</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Unlock deeper analysis, unlimited matches & mock interviews.
          </p>
          <Link
            href="/assistant"
            onClick={onNavigate}
            className="brand-gradient mt-3 flex w-full items-center justify-center rounded-lg py-2 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Upgrade
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="brand-gradient flex size-9 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
            {account?.initials ?? student.initials}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">
              {account?.name ?? student.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {account?.email || student.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
