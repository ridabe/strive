'use client'

import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useTransition } from 'react'

/**
 * Recarrega os dados analiticos do dashboard sem depender de navegacao manual.
 */
export function IARefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-violet-400/30 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
    >
      <RefreshCw size={15} className={isPending ? 'animate-spin' : ''} />
      {isPending ? 'Atualizando...' : 'Recarregar dados'}
    </button>
  )
}
