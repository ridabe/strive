'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  TrendingUp,
  DollarSign,
  Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Alunos',     href: '/dashboard/alunos',     icon: Users },
  { label: 'Treinos',    href: '/dashboard/treinos',    icon: Dumbbell },
  { label: 'Evolução',   href: '/dashboard/evolucao',   icon: TrendingUp },
  { label: 'Financeiro', href: '/dashboard/financeiro', icon: DollarSign },
  { label: 'Ajustes',   href: '/dashboard/ajustes',    icon: Settings },
]

export function DashboardSidebarNav() {
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
