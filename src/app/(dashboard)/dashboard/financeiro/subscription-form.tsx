'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import {
  upsertStudentSubscription,
  createPackageSubscription,
  deactivateStudentSubscription,
} from '@/actions/student-billing'
import type { BillingType } from '@/types/db-enums'

type StudentOption = { id: string; full_name: string }

type Subscription = {
  id: string
  student_id: string
  plan_name: string
  amount: number
  due_day: number
  active: boolean
  billing_type: BillingType
  total_installments: number | null
  paidInstallments?: number
}

// ── Criar nova cobrança (aluno ainda sem uma): recorrente ou pacote de N meses
export function NewSubscriptionForm({ students }: { students: StudentOption[] }) {
  const [open, setOpen] = useState(false)
  const [billingType, setBillingType] = useState<BillingType>('recorrente')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!students.length) return null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-brand-lime text-background font-body font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-lime/90 transition-colors"
      >
        <Plus size={15} />
        Nova cobrança
      </button>
    )
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result =
        billingType === 'pacote'
          ? await createPackageSubscription(formData)
          : await upsertStudentSubscription(formData)
      if (result?.error) { alert(result.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="bg-surface border border-surface-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-1 bg-background border border-surface-border rounded-lg p-1 w-fit">
        {([
          { value: 'recorrente' as const, label: 'Mensalidade recorrente' },
          { value: 'pacote' as const,     label: 'Pacote de meses' },
        ]).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setBillingType(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors ${
              billingType === opt.value
                ? 'bg-brand-lime/10 text-brand-lime'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-3 ${billingType === 'pacote' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <select
          name="student_id"
          required
          className="bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60"
        >
          <option value="">Selecione o aluno</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder={billingType === 'pacote' ? 'Valor por mês (R$)' : 'Valor (R$)'}
          className="bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60"
        />
        <input
          name="due_day"
          type="number"
          min="1"
          max="28"
          required
          placeholder="Dia do vencimento (1-28)"
          className="bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60"
        />
        {billingType === 'pacote' && (
          <input
            name="total_installments"
            type="number"
            min="1"
            max="24"
            required
            placeholder="Nº de meses (ex: 6)"
            className="bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60"
          />
        )}
      </div>

      {billingType === 'pacote' && (
        <p className="text-xs text-text-secondary">
          Gera todas as parcelas do pacote de uma vez. Cada mês é dado baixa individualmente; você é avisado para renovar só quando o pacote inteiro for quitado.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-lime text-background font-body font-semibold text-sm px-4 py-2 rounded-lg hover:bg-brand-lime/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Editar/desativar assinatura existente ────────────────────────────────────
export function SubscriptionRow({ subscription, studentName }: { subscription: Subscription; studentName: string }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    formData.set('student_id', subscription.student_id)
    startTransition(async () => {
      const result = await upsertStudentSubscription(formData)
      if (result?.error) { alert(result.error); return }
      setEditing(false)
      router.refresh()
    })
  }

  function handleDeactivate() {
    if (!confirm(`Encerrar a mensalidade recorrente de "${studentName}"? As cobranças já geradas continuam no histórico.`)) return
    startTransition(async () => {
      const result = await deactivateStudentSubscription(subscription.id)
      if (result?.error) { alert(result.error); return }
      router.refresh()
    })
  }

  if (editing) {
    return (
      <tr className="bg-background/40">
        <td colSpan={4} className="px-5 py-3.5">
          <form action={handleSubmit} className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-primary font-medium mr-2">{studentName}</span>
            <input
              name="plan_name"
              defaultValue={subscription.plan_name}
              className="bg-background border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary w-32"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={subscription.amount}
              required
              className="bg-background border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary w-24"
            />
            <input
              name="due_day"
              type="number"
              min="1"
              max="28"
              defaultValue={subscription.due_day}
              required
              className="bg-background border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary w-20"
            />
            <button type="submit" disabled={isPending} className="text-xs font-semibold text-brand-lime disabled:opacity-50">
              {isPending ? '...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-text-secondary">
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    )
  }

  const isPacote = subscription.billing_type === 'pacote'
  const total = subscription.total_installments ?? 0
  const paid = subscription.paidInstallments ?? 0
  const packageDone = isPacote && total > 0 && paid >= total

  return (
    <tr className="hover:bg-surface-border/10">
      <td className="px-5 py-3.5 text-text-primary font-medium truncate max-w-[160px]">{studentName}</td>
      <td className="px-5 py-3.5 text-text-secondary hidden sm:table-cell">
        {subscription.plan_name}
        {isPacote && (
          <span
            className={`ml-2 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
              packageDone
                ? 'text-status-warning bg-status-warning/10 border-status-warning/20'
                : 'text-text-secondary bg-background border-surface-border'
            }`}
          >
            Pacote {paid}/{total}{packageDone ? ' · renovar' : ''}
          </span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right text-text-primary font-medium">
        R$ {subscription.amount.toFixed(2).replace('.', ',')} <span className="text-text-secondary font-normal">/ dia {subscription.due_day}</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setEditing(true)} className="text-xs font-body font-medium text-text-secondary hover:text-brand-lime transition-colors">
            Editar
          </button>
          <button onClick={handleDeactivate} disabled={isPending} className="text-xs font-body font-medium text-text-secondary hover:text-status-error transition-colors disabled:opacity-50">
            Encerrar
          </button>
        </div>
      </td>
    </tr>
  )
}
