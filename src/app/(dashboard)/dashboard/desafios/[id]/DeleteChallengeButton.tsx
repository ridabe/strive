'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteChallenge } from '@/app/actions/challenges'

interface Props {
  challengeId: string
  challengeName: string
  isActive: boolean
}

export function DeleteChallengeButton({ challengeId, challengeName, isActive }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    const warning = `Excluir "${challengeName}"? Todos os dias, itens, participantes e mensagens serão apagados. Esta ação não pode ser desfeita.`
    if (!confirm(warning)) return

    startTransition(async () => {
      const result = await deleteChallenge(challengeId)
      if (result?.error) {
        alert(result.error)
        return
      }
      router.push('/dashboard/desafios')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending || isActive}
      title={isActive ? 'Finalize o desafio antes de excluí-lo — não é possível excluir um desafio ativo.' : undefined}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-text-secondary text-xs font-medium hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-40 disabled:hover:text-text-secondary disabled:hover:border-surface-border disabled:cursor-not-allowed whitespace-nowrap"
    >
      <Trash2 size={13} />
      {isPending ? 'Excluindo...' : 'Excluir'}
    </button>
  )
}
