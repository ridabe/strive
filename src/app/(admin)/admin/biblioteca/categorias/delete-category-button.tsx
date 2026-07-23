'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteContentLibraryCategory } from '@/actions/content-library'

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [isPending, start] = useTransition()

  function handle() {
    if (!confirm(`Excluir a categoria "${name}"? Os itens dela também serão removidos.`)) return
    start(async () => {
      await deleteContentLibraryCategory(id)
      router.refresh()
    })
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
