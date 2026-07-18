'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export type MaxFeature = 'chat' | 'generate_plan' | 'analyze_progress' | 'suggest_load' | 'motivation'

export interface PlanPreferencesParams {
  workoutType?: string
  goal?: string
  daysCount?: number
  notes?: string
  wantsCombos?: boolean
  comboNotes?: string
}

export interface MaxStreamParams {
  feature: MaxFeature
  studentId: string
  message?: string
  conversationId?: string
  periodDays?: number
  exerciseId?: string
  planPreferences?: PlanPreferencesParams
}

export interface UseMaxStreamResult {
  text: string
  isStreaming: boolean
  error: string | null
  conversationId: string | null
  planId: string | null
  trigger: (params: MaxStreamParams) => Promise<void>
  reset: () => void
}

export function useMaxStream(): UseMaxStreamResult {
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /**
   * Limpa completamente a execucao corrente para impedir reaproveito de conversa ao trocar de aluno.
   */
  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setText('')
    setError(null)
    setPlanId(null)
    setConversationId(null)
    setIsStreaming(false)
  }, [])

  const trigger = useCallback(async (params: MaxStreamParams) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    let accumulated = ''

    setText('')
    setError(null)
    setPlanId(null)
    setIsStreaming(true)

    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Sessão inválida. Faça login novamente.')

      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const response = await fetch(`${baseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature:         params.feature,
          student_id:      params.studentId,
          message:         params.message,
          conversation_id: params.conversationId ?? conversationId,
          period_days:     params.periodDays,
          exercise_id:     params.exerciseId,
          client_platform: 'web',
          plan_preferences: params.planPreferences ? {
            workout_type: params.planPreferences.workoutType,
            goal:         params.planPreferences.goal,
            days_count:   params.planPreferences.daysCount,
            notes:        params.planPreferences.notes,
            wants_combos: params.planPreferences.wantsCombos,
            combo_notes:  params.planPreferences.comboNotes,
          } : undefined,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errBody.error ?? `HTTP ${response.status}`)
      }

      const convId = response.headers.get('X-Conversation-Id')
      if (convId) setConversationId(convId)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Stream não suportado neste navegador.')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue

          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              accumulated += parsed.text
              setText(accumulated)
            }
          } catch (parseErr: unknown) {
            const msg = parseErr instanceof Error ? parseErr.message : ''
            if (msg && !msg.startsWith('JSON') && !msg.startsWith('Unexpected')) throw parseErr
          }
        }
      }

      const match = accumulated.match(/plan_id:([a-f0-9-]{36})/)
      if (match) setPlanId(match[1])
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        if (!accumulated.trim()) {
          setError(err.message ?? 'Erro desconhecido')
        }
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setIsStreaming(false)
    }
  }, [conversationId])

  return { text, isStreaming, error, conversationId, planId, trigger, reset }
}
