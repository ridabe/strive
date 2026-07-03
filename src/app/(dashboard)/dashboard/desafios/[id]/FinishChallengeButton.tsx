'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Loader2 } from 'lucide-react'
import { finishChallenge } from '@/app/actions/challenges'

interface Props {
  challengeId: string
}

export function FinishChallengeButton({ challengeId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleFinish() {
    const warning = 'Finalizar o desafio? O ranking será calculado com os dados finais já preenchidos. Você ainda poderá revisar antes de publicar aos alunos.'
    if (!confirm(warning)) return

    startTransition(async () => {
      const result = await finishChallenge(challengeId)
      if (result?.error) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleFinish}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
    >
      {isPending ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
      Finalizar Desafio
    </button>
  )
}
