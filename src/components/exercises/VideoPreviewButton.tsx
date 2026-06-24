'use client'

import { useState } from 'react'
import { Video, Play } from 'lucide-react'
import { VideoModal } from '@/components/student/VideoModal'

interface Props {
  url: string
  name: string
  /** When set, renders as a text link with Play icon instead of icon-only button */
  label?: string
}

export function VideoPreviewButton({ url, name, label }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {label ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-xs text-brand-lime hover:underline"
        >
          <Play size={11} />
          {label}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          title="Ver demonstração"
          className="inline-flex items-center justify-center"
        >
          <Video size={15} className="text-brand-lime hover:opacity-80 transition-opacity" />
        </button>
      )}
      <VideoModal
        open={open}
        onClose={() => setOpen(false)}
        videoUrl={url}
        exerciseName={name}
      />
    </>
  )
}
