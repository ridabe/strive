'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Undo2, XCircle } from 'lucide-react'
import { registerPayment, undoPayment, cancelCharge } from '@/actions/student-billing'

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'pix_manual',     label: 'PIX' },
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'transferencia',  label: 'Transferência' },
  { value: 'cartao_manual',  label: 'Cartão (maquininha)' },
  { value: 'outro',          label: 'Outro' },
]

type Props = {
  chargeId: string
  status: string
}

export function PaymentActions({ chargeId, status }: Props) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState('pix_manual')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleConfirmPayment() {
    const formData = new FormData()
    formData.set('charge_id', chargeId)
    formData.set('payment_method', method)
    startTransition(async () => {
      const result = await registerPayment(formData)
      if (result?.error) { alert(result.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  function handleUndo() {
    if (!confirm('Desfazer esta baixa?')) return
    startTransition(async () => {
      const result = await undoPayment(chargeId)
      if (result?.error) { alert(result.error); return }
      router.refresh()
    })
  }

  function handleCancel() {
    if (!confirm('Cancelar esta cobrança? Ela deixa de contar como pendente/atrasada.')) return
    startTransition(async () => {
      const result = await cancelCharge(chargeId)
      if (result?.error) { alert(result.error); return }
      router.refresh()
    })
  }

  if (status === 'paid') {
    return (
      <button
        onClick={handleUndo}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs font-body font-medium text-text-secondary hover:text-status-error transition-colors disabled:opacity-50"
      >
        <Undo2 size={12} />
        Desfazer
      </button>
    )
  }

  if (status !== 'pending' && status !== 'overdue') return null

  if (!open) {
    return (
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-body font-medium text-status-success hover:text-status-success/80 transition-colors"
        >
          <CheckCircle2 size={12} />
          Dar baixa
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-body font-medium text-text-secondary hover:text-status-error transition-colors disabled:opacity-50"
        >
          <XCircle size={12} />
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="bg-background border border-surface-border rounded-lg px-1.5 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-lime/60"
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <button
        onClick={handleConfirmPayment}
        disabled={isPending}
        className="text-xs font-body font-semibold text-status-success hover:text-status-success/80 transition-colors disabled:opacity-50"
      >
        {isPending ? '...' : 'OK'}
      </button>
      <button
        onClick={() => setOpen(false)}
        disabled={isPending}
        className="text-xs font-body text-text-secondary hover:text-text-primary transition-colors"
      >
        Cancelar
      </button>
    </div>
  )
}
