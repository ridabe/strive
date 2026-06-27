'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, Menu, MoreHorizontal, Puzzle, X } from 'lucide-react'
import type { AppRole } from '@/types/database'
import { cn } from '@/lib/utils'
import { AdminSidebarNav } from '@/components/layout/admin-sidebar'
import { UserMenu } from '@/components/layout/user-menu'
import { LogoHorizontal } from '@/components/logo'

interface AdminMobileNavProps {
  userName: string | null
  userEmail: string
  userRole: AppRole
}

const QUICK_ITEMS = [
  { label: 'Painel', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Clientes', href: '/admin/clientes', icon: Building2, exact: false },
  { label: 'Módulos', href: '/admin/modulos', icon: Puzzle, exact: false },
]

/**
 * Renderiza a navegacao mobile do admin global com drawer lateral
 * e atalhos fixos para as areas mais usadas do painel.
 */
export function AdminMobileNav({
  userName,
  userEmail,
  userRole,
}: AdminMobileNavProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-surface border-b border-status-error/20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-status-error/20 text-status-error hover:bg-status-error/10 transition-colors"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <LogoHorizontal size="sm" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-status-error/20 bg-status-error/10 px-2.5 py-1 text-[10px] font-body font-semibold text-status-error">
          <span className="h-1.5 w-1.5 rounded-full bg-status-error animate-pulse" />
          Admin
        </div>
      </header>

      <div
        className={cn(
          'md:hidden fixed inset-0 z-50 transition-opacity duration-200',
          isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!isMenuOpen}
      >
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setIsMenuOpen(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col border-r border-status-error/20 bg-surface shadow-2xl transition-transform duration-200',
            isMenuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-status-error/20 px-4 py-4">
            <div className="min-w-0">
              <LogoHorizontal size="sm" />
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-status-error/20 bg-status-error/10 px-2.5 py-1 text-xs font-body font-semibold text-status-error">
                <span className="h-1.5 w-1.5 rounded-full bg-status-error animate-pulse" />
                Admin Global
              </div>
            </div>

            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-status-error/20 text-status-error hover:bg-status-error/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <AdminSidebarNav />
          </div>

          <div className="border-t border-status-error/20 p-4">
            <UserMenu
              name={userName}
              email={userEmail}
              role={userRole}
            />
          </div>
        </aside>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden bg-surface border-t border-status-error/20 pb-[env(safe-area-inset-bottom)]">
        {QUICK_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex min-w-0 flex-col items-center justify-center py-3 gap-0.5 transition-colors',
                active ? 'text-status-error' : 'text-text-secondary',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}

        <button
          type="button"
          aria-label="Abrir menu completo"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(true)}
          className={cn(
            'flex-1 flex min-w-0 flex-col items-center justify-center py-3 gap-0.5 transition-colors',
            isMenuOpen ? 'text-status-error' : 'text-text-secondary',
          )}
        >
          <MoreHorizontal size={20} strokeWidth={isMenuOpen ? 2.5 : 1.75} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>
    </>
  )
}
