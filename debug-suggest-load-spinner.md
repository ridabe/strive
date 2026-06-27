# Debug Session: suggest-load-spinner [OPEN]

## Sintoma
- Em `suggest_load` via web, o texto aparece na tela.
- O spinner continua girando por muito tempo.
- Depois ocorre `network error`.
- O uso nao e contabilizado em `ai_usage_events`.

## Escopo
- Feature: `suggest_load`
- Cliente: web
- Backend: `supabase/functions/ai-assistant`

## Hipoteses
- H1. O stream SSE da Edge Function continua aberto mesmo apos a Anthropic terminar logicamente a resposta, entao o cliente aguarda `[DONE]` e termina em erro de rede.
- H2. A resposta da Anthropic termina, mas a persistencia final em `ai_messages` ou `ai_usage_events` bloqueia o fechamento do stream e o cliente fica pendurado ate timeout.
- H3. O hook web interpreta incorretamente algum chunk final do SSE e mantem `isStreaming=true` mesmo com texto completo recebido.
- H4. Existe erro silencioso no trecho final de `suggest-load.ts` entre `recordAiUsage()` e `controller.close()`, impedindo contabilizacao e encerramento correto.
- H5. O ambiente remoto ativo nao corresponde exatamente ao codigo esperado no fluxo `suggest_load`, entao a correcao anterior nao esta efetivamente no caminho executado.

## Plano Inicial
- Coletar evidencias de runtime no cliente web e na Edge Function.
- Instrumentar apenas logs de debug no primeiro diff do codigo.
- Reproduzir o erro e comparar eventos do inicio, stream, persistencia e fechamento.
