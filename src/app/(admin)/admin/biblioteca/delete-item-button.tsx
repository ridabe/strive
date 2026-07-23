'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteContentLibraryItem } from '@/actions/content-library'

function pathFromPublicUrl(url: string | null): string | null {
  if (!url) return null
  const marker = '/content-library/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

interface Props { id: string; title: string; thumbnailUrl: string | null; fileUrl: string | null }

export function DeleteItemButton({ id, title, thumbnailUrl, fileUrl }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()

  function handle() {
    if (!confirm(`Excluir o item "${title}"?`)) return
    const paths = [pathFromPublicUrl(thumbnailUrl), pathFromPublicUrl(fileUrl)].filter((p): p is string => !!p)
    start(async () => {
      await deleteContentLibraryItem(id, paths)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="text-text-secondary hover:text-status-error transition-colors disabled:opacity-40"
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  )
}
