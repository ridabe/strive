'use client'

import { useRef, useState, useTransition } from 'react'
import { Save, AlertTriangle, Check, Trash2 } from 'lucide-react'
import { updateHomeVideo, clearHomeVideo } from './actions'

interface HomeVideoConfig {
  id: boolean
  youtube_url: string | null
  title: string | null
  updated_at: string
}

interface Props {
  data: HomeVideoConfig
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function HomeVideoForm({ data }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [urlInput, setUrlInput] = useState(data.youtube_url ?? '')

  const previewId = extractYoutubeId(urlInput)

  const updatedAt = new Date(data.updated_at).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    const fd = new FormData(formRef.current!)
    startTransition(async () => {
      const res = await updateHomeVideo(fd)
      setResult(res)
    })
  }

  function handleClear() {
    setResult(null)
    startTransition(async () => {
      const res = await clearHomeVideo()
      setResult(res)
      if (res.success) setUrlInput('')
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 py-4 border-b border-surface-border sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="font-body font-semibold text-text-primary text-sm truncate">Vídeo público da home</h2>
          <p className="text-[11px] text-text-secondary mt-0.5">Atualizado em {updatedAt}</p>
        </div>

        <div
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
            data.youtube_url
              ? 'bg-brand-lime/10 border-brand-lime/30 text-brand-lime'
              : 'bg-surface-border/30 border-surface-border text-text-secondary'
          }`}
        >
          {data.youtube_url ? 'Vídeo ativo na home' : 'Nenhum vídeo configurado'}
        </div>
      </div>

      <div className="p-4 space-y-5 sm:p-6">
        {/* URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            URL do vídeo no YouTube
          </label>
          <input
            name="youtube_url"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
            className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
          />
          <p className="text-[11px] text-text-secondary">
            Aceita links no formato youtube.com/watch, youtu.be ou youtube.com/shorts. Deixe em branco e salve para ocultar a seção.
          </p>
        </div>

        {/* Título opcional */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Título acima do vídeo (opcional)
          </label>
          <input
            name="title"
            type="text"
            defaultValue={data.title ?? ''}
            placeholder="ex: Veja o Strive em ação"
            className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
          />
        </div>

        {/* Preview */}
        {urlInput && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Pré-visualização
            </label>
            {previewId ? (
              <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden border border-surface-border">
                <iframe
                  src={`https://www.youtube.com/embed/${previewId}`}
                  title="Pré-visualização do vídeo"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-status-warning/10 border border-status-warning/20 rounded-lg px-4 py-2.5 text-xs text-status-warning">
                <AlertTriangle size={13} />
                URL não reconhecida como link válido do YouTube.
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        {result?.error && (
          <div className="flex items-center gap-2 bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-2.5 text-sm text-status-error">
            <AlertTriangle size={14} />
            {result.error}
          </div>
        )}
        {result?.success && (
          <div className="flex items-center gap-2 bg-status-success/10 border border-status-success/20 rounded-lg px-4 py-2.5 text-sm text-status-success">
            <Check size={14} />
            Configuração salva com sucesso.
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 bg-brand-lime text-background px-5 py-3 rounded-xl text-sm font-semibold hover:bg-brand-lime/90 disabled:opacity-50 transition-all sm:w-auto"
          >
            <Save size={15} />
            {pending ? 'Salvando...' : 'Salvar vídeo'}
          </button>

          {data.youtube_url && (
            <button
              type="button"
              onClick={handleClear}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 bg-surface-border/30 border border-surface-border text-text-secondary hover:text-status-error hover:border-status-error/30 px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all sm:w-auto"
            >
              <Trash2 size={15} />
              Remover vídeo da home
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
