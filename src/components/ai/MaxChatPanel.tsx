'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useMaxStream } from '@/hooks/useMaxStream'

const MAX_COLOR = '#7C3AED'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Props {
  studentId: string
  initialConversationId: string | null
  initialMessages: Message[]
}

export function MaxChatPanel({ studentId, initialConversationId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const { text, isStreaming, error, conversationId, trigger, reset } = useMaxStream()

  useEffect(() => {
    reset()
    setInput('')
    setMessages(initialMessages)
  }, [studentId, initialConversationId, initialMessages, reset])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, text])

  // Sync assistente response into message list when streaming ends
  const prevIsStreamingRef = useRef(false)
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming && text) {
      const cleanText = text.replace(/\nplan_id:[a-f0-9-]{36}$/, '').trim()
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: 'assistant',
          content: cleanText,
          created_at: new Date().toISOString(),
        },
      ])
    }
    prevIsStreamingRef.current = isStreaming
  }, [isStreaming, text])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || isStreaming) return

    setInput('')
    setMessages((prev) => [
      ...prev,
      {
        id: `local-user-${Date.now()}`,
        role: 'user',
        content: msg,
        created_at: new Date().toISOString(),
      },
    ])

    await trigger({
      feature:        'chat',
      studentId,
      message:        msg,
      conversationId: conversationId ?? initialConversationId ?? undefined,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12">
            <p className="text-sm text-text-secondary">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-text-secondary mt-1">Envie uma mensagem para começar.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'bg-surface border border-surface-border text-text-primary'
              }`}
              style={msg.role === 'user' ? { background: MAX_COLOR } : undefined}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-surface border border-surface-border rounded-2xl px-4 py-2.5 text-sm text-text-primary leading-relaxed">
              {text ? (
                <>
                  {text.replace(/\nplan_id:[a-f0-9-]{36}$/, '')}
                  <span className="inline-block w-0.5 h-4 ml-0.5 bg-violet-400 animate-pulse align-middle" />
                </>
              ) : (
                <Loader2 size={14} className="animate-spin text-violet-400" />
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-surface-border p-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem…"
          rows={1}
          className="flex-1 bg-background border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 resize-none focus:outline-none focus:border-violet-400/50 transition-colors"
          style={{ maxHeight: '120px' }}
          disabled={isStreaming}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: MAX_COLOR }}
        >
          {isStreaming ? (
            <Loader2 size={15} className="animate-spin text-white" />
          ) : (
            <Send size={15} className="text-white" />
          )}
        </button>
      </div>
    </div>
  )
}
