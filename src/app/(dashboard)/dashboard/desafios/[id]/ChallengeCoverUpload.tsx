'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ImageIcon, Upload, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { uploadChallengeCover, removeChallengeCover } from '@/app/actions/challenges'
import { CHALLENGE_COVER_RECOMMENDED_WIDTH, CHALLENGE_COVER_RECOMMENDED_HEIGHT } from '@/lib/challenge-constants'

interface Props {
  challengeId: string
  coverImageUrl: string | null
  canEdit: boolean
}

const RECOMMENDED_RATIO = CHALLENGE_COVER_RECOMMENDED_WIDTH / CHALLENGE_COVER_RECOMMENDED_HEIGHT

export function ChallengeCoverUpload({ challengeId, coverImageUrl, canEdit }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [warning, setWarning] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setWarning('')

    const objectUrl = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const ratio = img.width / img.height
      const diff = Math.abs(ratio - RECOMMENDED_RATIO) / RECOMMENDED_RATIO
      if (diff > 0.15) {
        setWarning(
          `Essa imagem tem proporção diferente da recomendada (${img.width}×${img.height}px). ` +
          `Ela será cortada automaticamente para caber no padrão ${CHALLENGE_COVER_RECOMMENDED_WIDTH}×${CHALLENGE_COVER_RECOMMENDED_HEIGHT}px — pode perder partes importantes.`
        )
      }
    }
    img.src = objectUrl

    setPreview(objectUrl)
    setPendingFile(file)
  }

  function handleUpload() {
    if (!pendingFile) return
    setError('')
    const fd = new FormData()
    fd.set('cover', pendingFile)

    startTransition(async () => {
      const result = await uploadChallengeCover(challengeId, fd)
      if (result.error) { setError(result.error); return }
      setPreview(null)
      setPendingFile(null)
      setWarning('')
      router.refresh()
    })
  }

  function handleCancelPending() {
    setPreview(null)
    setPendingFile(null)
    setWarning('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleRemove() {
    setError('')
    startTransition(async () => {
      await removeChallengeCover(challengeId)
      router.refresh()
    })
  }

  const displayUrl = preview ?? coverImageUrl

  return (
    <div className="space-y-2">
      <div className="relative aspect-[1200/630] w-full rounded-xl overflow-hidden bg-surface border border-surface-border">
        {displayUrl ? (
          <Image src={displayUrl} alt="Capa do desafio" fill unoptimized className="object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-secondary">
            <ImageIcon size={22} />
            <p className="text-xs">Nenhuma capa definida</p>
          </div>
        )}
      </div>

      {canEdit && (
        <>
          <p className="text-[11px] text-text-secondary/70">
            Recomendado: {CHALLENGE_COVER_RECOMMENDED_WIDTH}×{CHALLENGE_COVER_RECOMMENDED_HEIGHT}px (proporção 1,91:1) · JPG, PNG ou WebP · até 5MB
          </p>

          {warning && (
            <div className="flex items-start gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-2.5">
              <AlertTriangle size={13} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400 leading-relaxed">{warning}</p>
            </div>
          )}

          {error && <p className="text-xs text-status-error">{error}</p>}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            {pendingFile ? (
              <>
                <button
                  onClick={handleUpload}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-lime text-background text-xs font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
                >
                  {isPending && <Loader2 size={12} className="animate-spin" />}
                  Enviar capa
                </button>
                <button
                  onClick={handleCancelPending}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg border border-surface-border text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-surface-border text-xs text-text-secondary hover:text-brand-lime hover:border-brand-lime/30 transition-colors"
                >
                  <Upload size={13} />
                  {coverImageUrl ? 'Trocar capa' : 'Enviar capa'}
                </button>
                {coverImageUrl && (
                  <button
                    onClick={handleRemove}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-text-secondary hover:text-red-400 transition-colors disabled:opacity-60"
                  >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                    Remover
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
