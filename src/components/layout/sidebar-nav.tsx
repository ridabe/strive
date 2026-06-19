'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface SidebarNavProps {
  items: NavItem[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
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
            <Icon size={18} className={active ? 'text-brand-lime' : 'text-current'} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
