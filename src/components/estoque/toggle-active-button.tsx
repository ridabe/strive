'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Power } from 'lucide-react'
import { toggleInventoryItemActive } from '@/app/actions/estoque'

interface Props {
  itemId: string
  isActive: boolean
}

export function ToggleActiveButton({ itemId, isActive }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()

  function handleToggle() {
    const confirmMsg = isActive
      ? 'Desativar este item? Ele deixará de aparecer na lista padrão de estoque.'
      : 'Reativar este item?'
    if (!confirm(confirmMsg)) return

    start(async () => {
      await toggleInventoryItemActive(itemId, !isActive)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${
        isActive
          ? 'text-text-secondary border-surface-border hover:text-status-error hover:border-status-error/30'
          : 'text-brand-lime border-brand-lime/20 bg-brand-lime/10'
      }`}
    >
      <Power size={13} />
      {isActive ? 'Desativar' : 'Reativar'}
    </button>
  )
}
