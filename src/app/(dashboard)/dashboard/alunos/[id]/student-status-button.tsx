'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserX, UserCheck } from 'lucide-react'
import { updateStudent } from '@/actions/students'

type Props = {
  studentId: string
  studentName: string
  status: 'active' | 'inactive'
}

export function StudentStatusButton({ studentId, studentName, status }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isActive = status === 'active'

  function handleToggle() {
    const warning = isActive
      ? `Excluir "${studentName}" da sua mentoria? Ele deixará de ter acesso aos treinos e dados deste estúdio, mas nada é apagado — o histórico fica guardado e pode ser reativado depois.`
      : `Reativar "${studentName}"? Ele volta a ter acesso normal ao seu estúdio.`
    if (!confirm(warning)) return

    startTransition(async () => {
      const result = await updateStudent(studentId, { status: isActive ? 'inactive' : 'active' })
      if (result?.error) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 text-xs font-body font-medium transition-colors disabled:opacity-50 ${
        isActive
          ? 'text-text-secondary hover:text-status-error'
          : 'text-text-secondary hover:text-status-success'
      }`}
    >
      {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
      {isPending ? 'Salvando...' : isActive ? 'Excluir aluno' : 'Reativar aluno'}
    </button>
  )
}
