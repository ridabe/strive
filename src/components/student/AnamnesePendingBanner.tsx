'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FileHeart, X } from 'lucide-react'

interface Props {
  hasTemplates: boolean
  isCompleted: boolean
}

/**
 * Mantem visivel no web do aluno um aviso enquanto a anamnese nao for finalizada.
 * Reaparece a cada novo acesso (layout re-renderiza no servidor a cada login/hard nav).
 */
export function AnamnesePendingBanner({ hasTemplates, isCompleted }: Props) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [hasTemplates, isCompleted])

  if (!hasTemplates || isCompleted || dismissed) return null

  return (
    <div className="bg-rose-400/10 border-b border-rose-400/20 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 min-w-0">
        <FileHeart size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-rose-300">
          Sua anamnese ainda não foi preenchida. Complete sua ficha de saúde para seu personal te acompanhar melhor.
        </p>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Link
          href="/student/anamnese"
          className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors whitespace-nowrap border border-rose-400/30 rounded-lg px-2.5 py-1 flex-shrink-0"
        >
          Preencher agora →
        </Link>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={() => setDismissed(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-400/20 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
