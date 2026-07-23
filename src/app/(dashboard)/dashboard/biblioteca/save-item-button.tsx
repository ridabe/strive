'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleContentLibraryItemSave } from '@/actions/content-library'

interface Props {
  itemId: string
  tenantId: string
  saved: boolean
}

export function SaveItemButton({ itemId, tenantId, saved }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()

  function handle() {
    start(async () => {
      await toggleContentLibraryItemSave(itemId, tenantId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      title={saved ? 'Remover dos salvos' : 'Salvar'}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg border transition-colors disabled:opacity-50',
        saved
          ? 'bg-brand-lime/10 border-brand-lime/30 text-brand-lime'
          : 'bg-surface border-surface-border text-text-secondary hover:text-text-primary',
      )}
    >
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />}
    </button>
  )
}
