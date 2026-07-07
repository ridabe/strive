'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react'
import { registerInventoryMovement } from '@/app/actions/estoque'

interface Props {
  itemId: string
  unit: string
}

const TYPES: { value: 'entrada' | 'saida' | 'ajuste'; label: string; icon: typeof ArrowDownCircle }[] = [
  { value: 'entrada', label: 'Entrada', icon: ArrowDownCircle },
  { value: 'saida',   label: 'Saída',   icon: ArrowUpCircle   },
  { value: 'ajuste',  label: 'Ajuste',  icon: SlidersHorizontal },
]

const FIELD = 'w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime transition-colors'
const LABEL = 'block text-xs font-body font-medium text-text-secondary uppercase tracking-widest mb-1.5'

export function RegisterMovementForm({ itemId, unit }: Props) {
  const router = useRouter()
  const [type, setType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada')
  const [error, setError] = useState('')
  const [isPending, start] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const fd = new FormData(e.currentTarget)
    const quantity = Number(fd.get('quantity'))
    const reason = (fd.get('reason') as string | null) ?? undefined

    start(async () => {
      const result = await registerInventoryMovement(itemId, type, quantity, reason)
      if (result.error) { setError(result.error); return }
      router.refresh()
      ;(document.getElementById('movement-form') as HTMLFormElement | null)?.reset()
    })
  }

  return (
    <form id="movement-form" onSubmit={handleSubmit} className="space-y-4 bg-surface border border-surface-border rounded-xl p-5">
      <p className="text-sm font-body font-medium text-text-primary">Registrar movimento</p>

      <div className="flex gap-2">
        {TYPES.map((t) => {
          const Icon = t.icon
          const active = type === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                active
                  ? 'bg-brand-lime/10 text-brand-lime border-brand-lime/20'
                  : 'bg-background text-text-secondary border-surface-border hover:text-text-primary'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>
            {type === 'ajuste' ? `Novo valor (${unit})` : `Quantidade (${unit})`}
          </label>
          <input name="quantity" type="number" min={0} step="any" required className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Motivo</label>
          <input name="reason" placeholder="ex: Compra, uso interno..." className={FIELD} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-3">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        Registrar
      </button>
    </form>
  )
}
