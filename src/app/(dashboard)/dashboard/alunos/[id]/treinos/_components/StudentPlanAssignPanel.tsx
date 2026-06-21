'use client'

import { useState, useTransition } from 'react'
import { Check, Target } from 'lucide-react'
import { assignPlanToStudents } from '@/actions/plan-assignments'

type Plan = { id: string; name: string; goal: string | null; status: string }

const GOAL_COLOR: Record<string, string> = {
  'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Força':          'text-red-400 bg-red-400/10 border-red-400/20',
  'Resistência':    'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  'Condicionamento':'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Reabilitação':   'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

export function StudentPlanAssignPanel({
  studentId,
  availablePlans,
}: {
  studentId:      string
  availablePlans: Plan[]
}) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected]      = useState<string[]>([])
  const [error,    setError]         = useState('')
  const [done,     setDone]          = useState(false)

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function handleAssign() {
    if (selected.length === 0) { setError('Selecione ao menos um plano'); return }
    setError('')
    startTransition(async () => {
      const result = await assignPlanToStudents(selected[0]!, [studentId])
      // assign multiple one by one if needed
      for (const planId of selected.slice(1)) {
        await assignPlanToStudents(planId, [studentId])
      }
      if ('error' in result && result.error) { setError(result.error); return }
      setDone(true)
      setSelected([])
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 bg-status-success/10 border border-status-success/20 rounded-xl px-4 py-3">
        <Check size={14} className="text-status-success" />
        <p className="text-sm text-status-success font-medium">Plano(s) atribuído(s) com sucesso!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {availablePlans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => toggle(plan.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
              selected.includes(plan.id)
                ? 'border-brand-lime bg-brand-lime/5'
                : 'border-surface-border bg-surface hover:border-surface-border/60'
            }`}
          >
            <div className={`w-4 h-4 rounded border flex-shrink-0 transition-colors ${
              selected.includes(plan.id) ? 'bg-brand-lime border-brand-lime' : 'border-surface-border'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{plan.name}</p>
              {plan.goal && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border mt-0.5 ${
                  GOAL_COLOR[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
                }`}>
                  <Target size={8} />
                  {plan.goal}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleAssign}
        disabled={isPending || selected.length === 0}
        className="w-full py-3 bg-brand-lime text-background font-semibold text-sm rounded-xl hover:bg-brand-lime/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Atribuindo...' : `Atribuir ${selected.length > 0 ? `(${selected.length})` : ''}`}
      </button>
    </div>
  )
}
