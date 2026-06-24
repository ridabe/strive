'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function VideoModal({
  open,
  onClose,
  videoUrl,
  exerciseName,
}: {
  open: boolean
  onClose: () => void
  videoUrl: string
  exerciseName: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) videoRef.current?.pause()
  }, [open])

  if (!open) return null

  const isGif = videoUrl.toLowerCase().includes('.gif')

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4">
      <div className="w-full max-w-2xl space-y-3">
        <div className="flex items-center gap-3">
          <p className="flex-1 font-body font-semibold text-white truncate">{exerciseName}</p>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {isGif ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={videoUrl}
            alt={exerciseName}
            className="w-full rounded-2xl"
            style={{ maxHeight: '65vh', objectFit: 'contain' }}
          />
        ) : (
          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            controls
            autoPlay
            playsInline
            className="w-full rounded-2xl bg-black"
            style={{ maxHeight: '65vh' }}
          />
        )}

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
        >
          Fechar e voltar ao treino
        </button>
      </div>
    </div>
  )
}
