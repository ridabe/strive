'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { createChallengeDay } from '@/app/actions/challenges'

interface Props {
  challengeId: string
  nextDayNumber: number
}

export function AddDayButton({ challengeId, nextDayNumber }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleClose() {
    setOpen(false)
    setError('')
    formRef.current?.reset()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createChallengeDay(challengeId, {
        day_number: Number(fd.get('day_number')),
        title: String(fd.get('title') ?? '') || null,
        release_date: String(fd.get('release_date') ?? '') || null,
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
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        <Plus size={15} />
        Adicionar Dia
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Adicionar Dia
              </h2>
              <button onClick={handleClose} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Número do dia
                </label>
                <input
                  name="day_number"
                  type="number"
                  min={1}
                  required
                  defaultValue={nextDayNumber}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Título <span className="text-text-secondary/50">(opcional)</span>
                </label>
                <input
                  name="title"
                  placeholder="Ex: Início — avaliação e aquecimento"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Data prevista <span className="text-text-secondary/50">(opcional)</span>
                </label>
                <input
                  name="release_date"
                  type="date"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                />
                <p className="text-[11px] text-text-secondary/60">
                  Apenas para sua organização — a liberação ao participante é manual.
                </p>
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
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
