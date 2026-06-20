'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteExercise } from '@/app/actions/exercises'

interface Props {
  id: string
  videoPath?: string | null
}

export function DeleteExerciseButton({ id, videoPath }: Props) {
  const [isPending, start] = useTransition()

  function handleDelete() {
    if (!confirm('Remover exercício? Esta ação não pode ser desfeita.')) return
    start(async () => { await deleteExercise(id, videoPath) })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-text-secondary hover:text-status-error transition-colors disabled:opacity-40"
    >
      <Trash2 size={14} />
    </button>
  )
}
