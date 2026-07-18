'use client'

import Image from 'next/image'
import { X, EyeOff } from 'lucide-react'
import type { GuideKey } from '@/lib/guides'
import { GUIDES } from '@/lib/guides'

// Violeta é a identidade exclusiva do Max (DESIGN.md) — mesmo padrão do ModuleOnboardingPopup.
const MAX_VIOLET = '#7C3AED'

type Props = {
  guideKey: GuideKey
  open: boolean
  onClose: () => void
  onDismissForever: () => void
}

export function GuideModal({ guideKey, open, onClose, onDismissForever }: Props) {
  if (!open) return null

  const content = GUIDES[guideKey]

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl border border-surface-border overflow-hidden shadow-2xl bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fixo */}
        <div className="flex items-center gap-3 p-5 pb-4 border-b border-surface-border flex-shrink-0">
          <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${MAX_VIOLET}30 0%, transparent 70%)` }}
            />
            <Image
              src="/max-avatar.png"
              alt="Max Strive IA"
              width={44}
              height={44}
              className="relative z-10 object-contain"
              style={{ filter: `drop-shadow(0 0 8px ${MAX_VIOLET}55)` }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: MAX_VIOLET }}>
              Guia do Max
            </p>
            <p className="text-sm font-bold text-text-primary leading-snug truncate">
              {content.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo com scroll delimitado — altura fixa no container, não porcentagem encadeada */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">{content.intro}</p>

          {content.sections.map((section) => (
            <div key={section.heading} className="space-y-1.5">
              <p className="text-xs font-bold text-brand-lime uppercase tracking-widest">
                {section.heading}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t border-surface-border flex-shrink-0 space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-brand-lime/90 transition-colors"
          >
            Entendi
          </button>
          <button
            type="button"
            onClick={onDismissForever}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <EyeOff size={11} />
            Não quero mais ver isso
          </button>
        </div>
      </div>
    </div>
  )
}
