'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, X, Loader2 } from 'lucide-react'
import { publishChallengeResults } from '@/app/actions/challenges'

interface Props {
  challengeId: string
}

export function PublishResultsButton({ challengeId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    setOpen(false)
    setError('')
  }

  function handlePublish() {
    setError('')
    startTransition(async () => {
      const result = await publishChallengeResults(challengeId, showDetails)
      if (result.error) { setError(result.error); return }
      handleClose()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        <Megaphone size={15} />
        Publicar Resultados
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Publicar Resultados
              </h2>
              <button onClick={handleClose} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-text-secondary">
              O ranking final ficará visível para todos os participantes.
            </p>

            <label className="flex items-start gap-3 cursor-pointer group bg-background border border-surface-border rounded-xl p-3">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border border-surface-border accent-brand-lime"
              />
              <div>
                <p className="text-sm font-medium text-text-primary group-hover:text-brand-lime transition-colors">
                  Mostrar peso e % de gordura de início e fim
                </p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  Se desmarcado, os alunos veem apenas a posição no ranking, sem os números.
                </p>
              </div>
            </label>

            {error && <p className="text-sm text-status-error">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublish}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
