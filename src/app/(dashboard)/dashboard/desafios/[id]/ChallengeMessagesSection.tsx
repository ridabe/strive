'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquareText, Send, Loader2 } from 'lucide-react'
import { sendChallengeMessage, type ChallengeMessage } from '@/app/actions/challenges'

interface Props {
  challengeId: string
  messages: ChallengeMessage[]
}

export function ChallengeMessagesSection({ challengeId, messages }: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const message = textareaRef.current?.value.trim() ?? ''
    if (!message) return

    startTransition(async () => {
      const result = await sendChallengeMessage(challengeId, message)
      if (result.error) { setError(result.error); return }
      if (textareaRef.current) textareaRef.current.value = ''
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareText size={16} className="text-text-secondary" />
        <h2 className="font-body font-semibold text-text-primary">
          Dicas para os participantes ({messages.length})
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <textarea
          ref={textareaRef}
          rows={2}
          placeholder="Ex: Hoje beba bastante água e priorize proteína no café da manhã..."
          className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime transition-colors resize-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>

      {error && <p className="text-sm text-status-error">{error}</p>}

      {messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="bg-surface border border-surface-border rounded-lg p-3">
              <p className="text-sm text-text-primary whitespace-pre-line">{m.message}</p>
              <p className="text-[11px] text-text-secondary/60 mt-1">
                {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
