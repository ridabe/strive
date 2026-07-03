'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, X, Loader2 } from 'lucide-react'
import { updateParticipantFinalData, type ChallengeParticipant } from '@/app/actions/challenges'

interface Props {
  challengeId: string
  participant: ChallengeParticipant
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null
  const n = parseFloat(String(v))
  return isNaN(n) ? null : n
}

export function FinalDataButton({ challengeId, participant }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
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

    startTransition(async () => {
      const result = await updateParticipantFinalData(participant.id, challengeId, {
        final_weight: numOrNull(fd.get('final_weight')),
        final_body_fat: numOrNull(fd.get('final_body_fat')),
        final_arm: numOrNull(fd.get('final_arm')),
        final_chest: numOrNull(fd.get('final_chest')),
        final_waist: numOrNull(fd.get('final_waist')),
        final_hip: numOrNull(fd.get('final_hip')),
        final_thigh: numOrNull(fd.get('final_thigh')),
        final_notes: String(fd.get('final_notes') ?? '') || null,
      })

      if (result.error) { setError(result.error); return }
      handleClose()
      router.refresh()
    })
  }

  const hasFinalData = participant.final_weight != null || participant.final_body_fat != null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
          hasFinalData
            ? 'border-brand-lime/20 text-brand-lime bg-brand-lime/10'
            : 'border-surface-border text-text-secondary hover:text-brand-lime hover:border-brand-lime/30'
        }`}
      >
        <ClipboardCheck size={13} />
        {hasFinalData ? 'Dados finais ✓' : 'Dados finais'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Dados Finais
              </h2>
              <button onClick={handleClose} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase">Peso (kg)</label>
                  <input
                    name="final_weight"
                    type="number"
                    step="0.1"
                    min={0}
                    defaultValue={participant.final_weight ?? ''}
                    className="w-full bg-background border border-surface-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase">% Gordura</label>
                  <input
                    name="final_body_fat"
                    type="number"
                    step="0.1"
                    min={0}
                    defaultValue={participant.final_body_fat ?? ''}
                    className="w-full bg-background border border-surface-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                  />
                </div>
              </div>

              <p className="text-[11px] text-text-secondary/60">Medidas abaixo são opcionais.</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'final_arm', label: 'Braço', value: participant.final_arm },
                  { name: 'final_chest', label: 'Peito', value: participant.final_chest },
                  { name: 'final_waist', label: 'Cintura', value: participant.final_waist },
                  { name: 'final_hip', label: 'Quadril', value: participant.final_hip },
                  { name: 'final_thigh', label: 'Coxa', value: participant.final_thigh },
                ].map((f) => (
                  <div key={f.name} className="space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">{f.label}</label>
                    <input
                      name={f.name}
                      type="number"
                      step="0.1"
                      min={0}
                      defaultValue={f.value ?? ''}
                      className="w-full bg-background border border-surface-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Considerações finais <span className="text-text-secondary/50">(opcional)</span>
                </label>
                <textarea
                  name="final_notes"
                  rows={3}
                  defaultValue={participant.final_notes ?? ''}
                  placeholder="Observações sobre a evolução deste participante..."
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime transition-colors resize-none"
                />
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
