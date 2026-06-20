'use client'

import { useTransition } from 'react'
import { Link2, X, Loader2 } from 'lucide-react'
import { groupWorkoutItems } from '@/actions/workout-items'

type ComboType = 'biset' | 'triset' | 'circuit'

type Props = {
  open: boolean
  selectedIds: string[]
  onClose: () => void
  onSuccess: () => void
}

const COMBO_OPTIONS: { value: ComboType; label: string; desc: string }[] = [
  { value: 'biset',   label: 'Bi-set',   desc: '2 exercícios sem pausa entre eles' },
  { value: 'triset',  label: 'Tri-set',  desc: '3 exercícios consecutivos' },
  { value: 'circuit', label: 'Circuito', desc: '4+ exercícios em sequência' },
]

export function CombineModal({ open, selectedIds, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleCombine(type: ComboType) {
    startTransition(async () => {
      const result = await groupWorkoutItems(selectedIds, type)
      if (!result.error) {
        onSuccess()
        onClose()
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-surface-border rounded-2xl shadow-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center">
            <Link2 size={16} className="text-brand-lime" />
          </div>
          <div>
            <p className="font-display font-bold text-text-primary text-sm uppercase tracking-widest">
              Combinar Exercícios
            </p>
            <p className="text-xs text-text-secondary">{selectedIds.length} exercícios selecionados</p>
          </div>
          <button onClick={onClose} className="ml-auto text-text-secondary hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {COMBO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleCombine(opt.value)}
              disabled={isPending}
              className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-surface-border hover:border-brand-lime/40 hover:bg-brand-lime/5 text-left transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-lime/20 transition-colors">
                {isPending
                  ? <Loader2 size={13} className="text-brand-lime animate-spin" />
                  : <Link2 size={13} className="text-brand-lime" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary group-hover:text-brand-lime transition-colors">
                  {opt.label}
                </p>
                <p className="text-xs text-text-secondary">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
