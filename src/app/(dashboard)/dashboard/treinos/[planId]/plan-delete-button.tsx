'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteWorkoutPlan } from '@/actions/workout-plans'

type Props = {
  planId: string
  planName: string
  assignedCount: number
}

export function PlanDeleteButton({ planId, planName, assignedCount }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    const warning = assignedCount > 0
      ? `Excluir "${planName}"? Isso vai desvincular ${assignedCount} aluno${assignedCount !== 1 ? 's' : ''} deste plano. Esta ação não pode ser desfeita.`
      : `Excluir "${planName}"? Esta ação não pode ser desfeita.`
    if (!confirm(warning)) return

    startTransition(async () => {
      const result = await deleteWorkoutPlan(planId)
      if (result?.error) {
        alert(result.error)
        return
      }
      router.push('/dashboard/treinos')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-xs font-body font-medium text-text-secondary hover:text-status-error transition-colors disabled:opacity-50"
    >
      <Trash2 size={13} />
      {isPending ? 'Excluindo...' : 'Excluir plano'}
    </button>
  )
}
