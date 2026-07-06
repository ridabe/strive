'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  House, Dumbbell, Zap, TrendingUp, CalendarCheck,
  ClipboardList, Activity, MessageSquare, Receipt, Utensils, UtensilsCrossed, Calendar, FolderOpen, History, Bell,
  Trophy, Flag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface StudentNavItem {
  label: string
  href: string
  icon: LucideIcon
  exact: boolean
}

const BASE_NAV_ITEMS: StudentNavItem[] = [
  { label: 'Início',          href: '/student',               icon: House,         exact: true },
  { label: 'Meus Treinos',   href: '/student/treinos',        icon: Dumbbell,      exact: false },
  { label: 'Histórico',      href: '/student/historico',      icon: History,       exact: false },
  { label: 'Treinos Extras', href: '/student/treinos-extras', icon: Zap,           exact: false },
  { label: 'Meu Progresso',  href: '/student/progresso',      icon: TrendingUp,    exact: false },
  { label: 'Frequência',     href: '/student/frequencia',     icon: CalendarCheck, exact: false },
  { label: 'Anamnese',       href: '/student/anamnese',       icon: ClipboardList, exact: false },
  { label: 'Avaliação',      href: '/student/avaliacao',      icon: Activity,      exact: false },
  { label: 'Feedback',       href: '/student/feedback',       icon: MessageSquare, exact: false },
  { label: 'Mensagens',      href: '/student/mensagens',      icon: Bell,          exact: false },
  { label: 'Arquivos',       href: '/student/arquivos',       icon: FolderOpen,    exact: false },
  { label: 'Financeiro',     href: '/student/financeiro',     icon: Receipt,       exact: false },
  { label: 'Nutrição',       href: '/student/nutricao',       icon: Utensils,      exact: false },
  { label: 'Plano Alimentar', href: '/student/planos-alimentares', icon: UtensilsCrossed, exact: false },
  { label: 'Agenda',         href: '/student/agenda',         icon: Calendar,      exact: false },
]

const RANKING_ITEM: StudentNavItem = {
  label: 'Ranking',
  href:  '/student/ranking',
  icon:  Trophy,
  exact: false,
}

const CHALLENGES_ITEM: StudentNavItem = {
  label: 'Desafios',
  href:  '/student/desafios',
  icon:  Flag,
  exact: false,
}

interface StudentSidebarNavProps {
  personalName: string | null
  gamificationActive?: boolean
  unreadMessageCount?: number
  hasChallenge?: boolean
  accentTextColor?: string
}

/**
 * Retorna a lista de rotas do aluno, incluindo o ranking quando o modulo estiver ativo
 * e Desafios quando o aluno participa de um desafio ativo ou com resultado publicado.
 */
export function getStudentNavItems(gamificationActive?: boolean, hasChallenge?: boolean): StudentNavItem[] {
  let items = BASE_NAV_ITEMS
  if (hasChallenge) items = [...items, CHALLENGES_ITEM]
  if (gamificationActive) items = [...items, RANKING_ITEM]
  return items
}

/**
 * Renderiza a navegacao lateral completa da area do aluno.
 */
export function StudentSidebarNav({
  personalName,
  gamificationActive,
  unreadMessageCount = 0,
  hasChallenge,
  accentTextColor = '#FFFFFF',
}: StudentSidebarNavProps) {
  const pathname = usePathname()
  const NAV_ITEMS = getStudentNavItems(gamificationActive, hasChallenge)

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
                  ? 'bg-brand-lime/10 border border-brand-lime/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-border/30 border border-transparent',
              )}
              style={active ? { color: accentTextColor } : undefined}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.href === '/student/mensagens' && unreadMessageCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-lime px-1.5 py-0.5 text-[10px] font-bold text-black">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
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
