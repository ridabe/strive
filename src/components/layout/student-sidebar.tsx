'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Dumbbell,
  TrendingUp,
  CalendarDays,
  MessageSquare,
  User,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Meus Treinos',  href: '/student/treinos',    icon: Dumbbell },
  { label: 'Meu Progresso', href: '/student/progresso',  icon: TrendingUp },
  { label: 'Frequência',    href: '/student/frequencia', icon: CalendarDays },
  { label: 'Feedbacks',     href: '/student/feedbacks',  icon: MessageSquare },
  { label: 'Meu Perfil',   href: '/student/perfil',     icon: User },
]

export function StudentSidebarNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all',
              active
                ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-border/30'
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
