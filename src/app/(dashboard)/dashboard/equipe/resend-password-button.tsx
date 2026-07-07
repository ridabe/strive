'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { resendMemberPassword } from '@/actions/tenant-members'

type Props = {
  tenantMemberId: string
  memberName: string
}

export function ResendPasswordButton({ tenantMemberId, memberName }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleResend() {
    if (!confirm(`Gerar uma nova senha provisória para "${memberName}" e enviar por e-mail?`)) return

    startTransition(async () => {
      const result = await resendMemberPassword(tenantMemberId)
      if (result?.error) {
        alert(result.error)
        return
      }
      alert('Nova senha provisória enviada por e-mail.')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleResend}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-xs font-body font-medium text-text-secondary hover:text-brand-lime transition-colors disabled:opacity-50"
    >
      <KeyRound size={13} />
      {isPending ? 'Enviando...' : 'Reenviar senha'}
    </button>
  )
}
