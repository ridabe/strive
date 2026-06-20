'use client'

import { useState, useTransition, useRef } from 'react'
import { createProgressEntry, deleteProgressEntry } from '@/app/actions/progress'
import {
  Plus, X, Save, Loader2, Trash2, ChevronDown, ChevronUp,
  ImagePlus, Scale, StickyNote,
} from 'lucide-react'
import Image from 'next/image'

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface ProgressEntry {
  id: string
  recorded_at: string
  weight: number | null
  notes: string | null
  photo_urls: string[]
  created_at: string
}

// ─── Formulário de novo registro ──────────────────────────────────────────────
export function NewProgressForm() {
  const [open, setOpen]           = useState(false)
  const [previews, setPreviews]   = useState<string[]>([])
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef  = useRef<HTMLFormElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  function removePreview(idx: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
    // Limpa o input de arquivo — usuário reseleciona se quiser
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await createProgressEntry(fd)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
        setPreviews([])
        formRef.current?.reset()
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-body font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus size={15} />
        Novo Registro
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-surface border border-brand-lime/30 rounded-xl p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-body font-semibold text-sm text-text-primary">
          Novo Registro de Progresso
        </h2>
        <button
          type="button"
          onClick={() => { setOpen(false); setPreviews([]) }}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Data */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">Data</label>
        <input
          type="date"
          name="recorded_at"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
          className="bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
        />
      </div>

      {/* Peso */}
      <div>
        <label className="flex items-center gap-1.5 text-xs text-text-secondary mb-1.5">
          <Scale size={12} />
          Peso (kg) — opcional
        </label>
        <input
          type="number"
          name="weight"
          step="0.1"
          min="0"
          max="500"
          placeholder="Ex: 75.5"
          className="w-40 bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 placeholder:text-text-secondary/40"
        />
      </div>

      {/* Notas */}
      <div>
        <label className="flex items-center gap-1.5 text-xs text-text-secondary mb-1.5">
          <StickyNote size={12} />
          Notas pessoais — opcional
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Como você está se sentindo? Alguma conquista hoje?"
          className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 placeholder:text-text-secondary/40 resize-none"
        />
      </div>

      {/* Fotos */}
      <div>
        <label className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
          <ImagePlus size={12} />
          Fotos de progresso — até 5 imagens, máx. 5 MB cada
        </label>

        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-border group">
                <Image
                  src={src}
                  alt={`Preview ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X size={16} className="text-status-error" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 w-fit cursor-pointer px-3 py-2 rounded-lg border border-dashed border-surface-border hover:border-brand-lime/40 text-xs text-text-secondary hover:text-text-primary transition-colors">
          <ImagePlus size={14} />
          {previews.length === 0 ? 'Adicionar fotos' : 'Trocar fotos'}
          <input
            ref={fileRef}
            type="file"
            name="photos"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={() => { setOpen(false); setPreviews([]) }}
          className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar
        </button>
      </div>
    </form>
  )
}

// ─── Card de entrada de progresso ─────────────────────────────────────────────
export function ProgressEntryCard({ entry }: { entry: ProgressEntry }) {
  const [expanded, setExpanded]      = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm('Excluir este registro? Esta ação não pode ser desfeita.')) return
    startTransition(async () => {
      await deleteProgressEntry(entry.id)
    })
  }

  const hasExtra = entry.notes || entry.photo_urls.length > 0

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      {/* Linha principal */}
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Data */}
          <div className="flex-shrink-0 text-center bg-background border border-surface-border rounded-lg px-3 py-2 min-w-[56px]">
            <p className="text-xs text-text-secondary leading-none">
              {new Date(entry.recorded_at + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
            </p>
            <p className="font-display font-bold text-lg text-text-primary leading-tight">
              {new Date(entry.recorded_at + 'T12:00:00').getDate()}
            </p>
            <p className="text-xs text-text-secondary leading-none">
              {new Date(entry.recorded_at + 'T12:00:00').getFullYear()}
            </p>
          </div>

          {/* Dados resumidos */}
          <div className="min-w-0">
            {entry.weight !== null && (
              <p className="font-body font-semibold text-text-primary">
                {entry.weight} kg
              </p>
            )}
            {entry.notes && (
              <p className="text-sm text-text-secondary truncate max-w-xs">
                {entry.notes}
              </p>
            )}
            {entry.photo_urls.length > 0 && (
              <p className="text-xs text-text-secondary mt-0.5">
                {entry.photo_urls.length} foto{entry.photo_urls.length !== 1 ? 's' : ''}
              </p>
            )}
            {entry.weight === null && !entry.notes && entry.photo_urls.length === 0 && (
              <p className="text-sm text-text-secondary">Registro sem dados</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {hasExtra && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Menos' : 'Mais'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-text-secondary hover:text-status-error transition-colors disabled:opacity-40"
            title="Excluir registro"
          >
            {isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <Trash2 size={14} />
            }
          </button>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && hasExtra && (
        <div className="border-t border-surface-border px-5 py-4 space-y-4">
          {entry.photo_urls.length > 0 && (
            <div>
              <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Fotos
              </p>
              <div className="flex flex-wrap gap-2">
                {entry.photo_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative w-24 h-24 rounded-lg overflow-hidden border border-surface-border hover:border-brand-lime/40 transition-colors"
                  >
                    <Image
                      src={url}
                      alt={`Foto ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {entry.notes && (
            <div>
              <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Notas
              </p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {entry.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
