import { SupabaseClient }  from 'https://esm.sh/@supabase/supabase-js@2';
import {
  retrieveRelevantExercises,
  formatRetrievedContext,
} from '../retrieval/rag-retrieval.ts';
import { recordAiUsage, type AiTrackingContext } from '../usage.ts';
import { ANTHROPIC_SMART_MODEL, OPENAI_EMBEDDING_MODEL } from '../models.ts';
import { extractSsePayloads } from '../streaming.ts';

const MODEL         = ANTHROPIC_SMART_MODEL;
const MAX_TOKENS    = 768;
const HISTORY_LIMIT = 4;
const STREAM_IDLE_AFTER_TEXT_MS = 2500;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Handler principal ────────────────────────────────────────────────────────

export async function handleChat(
  supabase:       SupabaseClient,
  systemPrompt:   string,
  message:        string,
  conversationId: string,
  tenantId:       string,
  tracking:       AiTrackingContext,
): Promise<Response> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')!;
  const startedAt = Date.now();

  try {
    // 1. Histórico da conversa
    const { data: historyRows } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(HISTORY_LIMIT * 2);

    // 2. RAG — exercícios relevantes para a pergunta
    let ragContext = '';
    let ragUsed    = false;
    try {
      const retrieved = await retrieveRelevantExercises(supabase, message, tenantId);
      if (retrieved.exercises.length > 0) {
        ragContext = formatRetrievedContext(retrieved.exercises);
        ragUsed    = true;
      }

      await recordAiUsage(supabase, tracking, {
        provider: 'openai',
        usageKind: 'embedding',
        model: retrieved.usage.model,
        status: 'success',
        inputTokens: retrieved.usage.inputTokens,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        metadata: {
          rag_results: retrieved.exercises.length,
          rag_used: ragUsed,
        },
      });
    } catch (err) {
      const ragError = err instanceof Error ? err.message : 'Falha na busca vetorial';
      await recordAiUsage(supabase, tracking, {
        provider: 'openai',
        usageKind: 'embedding',
        model: OPENAI_EMBEDDING_MODEL,
        status: 'error',
        latencyMs: Date.now() - startedAt,
        errorMessage: ragError,
      });
      console.error('[chat] RAG retrieval failed:', err);
    }

    const fullSystemPrompt = ragContext
      ? `${systemPrompt}\n\n---\n\n${ragContext}`
      : systemPrompt;

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(historyRows ?? []).map((m: any) => ({
        role:    m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // 3. Persiste mensagem do Personal antes de iniciar o stream
    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role:            'user',
      content:         message,
      metadata: {
        rag_used: ragUsed,
        client_platform: tracking.clientPlatform,
      },
    });

    // 4. Raw fetch para streaming nativo Deno (evita EventEmitter do SDK)
    const anthropicResp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        system:     fullSystemPrompt,
        messages,
        stream:     true,
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      throw new Error(`Anthropic API ${anthropicResp.status}: ${errText}`);
    }

    return buildSseResponse(anthropicResp.body!, supabase, conversationId, ragUsed, tracking, startedAt);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao processar chat';
    await recordAiUsage(supabase, tracking, {
      provider: 'anthropic',
      usageKind: 'completion',
      model: MODEL,
      status: 'error',
      latencyMs: Date.now() - startedAt,
      errorMessage,
    });
    throw err;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSseResponse(
  anthropicBody:  ReadableStream<Uint8Array>,
  supabase:       SupabaseClient,
  conversationId: string,
  ragUsed:        boolean,
  tracking:       AiTrackingContext,
  startedAt:      number,
): Response {
  const encoder = new TextEncoder();
  let fullText  = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let modelName = MODEL;
  let streamError: string | null = null;
  let messageCompleted = false;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader  = anthropicBody.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      /**
       * Fecha o stream quando ja houve resposta textual e o upstream fica ocioso.
       */
      const readWithIdleTimeout = async (): Promise<ReadableStreamReadResult<Uint8Array> | null> => {
        if (!fullText.trim()) return reader.read();

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        try {
          return await Promise.race([
            reader.read(),
            new Promise<null>((resolve) => {
              timeoutId = setTimeout(() => resolve(null), STREAM_IDLE_AFTER_TEXT_MS);
            }),
          ]);
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      };

      const processRawEvent = (raw: string): boolean => {
        if (!raw || raw === '[DONE]') {
          messageCompleted = true;
          return true;
        }

        try {
          const ev = JSON.parse(raw);
          if (ev.type === 'message_start') {
            modelName = ev.message?.model ?? modelName;
            inputTokens = ev.message?.usage?.input_tokens ?? inputTokens;
            outputTokens = ev.message?.usage?.output_tokens ?? outputTokens;
          }
          if (ev.type === 'message_delta' && typeof ev.usage?.output_tokens === 'number') {
            outputTokens = ev.usage.output_tokens;
          }
          if (ev.type === 'content_block_stop' && fullText.trim()) {
            messageCompleted = true;
            return true;
          }
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            fullText += ev.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: ev.delta.text })}\n\n`),
            );
          }
          if (ev.type === 'message_stop') {
            messageCompleted = true;
            return true;
          }
        } catch { /* ignore parse errors */ }

        return false;
      };

      try {
        outer: while (true) {
          const chunk = await readWithIdleTimeout();
          if (chunk === null) {
            messageCompleted = true;
            reader.cancel('idle-timeout-after-text').catch(() => {});
            break;
          }

          const { done, value } = chunk;
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parsed = extractSsePayloads(buffer);
          buffer = parsed.rest;

          for (const raw of parsed.payloads) {
            if (processRawEvent(raw)) break outer;
          }
        }

        if (!messageCompleted && buffer.trim()) {
          const parsed = extractSsePayloads(buffer, true);
          for (const raw of parsed.payloads) {
            if (processRawEvent(raw)) break;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        streamError = msg;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        } catch { /* ignore */ }
      }

      if (fullText) {
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role:            'assistant',
          content:         fullText,
          metadata: {
            provider: 'anthropic',
            model: modelName,
            rag_used: ragUsed,
            client_platform: tracking.clientPlatform,
            tokens_input: inputTokens,
            tokens_output: outputTokens,
          },
        }).catch(console.error);

        await recordAiUsage(supabase, tracking, {
          provider: 'anthropic',
          usageKind: 'completion',
          model: modelName,
          status: streamError ? 'error' : 'success',
          inputTokens,
          outputTokens,
          latencyMs: Date.now() - startedAt,
          errorMessage: streamError,
          metadata: { rag_used: ragUsed },
        });
      } else if (streamError) {
        await recordAiUsage(supabase, tracking, {
          provider: 'anthropic',
          usageKind: 'completion',
          model: modelName,
          status: 'error',
          inputTokens,
          outputTokens,
          latencyMs: Date.now() - startedAt,
          errorMessage: streamError,
          metadata: { rag_used: ragUsed },
        });
      }

      try {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch { /* ignore */ }
    },
  });

  return new Response(body, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'X-Conversation-Id': conversationId,
    },
  });
}
