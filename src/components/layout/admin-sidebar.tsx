'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Building,
  Users,
  BarChart2,
  ScrollText,
  Puzzle,
  CreditCard,
  Dumbbell,
  Smartphone,
  Trophy,
  Zap,
  Youtube,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Painel',       href: '/admin',                       icon: LayoutDashboard },
  { label: 'Clientes',     href: '/admin/clientes',              icon: Building2 },
  { label: 'Academias',    href: '/admin/academias',             icon: Building },
  { label: 'Planos',       href: '/admin/planos',                icon: CreditCard },
  { label: 'Módulos',      href: '/admin/modulos',               icon: Puzzle },
  { label: 'Max Strive IA',href: '/admin/ia',                    icon: Zap },
  { label: 'Exercícios',   href: '/admin/banco-de-exercicios',   icon: Dumbbell },
  { label: 'Ranking',      href: '/admin/ranking',               icon: Trophy },
  { label: 'Usuários',     href: '/admin/usuarios',              icon: Users },
  { label: 'Versão App',   href: '/admin/app-versao',            icon: Smartphone },
  { label: 'Vídeo Home',   href: '/admin/video-home',            icon: Youtube },
  { label: 'Métricas',     href: '/admin/metricas',              icon: BarChart2 },
  { label: 'Logs',         href: '/admin/logs',                  icon: ScrollText },
]

export function AdminSidebarNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active  = pathname === item.href || pathname.startsWith(item.href + '/')
        const isIA    = item.href === '/admin/ia'
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all',
              active && isIA  ? 'bg-violet-400/10 text-violet-400 border border-violet-400/20' :
              active          ? 'bg-status-error/10 text-status-error border border-status-error/20' :
                                'text-text-secondary hover:text-text-primary hover:bg-surface-border/30'
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
