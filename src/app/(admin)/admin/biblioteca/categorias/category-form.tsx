'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { createContentLibraryCategory } from '@/actions/content-library'

const KIND_OPTIONS = [
  { value: 'arte', label: 'Arte' },
  { value: 'material', label: 'Material de apoio' },
  { value: 'estudo', label: 'Estudo' },
] as const

export function CategoryForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [kind, setKind] = useState<string>('arte')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createContentLibraryCategory(fd)
      if (result.error) { setError(result.error); return }
      formRef.current?.reset()
      setKind('arte')
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          name="name"
          required
          placeholder="Nome da categoria (ex: Emagrecimento)"
          className="flex-1 bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
        />
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
        >
          {KIND_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90 whitespace-nowrap"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Adicionar
        </button>
      </div>
      {error && <p className="text-sm text-status-error">{error}</p>}
    </form>
  )
}
