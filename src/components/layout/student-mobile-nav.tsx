'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, MoreHorizontal, ArrowLeftRight } from 'lucide-react'
import type { AppRole } from '@/types/db-enums'
import { cn } from '@/lib/utils'
import { getStudentNavItems } from '@/components/layout/student-sidebar'
import { UserMenu } from '@/components/layout/user-menu'
import { resolveTextColor } from '@/lib/color-contrast'

interface StudentMobileNavProps {
  logoUrl: string | null
  businessName: string
  primaryColor: string
  accentTextColor?: string
  onPrimaryTextColor?: string | null
  userName: string | null
  userEmail: string
  userRole: AppRole
  personalName: string | null
  gamificationActive?: boolean
  unreadMessageCount?: number
  hasChallenge?: boolean
  hasMultipleActiveTenants?: boolean
}

/**
 * Renderiza a navegacao mobile da area do aluno com cabecalho fixo,
 * barra inferior e drawer para acesso completo aos modulos.
 */
export function StudentMobileNav({
  logoUrl,
  businessName,
  primaryColor,
  accentTextColor = '#FFFFFF',
  onPrimaryTextColor,
  userName,
  userEmail,
  userRole,
  personalName,
  gamificationActive,
  unreadMessageCount = 0,
  hasChallenge,
  hasMultipleActiveTenants,
}: StudentMobileNavProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const onPrimaryText = resolveTextColor(primaryColor, onPrimaryTextColor)
  const navItems = getStudentNavItems(gamificationActive, hasChallenge)
  const bottomItems = navItems.slice(0, 4)

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
              className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-sm flex-shrink-0"
              style={{ background: primaryColor, color: onPrimaryText }}
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

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-black flex-shrink-0"
          style={{ background: primaryColor, color: onPrimaryText }}
        >
          {(userName ?? userEmail).charAt(0).toUpperCase()}
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
                Menu do aluno
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
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-body font-medium transition-all',
                      active
                        ? 'bg-brand-lime/10 border-brand-lime/20'
                        : 'border-transparent text-text-secondary hover:bg-surface-border/30 hover:text-text-primary',
                    )}
                    style={active ? { color: accentTextColor } : undefined}
                  >
                    <Icon size={18} />
                    <span className="flex-1 truncate">{item.label}</span>
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
              <p className="px-2 pt-4 text-xs leading-relaxed text-text-secondary/70">
                Personal: <span className="text-text-secondary">{personalName}</span>
              </p>
            )}
          </div>

          <div className="border-t border-surface-border p-4 flex flex-col gap-2">
            {hasMultipleActiveTenants && (
              <Link
                href="/student/trocar-personal"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-body font-medium text-text-secondary hover:text-[var(--accent-text)] hover:bg-brand-lime/10 transition-colors"
              >
                <ArrowLeftRight size={15} />
                Trocar de Personal
              </Link>
            )}
            <UserMenu
              name={userName}
              email={userEmail}
              role={userRole}
            />
          </div>
        </aside>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden bg-surface border-t border-surface-border pb-[env(safe-area-inset-bottom)]">
        {bottomItems.map((item) => {
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
                !active && 'text-text-secondary',
              )}
              style={active ? { color: accentTextColor } : undefined}
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
            !isMenuOpen && 'text-text-secondary',
          )}
          style={isMenuOpen ? { color: accentTextColor } : undefined}
        >
          <MoreHorizontal size={20} strokeWidth={isMenuOpen ? 2.5 : 1.75} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>
    </>
  )
}
