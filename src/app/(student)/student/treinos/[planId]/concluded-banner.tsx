'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export function ConcludedBanner() {
  const params = useSearchParams()
  if (params.get('concluido') !== '1') return null
  return (
    <div className="flex items-center gap-3 bg-brand-lime/10 border border-brand-lime/20 rounded-xl px-4 py-3">
      <CheckCircle2 size={18} className="text-brand-lime flex-shrink-0" />
      <p className="text-sm font-medium text-brand-lime">Treino salvo com sucesso! Parabéns!</p>
    </div>
  )
}
