'use client'

// Popup de onboarding por módulo — mostra 1 módulo por login, em loop.
// Regras completas: docs/modulos/onboarding-popup-modulos.md
//
// - Um popup por carregamento de página (não reabre sem novo login/refresh).
// - Avança o índice ao abrir: fechar (X / "Entendi") já leva ao próximo no próximo login.
// - "Não quero mais ver isso" grava flag definitiva — nenhum módulo volta a aparecer.
// - Persistência 100% local (localStorage), por perfil + userId. Sem servidor.

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, EyeOff, ArrowRight } from 'lucide-react'
import {
  getOnboardingModules,
  CATEGORY_LABELS,
  type OnboardingRole,
  type ModuleOnboardingItem,
} from '@/lib/module-onboarding'

// Violeta é a identidade exclusiva do Max (DESIGN.md) — usado só no avatar/nome/glow dele.
const MAX_VIOLET = '#7C3AED'

interface Props {
  role: OnboardingRole
  userId: string
  /** Slugs habilitados no tenant. Se vazio/nulo, mostra a lista completa do perfil. */
  enabledSlugs?: string[] | null
}

const dismissedKey = (role: OnboardingRole, userId: string) =>
  `module_onboarding_dismissed_forever_${role}_${userId}`
const indexKey = (role: OnboardingRole, userId: string) =>
  `module_onboarding_index_${role}_${userId}`

export function ModuleOnboardingPopup({ role, userId, enabledSlugs }: Props) {
  const [item, setItem] = useState<ModuleOnboardingItem | null>(null)
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    let dismissed: string | null = null
    try {
      dismissed = localStorage.getItem(dismissedKey(role, userId))
    } catch {
      return // localStorage indisponível — não exibe
    }
    if (dismissed) return

    // Lista do perfil, filtrada pelos módulos habilitados no tenant (quando informados)
    const all = getOnboardingModules(role)
    const list = enabledSlugs && enabledSlugs.length
      ? all.filter((m) => enabledSlugs.includes(m.slug))
      : all
    if (!list.length) return

    const rawIdx = parseInt(localStorage.getItem(indexKey(role, userId)) ?? '0', 10)
    const idx = Number.isFinite(rawIdx) && rawIdx >= 0 ? rawIdx % list.length : 0

    // Avança já para o próximo — assim qualquer forma de fechar leva ao seguinte no próximo login
    const nextIdx = (idx + 1) % list.length
    try {
      localStorage.setItem(indexKey(role, userId), String(nextIdx))
    } catch {
      /* ignore */
    }

    setItem(list[idx])
  }, [role, userId, enabledSlugs])

  function handleNeverAgain() {
    try {
      localStorage.setItem(dismissedKey(role, userId), '1')
    } catch {
      /* ignore */
    }
    setItem(null)
  }

  function handleClose() {
    setItem(null)
  }

  if (!item) return null

  const Icon = item.icon
  const categoryLabel = CATEGORY_LABELS[item.category]
  const speakingIntro = role === 'personal'
    ? 'Deixa eu te apresentar mais um módulo do seu painel:'
    : 'Bora conhecer mais uma parte do seu app:'

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[92dvh] flex flex-col rounded-3xl border border-surface-border overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-surface, #1A1A2E)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close — alvo de toque ≥44px (mobile-first) */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute top-2.5 right-2.5 z-10 w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-border/50 transition-all"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 pb-2">
          {/* Max — garoto-propaganda falando com o usuário */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${MAX_VIOLET}30 0%, transparent 70%)` }}
              />
              <Image
                src="/max-avatar.png"
                alt="Max Strive IA"
                width={56}
                height={56}
                className="relative z-10 object-contain"
                style={{ filter: `drop-shadow(0 0 10px ${MAX_VIOLET}55)` }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: MAX_VIOLET }}
              >
                Max Strive
              </p>
              <p className="text-sm text-text-secondary leading-snug">
                {speakingIntro}
              </p>
            </div>
          </div>

          {/* Badge categoria */}
          <div
            className="inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-semibold tracking-widest uppercase mb-5"
            style={{
              color: 'var(--brand-lime, #E8FF47)',
              borderColor: 'color-mix(in srgb, var(--brand-lime, #E8FF47) 30%, transparent)',
              background: 'color-mix(in srgb, var(--brand-lime, #E8FF47) 8%, transparent)',
            }}
          >
            {categoryLabel}
          </div>

          {/* Ícone + título */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{
                background: 'color-mix(in srgb, var(--brand-lime, #E8FF47) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--brand-lime, #E8FF47) 25%, transparent)',
                color: 'var(--brand-lime, #E8FF47)',
              }}
            >
              <Icon size={20} />
            </div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-text-primary leading-tight">
              {item.name}
            </h2>
          </div>

          {/* Descrição */}
          <p className="text-sm text-text-primary leading-relaxed mb-5">
            {item.description}
          </p>

          {/* Como usar */}
          <div className="rounded-xl border border-surface-border bg-background/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-2">
              Como usar
            </p>
            <p className="text-sm text-text-primary leading-relaxed">
              {item.howToUse}
            </p>
          </div>
        </div>

        {/* Actions — empilhado no mobile (primário em cima), lado a lado no desktop */}
        <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 p-4 border-t border-surface-border">
          <button
            type="button"
            onClick={handleNeverAgain}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-surface-border text-xs font-medium text-text-secondary hover:text-text-primary hover:border-surface-border/80 transition-all"
          >
            <EyeOff size={13} />
            Não quero mais ver isso
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:flex-[1.2] flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--brand-lime, #E8FF47)', color: '#000' }}
          >
            Entendi
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
