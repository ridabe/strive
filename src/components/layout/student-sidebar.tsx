'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  House, Dumbbell, Zap, TrendingUp, CalendarCheck,
  ClipboardList, Activity, MessageSquare, Receipt, Utensils, Calendar,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Início',          href: '/student',               icon: House,         exact: true },
  { label: 'Meus Treinos',   href: '/student/treinos',        icon: Dumbbell,      exact: false },
  { label: 'Treinos Extras', href: '/student/treinos-extras', icon: Zap,           exact: false },
  { label: 'Meu Progresso',  href: '/student/progresso',      icon: TrendingUp,    exact: false },
  { label: 'Frequência',     href: '/student/frequencia',     icon: CalendarCheck, exact: false },
  { label: 'Anamnese',       href: '/student/anamnese',       icon: ClipboardList, exact: false },
  { label: 'Avaliação',      href: '/student/avaliacao',      icon: Activity,      exact: false },
  { label: 'Feedback',       href: '/student/feedback',       icon: MessageSquare, exact: false },
  { label: 'Financeiro',     href: '/student/financeiro',     icon: Receipt,       exact: false },
  { label: 'Nutrição',       href: '/student/nutricao',       icon: Utensils,      exact: false },
  { label: 'Agenda',         href: '/student/agenda',         icon: Calendar,      exact: false },
]

interface StudentSidebarNavProps {
  personalName: string | null
}

export function StudentSidebarNav({ personalName }: StudentSidebarNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full gap-4">
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all',
                active
                  ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-border/30 border border-transparent',
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {personalName && (
        <p className="text-[11px] text-text-secondary/60 px-3 leading-relaxed">
          Personal: <span className="text-text-secondary">{personalName}</span>
        </p>
      )}
    </div>
  )
}
