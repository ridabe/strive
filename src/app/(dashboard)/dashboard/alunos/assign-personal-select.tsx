'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignStudentToPersonal } from '@/actions/tenant-members'

type Option = { id: string; label: string }

type Props = {
  studentId: string
  currentAssignedId: string | null
  options: Option[]
}

// Dropdown de atribuição de personal — só renderizado para owner/admin de uma
// academia (ver alunos/page.tsx). Alunos "não atribuídos" ficam com valor "".
export function AssignPersonalSelect({ studentId, currentAssignedId, options }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null
    startTransition(async () => {
      const result = await assignStudentToPersonal(studentId, value)
      if (result?.error) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <select
      defaultValue={currentAssignedId ?? ''}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs bg-background border border-surface-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-brand-lime/60 disabled:opacity-50"
    >
      <option value="">Não atribuído</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>{opt.label}</option>
      ))}
    </select>
  )
}
