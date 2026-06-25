'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MODULE_ROUTES } from '@/lib/modules-config'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Dumbbell,
  ClipboardList,
  Zap,
  Play,
  Ruler,
  FileHeart,
  TrendingUp,
  CalendarCheck,
  CalendarDays,
  MessageSquare,
  Receipt,
  FolderOpen,
  Bell,
  Palette,
  UtensilsCrossed,
  ChevronDown,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

// ─── Mapa de ícones por nome (espelha system_modules.icon) ───────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, ClipboardList, Zap, Play, Ruler, FileHeart,
  TrendingUp, CalendarCheck, CalendarDays, MessageSquare, Receipt,
  FolderOpen, Bell, Palette, UtensilsCrossed,
}

export type EnabledModule = {
  slug: string
  name: string
  icon: string | null
}

// ─── Grupos de módulos ────────────────────────────────────────────────────────
const MODULE_GROUPS: { label: string; slugs: string[] }[] = [
  {
    label: 'Treinos',
    slugs: ['banco-de-exercicios', 'planos-de-treino', 'treinos-extras', 'execucao-do-treino'],
  },
  {
    label: 'Acompanhamento',
    slugs: ['avaliacoes-fisicas', 'anamnese', 'meu-progresso', 'frequencia', 'feedbacks', 'planos-alimentares'],
  },
  {
    label: 'Financeiro',
    slugs: ['faturas'],
  },
  {
    label: 'Comunicação',
    slugs: ['arquivos', 'notificacoes', 'minha-agenda'],
  },
]

// ─── Itens fixos ──────────────────────────────────────────────────────────────
const CORE_TOP: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/dashboard',       icon: LayoutDashboard },
  { label: 'Alunos',   href: '/dashboard/alunos', icon: Users           },
]

const CORE_BOTTOM: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy    },
  { label: 'Planos',  href: '/dashboard/planos',  icon: CreditCard },
  { label: 'Ajustes', href: '/dashboard/ajustes', icon: Settings   },
]

// ─── Componente principal ─────────────────────────────────────────────────────
interface Props {
  modules: EnabledModule[]
}

export function DashboardSidebarNav({ modules }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(href + '/')

  // Módulos habilitados indexados por slug
  const enabledBySlug = new Map(modules.map(m => [m.slug, m]))

  // Quais grupos têm pelo menos 1 módulo habilitado?
  const activeGroups = MODULE_GROUPS.filter(g =>
    g.slugs.some(s => enabledBySlug.has(s)),
  )

  // Estado de abertura — inicializa com todos abertos
  const [open, setOpen] = useState<Record<string, boolean>>(
    () => Object.fromEntries(activeGroups.map(g => [g.label, true])),
  )

  const toggle = (label: string) =>
    setOpen(prev => ({ ...prev, [label]: !prev[label] }))

  // Link de navegação padrão
  const navLink = (item: { label: string; href: string; icon: LucideIcon }) => {
    const Icon   = item.icon
    const active = isActive(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all',
          active
            ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-border/30',
        )}
      >
        <Icon size={18} />
        {item.label}
      </Link>
    )
  }

  return (
    <nav className="flex flex-col gap-1">
      {/* Itens fixos — topo */}
      {CORE_TOP.map(navLink)}

      {/* Grupos de módulos */}
      {activeGroups.length > 0 && (
        <div className="mt-1 border-t border-surface-border/50 pt-1 space-y-0.5">
          {activeGroups.map(group => {
            const isOpen = open[group.label] ?? true

            // Módulos do grupo que estão habilitados
            const groupModules = group.slugs
              .map(slug => enabledBySlug.get(slug))
              .filter((m): m is EnabledModule => !!m)

            // Verifica se algum item do grupo está ativo (para highlight do header)
            const groupHasActive = groupModules.some(m => {
              const route = MODULE_ROUTES[m.slug]
              return route ? isActive(route.href) : false
            })

            return (
              <div key={group.label}>
                {/* Cabeçalho do grupo — clicável */}
                <button
                  type="button"
                  onClick={() => toggle(group.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-body font-semibold uppercase tracking-widest transition-all select-none',
                    groupHasActive
                      ? 'text-brand-lime'
                      : 'text-text-secondary/60 hover:text-text-secondary',
                  )}
                >
                  {group.label}
                  <ChevronDown
                    size={13}
                    className={cn(
                      'transition-transform duration-200',
                      isOpen ? 'rotate-0' : '-rotate-90',
                    )}
                  />
                </button>

                {/* Conteúdo — sanfona com animação */}
                <div
                  className={cn(
                    'grid transition-all duration-200 ease-in-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pl-2 pb-1 space-y-0.5">
                      {groupModules.map(mod => {
                        const route  = MODULE_ROUTES[mod.slug]
                        if (!route) return null
                        const Icon   = ICON_MAP[mod.icon ?? ''] ?? Dumbbell
                        const active = isActive(route.href)
                        return (
                          <Link
                            key={mod.slug}
                            href={route.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all',
                              active
                                ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-border/30',
                            )}
                          >
                            <Icon size={16} />
                            {route.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Itens fixos — fundo */}
      <div className="mt-1 border-t border-surface-border/50 pt-1 space-y-0.5">
        {CORE_BOTTOM.map(navLink)}
      </div>
    </nav>
  )
}
