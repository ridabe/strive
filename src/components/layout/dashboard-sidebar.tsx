'use client'

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
  MessageSquare,
  Receipt,
  FolderOpen,
  Bell,
  Palette,
  type LucideIcon,
} from 'lucide-react'

// Mapa de ícones por nome (espelha o campo `icon` da tabela system_modules)
const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, ClipboardList, Zap, Play, Ruler, FileHeart,
  TrendingUp, CalendarCheck, MessageSquare, Receipt,
  FolderOpen, Bell, Palette,
}

export type EnabledModule = {
  slug: string
  name: string
  icon: string | null
}

// ─── Itens fixos — sempre visíveis ──────────────────────────────────────────
const CORE_TOP: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/dashboard',       icon: LayoutDashboard },
  { label: 'Alunos',   href: '/dashboard/alunos', icon: Users           },
]

const CORE_BOTTOM: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Planos',  href: '/dashboard/planos',  icon: CreditCard },
  { label: 'Ajustes', href: '/dashboard/ajustes', icon: Settings   },
]

// ─── Componente ─────────────────────────────────────────────────────────────
interface Props {
  modules: EnabledModule[]
}

export function DashboardSidebarNav({ modules }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(href + '/')

  const navLink = (item: { label: string; href: string; icon: LucideIcon }) => {
    const Icon = item.icon
    const active = isActive(item.href)
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
  }

  return (
    <nav className="flex flex-col gap-1">
      {/* Core topo */}
      {CORE_TOP.map(navLink)}

      {/* Módulos habilitados para o tenant */}
      {modules.length > 0 && (
        <>
          <div className="my-1 border-t border-surface-border/50" />
          {modules.map((mod) => {
            const route  = MODULE_ROUTES[mod.slug]
            if (!route) return null
            const Icon   = ICON_MAP[mod.icon ?? ''] ?? Dumbbell
            const active = isActive(route.href)
            return (
              <Link
                key={mod.slug}
                href={route.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all',
                  active
                    ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-border/30'
                )}
              >
                <Icon size={18} />
                {route.label}
              </Link>
            )
          })}
        </>
      )}

      {/* Core fundo */}
      <div className="my-1 border-t border-surface-border/50" />
      {CORE_BOTTOM.map(navLink)}
    </nav>
  )
}
