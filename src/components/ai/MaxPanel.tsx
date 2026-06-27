'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Send, Zap, TrendingUp, Dumbbell, Heart, MessageSquare, Loader2, X, ChevronRight } from 'lucide-react'
import { useMaxStream, type MaxFeature } from '@/hooks/useMaxStream'
import { createClient } from '@/lib/supabase/client'

const MAX_COLOR = '#7C3AED'

interface Action {
  feature: MaxFeature
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const ACTIONS: Action[] = [
  {
    feature:     'generate_plan',
    label:       'Gerar Plano de Treino',
    description: 'Cria um plano personalizado com base no perfil do aluno',
    icon:        Dumbbell,
    color:       'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:border-blue-400/50',
  },
  {
    feature:     'analyze_progress',
    label:       'Analisar Progresso',
    description: 'Avalia evolução e identifica pontos de melhoria',
    icon:        TrendingUp,
    color:       'text-violet-400 bg-violet-400/10 border-violet-400/20 hover:border-violet-400/50',
  },
  {
    feature:     'suggest_load',
    label:       'Sugerir Cargas',
    description: 'Recomenda progressão de cargas para os exercícios',
    icon:        Zap,
    color:       'text-green-400 bg-green-400/10 border-green-400/20 hover:border-green-400/50',
  },
  {
    feature:     'motivation',
    label:       'Mensagem Motivacional',
    description: 'Gera uma mensagem personalizada para engajar o aluno',
    icon:        Heart,
    color:       'text-rose-400 bg-rose-400/10 border-rose-400/20 hover:border-rose-400/50',
  },
]

interface Props {
  studentId: string
  studentName: string
  tenantId: string
}

/**
 * Exibe atalhos operacionais do assistente com foco em leitura e toque no mobile.
 */
export function MaxPanel({ studentId, studentName, tenantId }: Props) {
  const { text, isStreaming, error, conversationId, planId, trigger, reset } = useMaxStream()
  const [activeFeature, setActiveFeature] = useState<MaxFeature | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [sendFeedback, setSendFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const displayText = text.replace(/\nplan_id:[a-f0-9-]{36}$/, '').trim()
  const canSendToStudent = useMemo(
    () => activeFeature === 'suggest_load' || activeFeature === 'motivation',
    [activeFeature],
  )

  useEffect(() => {
    reset()
    setActiveFeature(null)
    setSendFeedback(null)
  }, [studentId, reset])

  /**
   * Remove prefacios operacionais para salvar apenas a mensagem final destinada ao aluno.
   */
  function sanitizeStudentFacingText(rawText: string) {
    return rawText
      .replace(/\nplan_id:[a-f0-9-]{36}/g, '')
      .replace(/^(?:aqui\s+est[aá].*?|segue\s+(?:abaixo\s+)?(?:uma\s+)?(?:mensagem|sugest[aã]o).*?|prontinho.*?|mensagem\s+pronta.*?|você\s+pode\s+enviar.*?|para\s+o\s+[^\n:.-]+[:,-]?\s*)[\s:,-]*/i, '')
      .replace(/^(?:oi[,!.\s]+)?personal[,!.\s]*/i, '')
      .trim()
  }

  /**
   * Dispara a feature selecionada limpando feedbacks de envio anteriores.
   */
  async function handleAction(feature: MaxFeature) {
    setSendFeedback(null)
    setActiveFeature(feature)
    await trigger({ feature, studentId })
  }

  /**
   * Limpa a resposta corrente para evitar reaproveitar contexto visual entre execucoes.
   */
  function handleReset() {
    reset()
    setActiveFeature(null)
    setSendFeedback(null)
  }

  /**
   * Persiste no inbox do aluno apenas respostas prontas para consumo direto.
   */
  async function handleSendToStudent() {
    if (!displayText || !canSendToStudent || isSendingMessage) return

    const clean = sanitizeStudentFacingText(displayText)
    if (!clean) {
      setSendFeedback({ type: 'error', text: 'A mensagem gerada ficou vazia para envio ao aluno.' })
      return
    }

    setIsSendingMessage(true)
    setSendFeedback(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error: insertError } = await supabase
        .from('student_messages')
        .insert({
          tenant_id: tenantId,
          student_id: studentId,
          trainer_id: user?.id,
          message: clean,
          message_type: activeFeature === 'suggest_load' ? 'load_suggestion' : 'motivation',
          title: activeFeature === 'suggest_load' ? 'Sugestão de carga' : 'Mensagem motivacional',
        })

      if (insertError) throw insertError

      setSendFeedback({ type: 'success', text: 'Mensagem enviada ao aluno com sucesso.' })
    } catch (sendError: unknown) {
      const message = sendError instanceof Error ? sendError.message : 'Não foi possível enviar a mensagem.'
      setSendFeedback({ type: 'error', text: message })
    } finally {
      setIsSendingMessage(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 sm:items-center">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${MAX_COLOR}22`, border: `1px solid ${MAX_COLOR}44` }}
        >
          <Zap size={20} style={{ color: MAX_COLOR }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-body font-semibold text-text-primary">Max Strive IA</p>
          <p className="text-xs text-text-secondary break-words">Assistente inteligente para {studentName}</p>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          const isActive = activeFeature === action.feature && isStreaming
          return (
            <button
              key={action.feature}
              type="button"
              onClick={() => handleAction(action.feature)}
              disabled={isStreaming}
              className={`flex min-h-[88px] items-center gap-3 rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${action.color}`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-current/30 bg-current/10">
                {isActive ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Icon size={15} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-body font-semibold leading-snug">{action.label}</p>
                <p className="mt-1 text-xs opacity-70 leading-relaxed">{action.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Resultado */}
      {(displayText || isStreaming || error) && (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
              Resposta da Max
            </p>
            {!isStreaming && (
              <button
                type="button"
                onClick={handleReset}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="p-4">
            {error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : (
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {displayText}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 ml-0.5 bg-violet-400 animate-pulse align-middle" />
                )}
              </p>
            )}
          </div>

          {!isStreaming && displayText && !error && (
            <div className="flex flex-col gap-2 border-t border-surface-border px-4 py-3 sm:flex-row sm:items-center">
              {planId && (
                <Link
                  href={`/dashboard/treinos/${planId}`}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-400/5 px-3 py-2.5 text-xs font-medium text-violet-400 transition-all hover:bg-violet-400/10"
                >
                  <Dumbbell size={12} />
                  Ver plano criado
                </Link>
              )}
              {canSendToStudent && (
                <button
                  type="button"
                  onClick={handleSendToStudent}
                  disabled={isSendingMessage}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-green-400/30 bg-green-400/5 px-3 py-2.5 text-xs font-medium text-green-400 transition-all hover:bg-green-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSendingMessage ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {isSendingMessage ? 'Enviando...' : 'Enviar para aluno'}
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-surface-border px-3 py-2.5 text-xs font-medium text-text-secondary transition-all hover:bg-surface-border/30 hover:text-text-primary"
              >
                Limpar
              </button>
            </div>
          )}
          {sendFeedback && (
            <div className="border-t border-surface-border px-4 py-3">
              <p className={`text-xs ${sendFeedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {sendFeedback.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* CTA Chat */}
      <Link
        href={`/dashboard/alunos/${studentId}/assistente-ia/chat${conversationId ? `?conv=${conversationId}` : ''}`}
        className="group flex min-h-[88px] items-center gap-3 rounded-xl border border-surface-border bg-surface p-4 transition-all hover:border-violet-400/30"
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${MAX_COLOR}15`, border: `1px solid ${MAX_COLOR}30` }}
        >
          <MessageSquare size={16} style={{ color: MAX_COLOR }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-body font-medium text-text-primary group-hover:text-violet-400 transition-colors">
            Conversar com a Max
          </p>
          <p className="text-xs text-text-secondary">Chat livre — tire dúvidas e personalize ainda mais</p>
        </div>
        <ChevronRight size={14} className="text-text-secondary" />
      </Link>
    </div>
  )
}
