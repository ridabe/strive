'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export type MaxFeature = 'chat' | 'generate_plan' | 'analyze_progress' | 'suggest_load' | 'motivation'

export interface MaxStreamParams {
  feature: MaxFeature
  studentId: string
  message?: string
  conversationId?: string
  periodDays?: number
  exerciseId?: string
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

  const reset = useCallback(() => {
    setText('')
    setError(null)
    setPlanId(null)
  }, [])

  const trigger = useCallback(async (params: MaxStreamParams) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    let accumulated = ''
    const traceId = `${params.feature}-${Date.now()}`
    const debugRunId = 'post-fix'

    setText('')
    setError(null)
    setPlanId(null)
    setIsStreaming(true)

    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Sessão inválida. Faça login novamente.')

      // #region debug-point A:trigger-start
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'A', traceId, location: 'useMaxStream.ts:trigger:start', msg: '[DEBUG] trigger start', data: { feature: params.feature, studentId: params.studentId, hasConversationId: Boolean(params.conversationId ?? conversationId), hasExerciseId: Boolean(params.exerciseId) }, ts: Date.now() }) }).catch(() => {})
      // #endregion

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
        }),
        signal: controller.signal,
      })

      // #region debug-point B:http-response
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'B', traceId, location: 'useMaxStream.ts:trigger:response', msg: '[DEBUG] function response received', data: { ok: response.ok, status: response.status, hasBody: Boolean(response.body), conversationHeader: response.headers.get('X-Conversation-Id') }, ts: Date.now() }) }).catch(() => {})
      // #endregion

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errBody.error ?? `HTTP ${response.status}`)
      }

      const convId = response.headers.get('X-Conversation-Id')
      if (convId) setConversationId(convId)

      // #region debug-point C:stream-open
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'C', traceId, location: 'useMaxStream.ts:trigger:stream-open', msg: '[DEBUG] stream open', data: { convId }, ts: Date.now() }) }).catch(() => {})
      // #endregion

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Stream não suportado neste navegador.')

      const decoder = new TextDecoder()
      let buffer = ''
      let chunkCount = 0

      outer: while (true) {
        const { done, value } = await reader.read()
        chunkCount += 1
        // #region debug-point D:reader-read
        fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'D', traceId, location: 'useMaxStream.ts:trigger:reader-read', msg: '[DEBUG] reader.read result', data: { done, chunkCount, valueSize: value?.length ?? 0, accumulatedLength: accumulated.length }, ts: Date.now() }) }).catch(() => {})
        // #endregion
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') {
            // #region debug-point E:done-marker
            fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'E', traceId, location: 'useMaxStream.ts:trigger:done', msg: '[DEBUG] done marker received', data: { chunkCount, accumulatedLength: accumulated.length }, ts: Date.now() }) }).catch(() => {})
            // #endregion
            break outer
          }

          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              accumulated += parsed.text
              setText(accumulated)
              // #region debug-point F:text-chunk
              fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'F', traceId, location: 'useMaxStream.ts:trigger:text', msg: '[DEBUG] text chunk appended', data: { chunkCount, appendedLength: parsed.text.length, accumulatedLength: accumulated.length }, ts: Date.now() }) }).catch(() => {})
              // #endregion
            }
          } catch (parseErr: unknown) {
            const msg = parseErr instanceof Error ? parseErr.message : ''
            if (msg && !msg.startsWith('JSON') && !msg.startsWith('Unexpected')) throw parseErr
          }
        }
      }

      // #region debug-point G:loop-end
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'G', traceId, location: 'useMaxStream.ts:trigger:loop-end', msg: '[DEBUG] stream loop ended', data: { chunkCount, bufferLength: buffer.length, accumulatedLength: accumulated.length }, ts: Date.now() }) }).catch(() => {})
      // #endregion

      const match = accumulated.match(/plan_id:([a-f0-9-]{36})/)
      if (match) setPlanId(match[1])
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        // #region debug-point H:catch
        fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'H', traceId, location: 'useMaxStream.ts:trigger:catch', msg: '[DEBUG] trigger catch', data: { name: err.name, message: err.message, accumulatedLength: accumulated.length }, ts: Date.now() }) }).catch(() => {})
        // #endregion
        if (!accumulated.trim()) {
          setError(err.message ?? 'Erro desconhecido')
        }
      }
    } finally {
      // #region debug-point I:finally
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'suggest-load-spinner', runId: debugRunId, hypothesisId: 'I', traceId, location: 'useMaxStream.ts:trigger:finally', msg: '[DEBUG] trigger finally', data: { accumulatedLength: accumulated.length }, ts: Date.now() }) }).catch(() => {})
      // #endregion
      setIsStreaming(false)
    }
  }, [conversationId])

  return { text, isStreaming, error, conversationId, planId, trigger, reset }
}
