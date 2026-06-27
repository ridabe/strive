'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, ChevronDown, ChevronUp, Heart, Trash2, Dumbbell, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface StudentMessageItem {
  id: string
  title: string | null
  message: string
  created_at: string
  read_at: string | null
  message_type: string
}

interface StudentMessagesClientProps {
  studentId: string
  initialMessages: StudentMessageItem[]
}

/**
 * Controla a caixa de entrada do aluno com leitura, exclusao e limpeza em lote.
 */
export function StudentMessagesClient({
  studentId,
  initialMessages,
}: StudentMessagesClientProps) {
  const [messages, setMessages] = useState<StudentMessageItem[]>(initialMessages)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setMessages(initialMessages)
    setExpandedMessageId(null)
    setActionError(null)
  }, [initialMessages, studentId])

  /**
   * Recarrega a lista completa para refletir inserts, leituras e exclusoes.
   */
  const refreshMessages = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('student_messages')
      .select('id, title, message, created_at, read_at, message_type')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error

    setMessages(data ?? [])
  }, [studentId])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`student-web-inbox:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_messages',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          void refreshMessages()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshMessages, studentId])

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.read_at).length,
    [messages],
  )

  /**
   * Traduz o tipo salvo no banco para um rotulo amigavel ao aluno.
   */
  function getMessageTypeLabel(messageType: string) {
    switch (messageType) {
      case 'load_suggestion':
        return 'Ajuste de carga'
      case 'motivation':
        return 'Mensagem motivacional'
      default:
        return 'Mensagem do personal'
    }
  }

  /**
   * Seleciona o icone visual conforme a categoria da mensagem recebida.
   */
  function getMessageIcon(messageType: string) {
    switch (messageType) {
      case 'load_suggestion':
        return Dumbbell
      case 'motivation':
        return Heart
      default:
        return MessageSquare
    }
  }

  /**
   * Formata datas em linguagem curta para manter a lista enxuta no mobile web.
   */
  function formatMessageDate(dateValue: string) {
    const date = new Date(dateValue)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'Agora'
    if (diffMinutes < 60) return `${diffMinutes} min`
    if (diffHours < 24) return `${diffHours} h`
    if (diffDays < 7) return `${diffDays} d`

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * Expande o card e marca como lida a mensagem aberta pela primeira vez.
   */
  async function handleToggleMessage(messageId: string) {
    const nextExpandedId = expandedMessageId === messageId ? null : messageId
    setExpandedMessageId(nextExpandedId)
    setActionError(null)

    const target = messages.find((message) => message.id === messageId)
    if (!target || target.read_at || nextExpandedId === null) return

    try {
      const supabase = createClient()
      const readAt = new Date().toISOString()
      const { error } = await supabase
        .from('student_messages')
        .update({ read_at: readAt })
        .eq('id', messageId)
        .eq('student_id', studentId)

      if (error) throw error

      setMessages((current) => current.map((message) => (
        message.id === messageId
          ? { ...message, read_at: readAt }
          : message
      )))
    } catch (markError: unknown) {
      const message = markError instanceof Error ? markError.message : 'Nao foi possivel marcar a mensagem como lida.'
      setActionError(message)
    }
  }

  /**
   * Remove apenas a mensagem escolhida quando o aluno quer limpar a propria tela.
   */
  async function handleDeleteMessage(messageId: string) {
    const confirmed = window.confirm('Deseja apagar esta mensagem da sua caixa?')
    if (!confirmed) return

    try {
      setIsLoading(true)
      setActionError(null)

      const supabase = createClient()
      const { error } = await supabase
        .from('student_messages')
        .delete()
        .eq('id', messageId)
        .eq('student_id', studentId)

      if (error) throw error

      setMessages((current) => current.filter((message) => message.id !== messageId))
      if (expandedMessageId === messageId) {
        setExpandedMessageId(null)
      }
    } catch (deleteError: unknown) {
      const message = deleteError instanceof Error ? deleteError.message : 'Nao foi possivel apagar a mensagem.'
      setActionError(message)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Executa limpeza em lote para remover mensagens lidas ou zerar a caixa inteira.
   */
  async function handleClearMessages(mode: 'read' | 'all') {
    const label = mode === 'read' ? 'limpar as mensagens lidas' : 'apagar todas as mensagens'
    const confirmed = window.confirm(`Deseja ${label}?`)
    if (!confirmed) return

    try {
      setIsLoading(true)
      setActionError(null)

      const supabase = createClient()
      let query = supabase
        .from('student_messages')
        .delete()
        .eq('student_id', studentId)

      if (mode === 'read') {
        query = query.not('read_at', 'is', null)
      }

      const { error } = await query
      if (error) throw error

      setMessages((current) => (
        mode === 'all'
          ? []
          : current.filter((message) => !message.read_at)
      ))
      setExpandedMessageId(null)
    } catch (clearError: unknown) {
      const message = clearError instanceof Error ? clearError.message : 'Nao foi possivel limpar as mensagens.'
      setActionError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-surface-border bg-surface p-4">
          <p className="text-3xl font-display font-bold text-text-primary">{messages.length}</p>
          <p className="mt-1 text-xs text-text-secondary">mensagens na sua caixa</p>
        </div>
        <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
          <p className="text-3xl font-display font-bold text-violet-300">{unreadCount}</p>
          <p className="mt-1 text-xs text-text-secondary">nao lidas</p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-surface p-4">
          <p className="text-3xl font-display font-bold text-text-primary">{Math.max(messages.length - unreadCount, 0)}</p>
          <p className="mt-1 text-xs text-text-secondary">ja lidas</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-surface-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-body font-semibold text-text-primary">Organize sua caixa</p>
          <p className="text-xs text-text-secondary">Voce pode apagar mensagens individuais ou limpar varias de uma vez.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => handleClearMessages('read')}
            disabled={isLoading || !messages.some((message) => !!message.read_at)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-surface-border px-3 py-2.5 text-xs font-medium text-text-secondary transition-all hover:bg-surface-border/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpar lidas
          </button>
          <button
            type="button"
            onClick={() => handleClearMessages('all')}
            disabled={isLoading || messages.length === 0}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apagar todas
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
            <Bell size={24} />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold uppercase tracking-widest text-text-primary">
            Nenhuma mensagem
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Quando seu personal enviar recados, ajustes de carga ou mensagens motivacionais, eles aparecerao aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const Icon = getMessageIcon(message.message_type)
            const isExpanded = expandedMessageId === message.id

            return (
              <div
                key={message.id}
                className={`rounded-2xl border bg-surface transition-all ${
                  message.read_at
                    ? 'border-surface-border'
                    : 'border-violet-400/25 bg-violet-400/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleMessage(message.id)}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left"
                >
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border ${
                    message.read_at
                      ? 'border-surface-border bg-background text-text-secondary'
                      : 'border-violet-400/25 bg-violet-400/15 text-violet-300'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-body font-semibold text-text-primary">
                        {message.title ?? getMessageTypeLabel(message.message_type)}
                      </p>
                      {!message.read_at && (
                        <span className="rounded-full bg-brand-lime/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-lime">
                          Novo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-text-secondary">
                      {getMessageTypeLabel(message.message_type)} • {formatMessageDate(message.created_at)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                      {isExpanded ? message.message : `${message.message.slice(0, 180)}${message.message.length > 180 ? '...' : ''}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-text-secondary" />
                    ) : (
                      <ChevronDown size={16} className="text-text-secondary" />
                    )}
                    {!message.read_at && <span className="h-2 w-2 rounded-full bg-brand-lime" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="flex border-t border-surface-border px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(message.id)}
                      disabled={isLoading}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Apagar mensagem
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
