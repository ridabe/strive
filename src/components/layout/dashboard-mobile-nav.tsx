'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Menu, MoreHorizontal, Trophy, Users, X } from 'lucide-react'
import type { AppRole } from '@/types/database'
import { cn } from '@/lib/utils'
import type { EnabledModule } from '@/components/layout/dashboard-sidebar'
import { DashboardSidebarNav } from '@/components/layout/dashboard-sidebar'
import { UserMenu } from '@/components/layout/user-menu'

interface DashboardMobileNavProps {
  logoUrl: string | null
  businessName: string
  primaryColor: string
  userName: string | null
  userEmail: string
  userRole: AppRole
  modules: EnabledModule[]
  notificationBell?: React.ReactNode
}

const QUICK_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Alunos', href: '/dashboard/alunos', icon: Users, exact: false },
  { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy, exact: false },
]

/**
 * Renderiza a navegacao mobile do painel do personal com acesso rapido
 * aos principais atalhos e um drawer com o menu completo.
 */
export function DashboardMobileNav({
  logoUrl,
  businessName,
  primaryColor,
  userName,
  userEmail,
  userRole,
  modules,
  notificationBell,
}: DashboardMobileNavProps) {
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
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-surface border-b border-surface-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-text-primary hover:bg-surface-border/40 transition-colors"
          >
            <Menu size={18} />
          </button>

          {logoUrl ? (
            <div className="relative h-8 w-28 flex-shrink-0">
              <Image
                src={logoUrl}
                alt={businessName}
                fill
                className="object-contain object-left"
                sizes="112px"
                priority
              />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-display font-black text-sm flex-shrink-0"
              style={{ background: primaryColor }}
            >
              {businessName.charAt(0).toUpperCase()}
            </div>
          )}

          {!logoUrl && (
            <span className="text-sm font-body font-semibold text-text-primary truncate">
              {businessName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {notificationBell}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-black text-black flex-shrink-0"
            style={{ background: primaryColor }}
          >
            {(userName ?? userEmail).charAt(0).toUpperCase()}
          </div>
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
            'absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col border-r border-surface-border bg-surface shadow-2xl transition-transform duration-200',
            isMenuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-4">
            <div className="min-w-0">
              <p className="text-base font-body font-semibold text-text-primary truncate">
                Menu do painel
              </p>
              <p className="text-xs text-text-secondary truncate">
                {businessName}
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-text-primary hover:bg-surface-border/40 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <DashboardSidebarNav modules={modules} />
          </div>

          <div className="border-t border-surface-border p-4">
            <div className="flex flex-col gap-3">
              <UserMenu
                name={userName}
                email={userEmail}
                role={userRole}
              />
              <div className="flex items-center justify-center gap-2 pt-1 opacity-40">
                <span className="text-[0.55rem] text-text-secondary uppercase tracking-widest font-medium">
                  powered by
                </span>
                <span className="text-[0.6rem] font-display font-bold text-text-secondary uppercase tracking-wider">
                  Strive Personal
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden bg-surface border-t border-surface-border pb-[env(safe-area-inset-bottom)]">
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
                active ? 'text-brand-lime' : 'text-text-secondary',
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
            isMenuOpen ? 'text-brand-lime' : 'text-text-secondary',
          )}
        >
          <MoreHorizontal size={20} strokeWidth={isMenuOpen ? 2.5 : 1.75} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>
    </>
  )
}
