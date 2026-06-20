'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { House, Dumbbell, TrendingUp, CalendarCheck, ClipboardList } from 'lucide-react'

const BOTTOM_ITEMS = [
  { label: 'Início',     href: '/student',            icon: House,         exact: true },
  { label: 'Treinos',   href: '/student/treinos',     icon: Dumbbell,      exact: false },
  { label: 'Progresso', href: '/student/progresso',   icon: TrendingUp,    exact: false },
  { label: 'Frequência',href: '/student/frequencia',  icon: CalendarCheck, exact: false },
  { label: 'Anamnese',  href: '/student/anamnese',    icon: ClipboardList, exact: false },
]

export function StudentBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex md:hidden bg-surface border-t border-surface-border">
      {BOTTOM_ITEMS.map((item) => {
        const Icon = item.icon
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors',
              active ? 'text-brand-lime' : 'text-text-secondary',
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
