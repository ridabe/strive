'use client'

import { HelpCircle } from 'lucide-react'
import { useGuide } from '@/hooks/useGuide'
import { GuideModal } from '@/components/guides/GuideModal'

// Guia contextual do módulo de Faturas — abre sozinho na primeira visita do
// personal (useGuide cuida da persistência local de "não mostrar mais"),
// e fica disponível depois via este link, sempre visível no topo da página.
export function FinanceiroGuide() {
  const guide = useGuide('faturas_cobranca')

  return (
    <>
      <button
        type="button"
        onClick={guide.openGuide}
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-lime transition-colors"
      >
        <HelpCircle size={12} />
        Instruções
      </button>
      <GuideModal
        guideKey="faturas_cobranca"
        open={guide.open}
        onClose={guide.close}
        onDismissForever={guide.dismissForever}
      />
    </>
  )
}
