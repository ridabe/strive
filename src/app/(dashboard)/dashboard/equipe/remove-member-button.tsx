'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserMinus } from 'lucide-react'
import { removeTenantMember } from '@/actions/tenant-members'

type Props = {
  tenantMemberId: string
  memberName: string
}

export function RemoveMemberButton({ tenantMemberId, memberName }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRemove() {
    if (!confirm(`Remover "${memberName}" da equipe?`)) return

    startTransition(async () => {
      const result = await removeTenantMember(tenantMemberId)
      if (result?.error) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-xs font-body font-medium text-text-secondary hover:text-status-error transition-colors disabled:opacity-50"
    >
      <UserMinus size={13} />
      {isPending ? 'Removendo...' : 'Remover'}
    </button>
  )
}
