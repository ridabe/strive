'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, X, Dumbbell } from 'lucide-react'

interface NavLink {
  label: string
  href: string
}

interface MobileNavProps {
  links: NavLink[]
  isLoggedIn: boolean
}

// "Entrar" / "Ir para o Dashboard" já ficam sempre visíveis na barra superior
// (não são escondidas em mobile) — este menu só precisa dos anchors de seção
// e, para visitantes deslogados, do link de cadastro (esse sim escondido em mobile na barra).
export function MobileNav({ links, isLoggedIn }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="md:hidden" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open ? 'true' : 'false'}
        aria-controls="mobile-nav-panel"
        className="flex items-center justify-center w-11 h-11 -mr-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <nav
          id="mobile-nav-panel"
          aria-label="Menu mobile"
          className="absolute top-16 left-0 right-0 bg-background border-b border-surface-border px-6 py-4 flex flex-col gap-1"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-body text-text-secondary hover:text-text-primary py-3 transition-colors"
            >
              {link.label}
            </a>
          ))}

          {!isLoggedIn && (
            <div className="border-t border-surface-border mt-2 pt-4">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-body font-medium text-text-secondary border border-surface-border rounded-full px-4 py-3.5"
              >
                <Dumbbell size={12} />
                Criar conta de Personal Trainer
              </Link>
            </div>
          )}
        </nav>
      )}
    </div>
  )
}
