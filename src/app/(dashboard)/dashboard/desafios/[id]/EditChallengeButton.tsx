'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X, Loader2 } from 'lucide-react'
import { updateChallenge, type Challenge, type ReleaseMode } from '@/app/actions/challenges'

interface Props {
  challenge: Challenge
}

export function EditChallengeButton({ challenge }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [releaseMode, setReleaseMode] = useState<ReleaseMode>(challenge.release_mode)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleClose() {
    setOpen(false)
    setError('')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const durationDays = Number(fd.get('duration_days'))

    if (!durationDays || durationDays < 1) {
      setError('Informe uma duração válida em dias.')
      return
    }

    startTransition(async () => {
      const result = await updateChallenge(challenge.id, {
        name: String(fd.get('name') ?? ''),
        description: String(fd.get('description') ?? '') || null,
        rules: String(fd.get('rules') ?? '') || null,
        prizes: String(fd.get('prizes') ?? '') || null,
        duration_days: durationDays,
        release_mode: releaseMode,
      })

      if (result.error) { setError(result.error); return }
      handleClose()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-text-secondary text-xs font-medium hover:text-brand-lime hover:border-brand-lime/30 transition-colors whitespace-nowrap"
      >
        <Pencil size={13} />
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Editar Desafio
              </h2>
              <button onClick={handleClose} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Nome do desafio
                </label>
                <input
                  name="name"
                  required
                  defaultValue={challenge.name}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Descrição
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={challenge.description ?? ''}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Duração (dias)
                </label>
                <input
                  name="duration_days"
                  type="number"
                  min={1}
                  max={365}
                  required
                  defaultValue={challenge.duration_days}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Regras
                </label>
                <textarea
                  name="rules"
                  rows={3}
                  defaultValue={challenge.rules ?? ''}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Premiações
                </label>
                <textarea
                  name="prizes"
                  rows={2}
                  defaultValue={challenge.prizes ?? ''}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Liberação dos dias
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReleaseMode('progressive')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      releaseMode === 'progressive'
                        ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                        : 'bg-background border border-surface-border text-text-secondary'
                    }`}
                  >
                    Progressiva
                  </button>
                  <button
                    type="button"
                    onClick={() => setReleaseMode('all_at_once')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      releaseMode === 'all_at_once'
                        ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                        : 'bg-background border border-surface-border text-text-secondary'
                    }`}
                  >
                    Tudo de uma vez
                  </button>
                </div>
              </div>

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
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
