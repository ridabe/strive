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

## Evidencias Coletadas
- O cliente recebeu `status=200` e chunks de texto normalmente.
- O ultimo chunk util chegou com `accumulatedLength=687`.
- O marcador `[DONE]` nao chegou ao cliente.
- O `reader.read()` so retornou `done=true` cerca de 145 segundos depois do ultimo chunk util.
- Nenhuma nova linha de `suggest_load` foi gravada em `ai_usage_events`.
- Apenas a mensagem `user` foi gravada em `ai_messages`; nao houve mensagem `assistant`.

## Analise
- H1. Confirmada: o stream nao estava sendo encerrado logicamente no momento correto.
- H2. Parcialmente confirmada: como o parser nao detectava o evento final, a persistencia final nem chegava a ocorrer no tempo esperado.
- H3. Rejeitada: o cliente recebeu chunks e encerrou apenas quando o socket fechou, sem evidencia de bug local de renderizacao.
- H4. Confirmada no efeito final: havia falha no trecho final do fluxo, causada pelo parsing incompleto dos blocos SSE finais.
- H5. Rejeitada: a reproducao instrumentada correspondeu ao codigo esperado e ao deploy atual.

## Correcao Aplicada
- Adicionado parser compartilhado de SSE em `supabase/functions/ai-assistant/streaming.ts`.
- Ajustado o consumo de SSE em `suggest-load.ts`, `chat.ts` e `analyze-progress.ts` para processar blocos completos `event/data`.
- Mantida a instrumentacao do cliente web para verificacao `post-fix`.
- Corrigido tambem o erro de build do Vercel em `generate-plan.ts` removendo `any` explicito.
