'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteGlobalExercise } from '@/app/actions/exercises'

interface Props { id: string; videoPath?: string | null }

export function DeleteGlobalExerciseButton({ id, videoPath }: Props) {
  const [isPending, start] = useTransition()

  function handle() {
    if (!confirm('Remover exercício global? Todos os tenants perderão acesso.')) return
    start(async () => { await deleteGlobalExercise(id, videoPath) })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="text-text-secondary hover:text-status-error transition-colors disabled:opacity-40"
    >
      <Trash2 size={14} />
    </button>
  )
}
