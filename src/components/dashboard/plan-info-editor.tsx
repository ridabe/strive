'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X, Check, Loader2 } from 'lucide-react'
import { updateWorkoutPlan } from '@/actions/workout-plans'

const GOALS = ['Hipertrofia', 'Emagrecimento', 'Resistência', 'Força', 'Condicionamento', 'Reabilitação']

type Props = {
  planId: string
  name: string
  goal: string | null
  description: string | null
  startDate: string | null
  endDate: string | null
}

export function PlanInfoEditor({ planId, name, goal, description, startDate, endDate }: Props) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateWorkoutPlan(planId, formData)
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-lime transition-colors"
      >
        <Pencil size={12} /> Editar informações
      </button>
    )
  }

  return (
    <form
      action={handleSubmit}
      className="bg-background border border-surface-border rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Editar plano</p>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-text-secondary hover:text-text-primary"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Nome do plano *</label>
        <input
          name="name"
          required
          defaultValue={name}
          className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Objetivo</label>
        <select
          name="goal"
          defaultValue={goal ?? ''}
          className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
        >
          <option value="">Selecionar objetivo...</option>
          {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Observações gerais</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={description ?? ''}
          className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Início</label>
          <input
            name="start_date"
            type="date"
            defaultValue={startDate ?? ''}
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Término</label>
          <input
            name="end_date"
            type="date"
            defaultValue={endDate ?? ''}
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
          />
        </div>
      </div>
      <p className="text-[11px] text-text-secondary/60">Início e término são opcionais — deixe em branco se o plano não tem duração definida.</p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-lg bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-xs hover:bg-brand-lime/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        Salvar
      </button>
    </form>
  )
}
