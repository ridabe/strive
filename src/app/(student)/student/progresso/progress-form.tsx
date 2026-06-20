'use client'

import { useState, useRef } from 'react'
import { createProgressEntry, deleteProgressEntry } from '@/app/actions/progress'
import {
  Plus, X, Save, Loader2, Trash2, ChevronDown, ChevronUp,
  ImagePlus, Scale, StickyNote, CheckCircle, AlertTriangle,
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
  const [open, setOpen]       = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const [isPending, setPending] = useState(false)
  const [banner, setBanner]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  function removePreview(idx: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setBanner(null)
    setPending(true)
    try {
      const res = await createProgressEntry(fd)
      if (res?.error) {
        setBanner({ type: 'error', msg: res.error })
      } else {
        setOpen(false)
        setPreviews([])
        formRef.current?.reset()
        setBanner({ type: 'success', msg: 'Registro salvo com sucesso!' })
      }
    } catch {
      setBanner({ type: 'error', msg: 'Erro ao salvar. Verifique sua conexão e tente novamente.' })
    } finally {
      setPending(false)
    }
  }

  const inputCls =
    'bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors placeholder:text-text-secondary/40'

  return (
    <div className="space-y-3">
      {/* Banner fora do form (sucesso após fechar) */}
      {banner && !open && (
        <div className={`flex items-center gap-3 rounded-xl p-4 border ${
          banner.type === 'success'
            ? 'bg-status-success/10 border-status-success/20 text-status-success'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {banner.type === 'success'
            ? <CheckCircle size={15} className="flex-shrink-0" />
            : <AlertTriangle size={15} className="flex-shrink-0" />}
          <p className="text-sm font-medium">{banner.msg}</p>
        </div>
      )}

      {!open ? (
        <button
          onClick={() => { setOpen(true); setBanner(null) }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest hover:bg-brand-lime/90 transition-colors"
        >
          <Plus size={15} />
          Novo Registro
        </button>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-surface border border-brand-lime/30 rounded-2xl p-5 space-y-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-display font-bold uppercase tracking-widest text-text-primary">
              Novo Registro de Progresso
            </p>
            <button
              type="button"
              onClick={() => { setOpen(false); setPreviews([]) }}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Banner dentro do form (erro) */}
          {banner && (
            <div className={`flex items-center gap-3 rounded-xl p-3 border text-sm ${
              banner.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-status-success/10 border-status-success/20 text-status-success'
            }`}>
              <AlertTriangle size={14} className="flex-shrink-0" />
              {banner.msg}
            </div>
          )}

          {/* Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Data
            </label>
            <input
              type="date"
              name="recorded_at"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
              className={inputCls}
            />
          </div>

          {/* Peso */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
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
              className={`w-40 ${inputCls}`}
            />
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <StickyNote size={12} />
              Notas — opcional
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Como você está se sentindo? Alguma conquista hoje?"
              className={`w-full resize-none ${inputCls}`}
            />
          </div>

          {/* Fotos */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <ImagePlus size={12} />
              Fotos — até 5, máx. 5 MB cada
            </label>

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-surface-border group"
                  >
                    <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X size={16} className="text-status-error" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 w-fit cursor-pointer px-3 py-2 rounded-xl border border-dashed border-surface-border hover:border-brand-lime/40 text-xs text-text-secondary hover:text-text-primary transition-colors">
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

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); setPreviews([]) }}
              className="flex-1 py-3 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest hover:bg-brand-lime/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending
                ? <><Loader2 size={14} className="animate-spin" /> Salvando…</>
                : <><Save size={14} /> Salvar</>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Card de entrada de progresso ─────────────────────────────────────────────
export function ProgressEntryCard({ entry }: { entry: ProgressEntry }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, setPending] = useState(false)

  async function handleDelete() {
    if (!window.confirm('Excluir este registro? As fotos também serão removidas.')) return
    setPending(true)
    try {
      await deleteProgressEntry(entry.id)
    } catch {
      // revalidatePath lida com o refresh; erro silencioso aqui é aceitável
    } finally {
      setPending(false)
    }
  }

  const hasExtra = !!entry.notes || entry.photo_urls.length > 0

  return (
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
      {/* Linha principal */}
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Calendário mini */}
          <div className="flex-shrink-0 text-center bg-background border border-surface-border rounded-xl px-3 py-2 min-w-[52px]">
            <p className="text-[10px] text-text-secondary uppercase leading-none">
              {new Date(entry.recorded_at + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
            </p>
            <p className="font-display font-bold text-lg text-text-primary leading-tight">
              {new Date(entry.recorded_at + 'T12:00:00').getDate()}
            </p>
            <p className="text-[10px] text-text-secondary leading-none">
              {new Date(entry.recorded_at + 'T12:00:00').getFullYear()}
            </p>
          </div>

          {/* Resumo */}
          <div className="min-w-0">
            {entry.weight !== null && (
              <p className="font-body font-semibold text-text-primary">
                {entry.weight} kg
              </p>
            )}
            {entry.notes && (
              <p className="text-sm text-text-secondary truncate max-w-[200px] sm:max-w-xs">
                {entry.notes}
              </p>
            )}
            {entry.photo_urls.length > 0 && (
              <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                <ImagePlus size={11} />
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
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && hasExtra && (
        <div className="border-t border-surface-border px-5 py-4 space-y-4">
          {entry.photo_urls.length > 0 && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
                Fotos
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {entry.photo_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-square rounded-xl overflow-hidden border border-surface-border hover:border-brand-lime/40 transition-colors"
                  >
                    <Image
                      src={url}
                      alt={`Foto ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-200"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {entry.notes && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">
                Notas
              </p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{entry.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
