'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MUSCLE_GROUPS,
  LOAD_TYPES,
  COUNT_TYPES,
  VIDEO_MAX_BYTES,
  VIDEO_MIME_TYPES,
  VIDEO_ACCEPT,
} from '@/lib/exercise-config'
import {
  createExercise,
  updateExercise,
  createGlobalExercise,
  updateGlobalExercise,
} from '@/app/actions/exercises'
import { Upload, X, Play, Loader2, AlertCircle } from 'lucide-react'

type Exercise = {
  id: string
  name: string
  muscle_group: string
  secondary_muscles: string[]
  instructions: string | null
  video_url: string | null
  video_path: string | null
  load_type: string
  count_type: string
  default_sets: number | null
  default_reps: string | null
  default_duration_secs: number | null
}

interface Props {
  isGlobal: boolean
  tenantId?: string
  exercise?: Exercise
  redirectTo: string
}

const FIELD = 'w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime transition-colors'
const LABEL = 'block text-xs font-body font-medium text-text-secondary uppercase tracking-widest mb-1.5'

export function ExerciseForm({ isGlobal, tenantId, exercise, redirectTo }: Props) {
  const router   = useRouter()
  const formRef  = useRef<HTMLFormElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)
  const [error,        setError]        = useState('')
  const [isPending,    setIsPending]    = useState(false)
  const [videoFile,    setVideoFile]    = useState<File | null>(null)
  const [videoError,   setVideoError]   = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [countType,    setCountType]    = useState(exercise?.count_type ?? 'reps')
  const [isDragging,   setIsDragging]   = useState(false)

  const isEdit = !!exercise

  function validateVideo(file: File): string {
    if (!VIDEO_MIME_TYPES.includes(file.type)) {
      return `Formato inválido. Use .mp4, .mov ou .webm.`
    }
    if (file.size > VIDEO_MAX_BYTES) {
      return `Arquivo muito grande (${(file.size / 1048576).toFixed(1)} MB). Máximo: 20 MB.`
    }
    return ''
  }

  function handleFileChange(file: File | null) {
    setVideoError('')
    if (!file) { setVideoFile(null); return }
    const err = validateVideo(file)
    if (err) { setVideoError(err); setVideoFile(null); return }
    setVideoFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileChange(file)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsPending(true)
    setUploadProgress(0)

    const fd = new FormData(e.currentTarget)

    // ── Upload de vídeo (client-side direto ao Storage) ──────────────────────
    if (videoFile) {
      const supabase  = createClient()
      const prefix    = isGlobal ? 'global' : (tenantId ?? 'tenant')
      const ext       = videoFile.name.split('.').pop() ?? 'mp4'
      const uid       = crypto.randomUUID()
      const path      = `${prefix}/${uid}.${ext}`

      setUploadProgress(10)

      const { error: upErr } = await supabase.storage
        .from('exercise-videos')
        .upload(path, videoFile, { contentType: videoFile.type, upsert: false })

      if (upErr) {
        setError(`Erro no upload do vídeo: ${upErr.message}`)
        setIsPending(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('exercise-videos')
        .getPublicUrl(path)

      // Remover vídeo antigo se editando e trocar arquivo
      if (exercise?.video_path && exercise.video_path !== path) {
        await supabase.storage.from('exercise-videos').remove([exercise.video_path])
      }

      fd.set('video_url', publicUrl)
      fd.set('video_path', path)
      setUploadProgress(80)
    } else if (isEdit && exercise?.video_url) {
      fd.set('video_url',  exercise.video_url)
      fd.set('video_path', exercise.video_path ?? '')
    }

    fd.delete('video_file')

    // ── Server Action ─────────────────────────────────────────────────────────
    let result: { error?: string; success?: boolean }

    if (isEdit) {
      result = isGlobal
        ? await updateGlobalExercise(exercise!.id, fd)
        : await updateExercise(exercise!.id, fd)
    } else {
      result = isGlobal
        ? await createGlobalExercise(fd)
        : await createExercise(fd)
    }

    setUploadProgress(100)

    if (result.error) {
      setError(result.error)
      setIsPending(false)
      return
    }

    router.push(redirectTo)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Nome */}
      <div>
        <label className={LABEL}>Nome do exercício *</label>
        <input
          name="name"
          required
          defaultValue={exercise?.name}
          placeholder="ex: Supino Reto com Halteres"
          className={FIELD}
        />
      </div>

      {/* Grupo muscular */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Grupo muscular principal *</label>
          <select name="muscle_group" required defaultValue={exercise?.muscle_group ?? ''} className={FIELD}>
            <option value="">Selecione...</option>
            {MUSCLE_GROUPS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Músculos secundários</label>
          <input
            name="secondary_muscles"
            defaultValue={exercise?.secondary_muscles?.join(', ')}
            placeholder="ex: Tríceps, Ombros"
            className={FIELD}
          />
          <p className="text-xs text-text-secondary/60 mt-1">Separados por vírgula</p>
        </div>
      </div>

      {/* Tipo de carga + contagem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Tipo de carga</label>
          <select name="load_type" defaultValue={exercise?.load_type ?? 'bodyweight'} className={FIELD}>
            {LOAD_TYPES.map(l => (
              <option key={l.value} value={l.value}>{l.emoji} {l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Tipo de contagem</label>
          <select
            name="count_type"
            value={countType}
            onChange={e => setCountType(e.target.value)}
            className={FIELD}
          >
            {COUNT_TYPES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Defaults: séries, reps, duração */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Séries padrão</label>
          <input
            name="default_sets"
            type="number"
            min={1}
            max={99}
            defaultValue={exercise?.default_sets ?? ''}
            placeholder="3"
            className={FIELD}
          />
        </div>
        {(countType === 'reps' || countType === 'both') && (
          <div>
            <label className={LABEL}>Reps padrão</label>
            <input
              name="default_reps"
              defaultValue={exercise?.default_reps ?? ''}
              placeholder="8-12"
              className={FIELD}
            />
          </div>
        )}
        {(countType === 'time' || countType === 'both') && (
          <div>
            <label className={LABEL}>Duração (seg)</label>
            <input
              name="default_duration_secs"
              type="number"
              min={1}
              defaultValue={exercise?.default_duration_secs ?? ''}
              placeholder="30"
              className={FIELD}
            />
          </div>
        )}
      </div>

      {/* Instruções */}
      <div>
        <label className={LABEL}>Instruções de execução</label>
        <textarea
          name="instructions"
          rows={5}
          defaultValue={exercise?.instructions ?? ''}
          placeholder="Descreva a execução correta do exercício..."
          className={`${FIELD} resize-none`}
        />
      </div>

      {/* Upload de vídeo */}
      <div>
        <label className={LABEL}>Vídeo demonstrativo</label>

        {/* Vídeo atual (modo edição) */}
        {isEdit && exercise?.video_url && !videoFile && (
          <div className="mb-3 flex items-center gap-3 p-3 bg-surface border border-surface-border rounded-lg">
            <Play size={16} className="text-brand-lime flex-shrink-0" />
            <span className="text-sm text-text-primary truncate flex-1">Vídeo atual</span>
            <a href={exercise.video_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand-lime hover:underline">Ver</a>
          </div>
        )}

        {/* Zona de drag-and-drop */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-brand-lime bg-brand-lime/5'
              : videoFile
                ? 'border-brand-lime/40 bg-brand-lime/5'
                : 'border-surface-border hover:border-brand-lime/40'
          }`}
        >
          <input
            ref={fileRef}
            name="video_file"
            type="file"
            accept={VIDEO_ACCEPT}
            className="hidden"
            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
          />

          {videoFile ? (
            <div className="flex items-center justify-center gap-3">
              <Play size={20} className="text-brand-lime" />
              <div className="text-left">
                <p className="text-sm text-text-primary font-medium">{videoFile.name}</p>
                <p className="text-xs text-text-secondary">{(videoFile.size / 1048576).toFixed(1)} MB</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setVideoFile(null); if (fileRef.current) fileRef.current.value = '' }}
                className="ml-2 text-text-secondary hover:text-status-error transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} className="text-text-secondary" />
              <p className="text-sm text-text-primary">
                {isEdit ? 'Substituir vídeo' : 'Arraste um vídeo ou clique para selecionar'}
              </p>
              <p className="text-xs text-text-secondary">.mp4 · .mov · .webm · máx 20 MB</p>
            </div>
          )}
        </div>

        {videoError && (
          <div className="mt-2 flex items-center gap-2 text-sm text-status-error">
            <AlertCircle size={14} />
            {videoError}
          </div>
        )}
      </div>

      {/* Progress bar de upload */}
      {isPending && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary">Fazendo upload... {uploadProgress}%</p>
          <div className="w-full bg-surface-border rounded-full h-1.5">
            <div
              className="h-full bg-brand-lime rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Erro geral */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-3">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(redirectTo)}
          className="px-5 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || !!videoError}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Salvar alterações' : 'Criar exercício'}
        </button>
      </div>
    </form>
  )
}
