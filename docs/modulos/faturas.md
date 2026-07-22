# Módulo: Faturas e Cobranças (`faturas`)

## Visão geral

Cobrança manual de alunos pelo personal/academia — sem gateway de pagamento. O aluno paga por fora (PIX, dinheiro, transferência, cartão na maquininha) e o personal dá baixa manualmente na cobrança do mês. O aluno acompanha o status (pago/pendente/atrasado) na própria tela.

Dois modos de cobrança, escolhidos na criação:

- **Recorrente**: gera 1 cobrança por mês automaticamente, indefinidamente, enquanto a assinatura estiver ativa.
- **Pacote**: gera de uma vez todas as parcelas de um número fixo de meses (1 a 24 — ex.: 6 meses de aula). O personal dá baixa mês a mês; quando o pacote inteiro é quitado, a tela do personal mostra um aviso para renovar.

## Identificação

- Slug: `faturas`
- Categoria: `financeiro`
- Ícone: `Receipt` / `CreditCard`
- Status no catálogo: `active`

## Tabelas do banco

### `student_billing_subscriptions`
Regra de cobrança de um aluno (1 por aluno — `unique(student_id)`).

| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid | PK |
| `tenant_id` | uuid | FK tenants |
| `student_id` | uuid | FK students, único |
| `plan_name` | text | ex.: "Mensalidade" |
| `amount` | numeric(10,2) | valor **por mês** |
| `due_day` | smallint | dia de vencimento (1-28) |
| `active` | boolean | |
| `billing_type` | enum `recorrente` \| `pacote` | adicionado em `20260722_billing_package_installments.sql` |
| `total_installments` | smallint (1-24) | só preenchido quando `billing_type = 'pacote'` |
| `started_at` | date | |

Constraint: `pacote` exige `total_installments`; `recorrente` não pode ter.

### `financial_plans`
Uma linha por cobrança/mês (gerada automaticamente para `recorrente`, ou toda de uma vez para `pacote`).

Campos relevantes: `status` (`pending`/`paid`/`overdue`/`cancelled`), `due_date`, `paid_at`, `paid_by`, `payment_method`, `subscription_id` (liga à assinatura que originou a cobrança).

## Fluxo do personal

1. `/dashboard/financeiro` → aba "Mensalidades" → "Nova cobrança".
2. Escolhe **Mensalidade recorrente** (valor + dia de vencimento) ou **Pacote de meses** (valor mensal + dia de vencimento + nº de meses).
3. Recorrente → `upsertStudentSubscription` (server action) → `generateMonthlyChargesFor` gera 1 cobrança por vez, chamada toda vez que a tela é aberta (idempotente, sem cron).
4. Pacote → `createPackageSubscription` (server action) → gera **todas** as N parcelas de uma vez (`financial_plans`), com vencimento mensal a partir do mês corrente. `generateMonthlyChargesFor` ignora assinaturas `pacote` (filtro `billing_type = 'recorrente'`).
5. Dar baixa: `registerPayment` marca a cobrança do mês como `paid` (forma de pagamento + quem deu baixa). `undoPayment` reverte. `cancelCharge` cancela uma cobrança pontual.
6. Na listagem de assinaturas, pacotes mostram um badge "Pacote X/N"; quando X = N, o badge vira aviso de renovação.

Arquivos: `src/actions/student-billing.ts`, `src/lib/billing/core.ts`, `src/app/(dashboard)/dashboard/financeiro/page.tsx`, `subscription-form.tsx`, `payment-actions.tsx`.

## Fluxo do aluno

`/student/financeiro` (implementado nesta etapa — antes era placeholder "Em breve"):

- Card da assinatura ativa (recorrente ou pacote, com progresso "X de N meses pagos" quando for pacote).
- Lista de cobranças em aberto (pendente/atrasado).
- Histórico completo de cobranças com status e data de pagamento.
- Somente leitura — o aluno não interage, só acompanha. O "aviso" de baixa é o próprio status virando "Pago" na tela.

Arquivo: `src/app/(student)/student/financeiro/page.tsx`. Resolve o aluno atual via `getActiveStudentRow`.

## Integração com o sistema de módulos

Módulo já existia e está `active`/`available` globalmente; liberação por tenant continua pelo fluxo padrão (`/admin/modulos` e `/admin/clientes/[id]/modulos`, actions em `src/app/actions/modules.ts`). Nenhuma mudança necessária aqui — só o schema e as telas foram estendidos.

## RLS

- `can_manage_billing(tenant_id)`: `true` sempre em tenant `autonomo`; em `academia`, só `owner/admin/gerente/operador`. Aplica-se a `student_billing_subscriptions` e `financial_plans` (personal de academia nunca vê financeiro, mesmo do próprio aluno atribuído).
- **Nova policy** (`20260722` — RLS follow-up): aluno passou a ter `SELECT` na própria `student_billing_subscriptions` (`student_id in (select id from students where user_id = auth.uid())`). Antes só existia a policy de gestão financeira — a tela do aluno precisava disso para mostrar o card da assinatura/pacote.

## Mobile (strivePersonalApp — Expo Router)

Implementado no mesmo ciclo desta feature, no repositório separado `strivePersonalApp` (Expo Router + Supabase, sem camada de server actions — tudo client-side protegido por RLS).

- `src/types/database.ts` (cópia própria do mobile, gerada separado do web) recebeu o mesmo ajuste manual: `billing_type` e `total_installments` em `student_billing_subscriptions`.
- **Personal**: `app/(admin)/financeiro.tsx` — tela única com lista de alunos (status/pacote resumido) e detalhe por aluno (assinatura atual + histórico de cobranças + dar baixa/desfazer/cancelar). Modal de criar/editar cobrança com o mesmo seletor recorrente vs pacote do web. Como não há server actions no mobile, a lógica de `generateMonthlyChargesFor`/`markOverdueChargesFor`/`createPackageSubscription` foi replicada em funções auxiliares no topo do próprio arquivo, chamando `supabase.from(...)` direto — protegida pelas mesmas policies de RLS (`can_manage_billing`) do banco compartilhado.
- Rotas ligadas: item "Faturas" em `app/(admin)/mais.tsx` (antes sem `route`) e card "Financeiro" em `app/(admin)/alunos/[id].tsx` (antes `onPress: null`) agora abrem `/(admin)/financeiro`, com `studentId` como param quando vindo do hub do aluno. Tela registrada como oculta no `Tabs` de `app/(admin)/_layout.tsx` (`href: null`), mesmo padrão de `avaliacao`/`anamnese`.
- **Aluno**: `app/(student)/mais/financeiro.tsx` já existia (somente leitura das cobranças) — estendida para buscar também a assinatura ativa e mostrar o card de mensalidade/pacote com progresso ("X de N meses pagos"), no mesmo padrão da tela web do aluno.
- Liberação por tenant: automática — o slug `faturas` já existia em `src/lib/modules.ts` do mobile e o `ModuleGuard`/`useModules`/`tenant_modules` já refletem em tempo real o toggle feito pelo admin global na web. Nenhuma mudança necessária aqui.

## UX: botão de nova cobrança + atualização de dados

Ajuste feito após feedback de que o botão "Nova cobrança" ficava escondido atrás da última aba ("Todas"), pouco intuitivo.

- **Web**: `NewSubscriptionForm` saiu de dentro da aba "Mensalidades" e ficou fixo logo abaixo do título "Financeiro", visível em qualquer aba (`src/app/(dashboard)/dashboard/financeiro/page.tsx`).
- **Mobile**: botão "+" do header da lista agora abre um seletor de aluno (`pickerVisible`) que já leva direto ao formulário de cobrança, sem precisar entrar no hub do aluno primeiro (`app/(admin)/financeiro.tsx`).
- **Atualização de dados**: adicionado `export const dynamic = 'force-dynamic'` nas duas páginas web (personal e aluno) para evitar que o Client Router Cache do Next 15 sirva uma renderização antiga ao trocar de aba/filtro. No mobile, a tela do personal passou a usar `useFocusEffect` (em vez de só `useEffect` no mount) para recarregar sempre que a tela volta a ficar em foco.

## Cobrança na agenda (opt-in)

Cada assinatura (recorrente ou pacote) tem a opção "Adicionar vencimentos na agenda" — **desmarcada por padrão**. Quando marcada, cada cobrança gerada também vira um evento em `agenda_events` (tipo `pagamento_a_receber`, que já existia no schema/UI da agenda mas nunca era criado automaticamente), visível tanto pro personal quanto pro aluno (mesma linha, filtrada por RLS — não há tabelas separadas).

- **Schema** (`20260722_billing_agenda_sync.sql`): `student_billing_subscriptions.sync_to_agenda boolean default false`; `agenda_events.financial_plan_id` (FK, nullable) linkando o evento à cobrança que o gerou; índice único parcial em `financial_plan_id` para idempotência.
- **Web**: `createAgendaEventsForCharges` em `src/lib/billing/core.ts`, chamada por `generateMonthlyChargesFor` (recorrente) e `createPackageSubscription` (pacote) quando `sync_to_agenda=true`. `registerPayment`/`undoPayment`/`cancelCharge` (`src/actions/student-billing.ts`) sincronizam o `status` do evento vinculado (`completed`/`scheduled`/`cancelled`).
- **Mobile**: mesma lógica replicada em `app/(admin)/financeiro.tsx` (funções `createAgendaEventsForCharges`, ajustes em `generateMonthlyCharges`/`saveSubscription`, e nas 3 ações do `ChargeRow`), com um `Switch` no modal de criar/editar cobrança.
- Checkbox equivalente no web: `subscription-form.tsx` (form de criação e form de edição inline).

## Lembrete persistente de cobrança pendente (aluno)

Diferente do banner de agenda (que marca "visto" e não reaparece), este lembrete **reaparece toda vez que o aluno acessa o app/portal** enquanto houver cobrança `pending`/`overdue`, até o personal dar baixa — não existe "fechar para sempre".

- **Web**: `src/components/student/StudentBillingReminderBanner.tsx`, montado em `src/app/(student)/layout.tsx` (mesmo nível do `StudentAgendaBanner`). O "X" só esconde durante a sessão/render atual (state em memória, sem `localStorage`) — ao recarregar a página, volta a aparecer se ainda houver cobrança em aberto. Só busca dados se o módulo `faturas` estiver na lista de módulos habilitados do tenant.
- **Mobile**: `src/components/notifications/StudentBillingAlertBanner.tsx`, montado no root layout (`app/_layout.tsx`) ao lado do `AgendaAlertBanner`, com Realtime (`postgres_changes` em `financial_plans`). O "X" esconde só até o app voltar de segundo plano (`AppState` → `active` reseta o dismiss), cobrindo o caso de "sempre que abrir o app". Posicionado abaixo da faixa do `AgendaAlertBanner` para não sobrepor quando os dois estiverem ativos.

## Popup de instruções (Guia do Max)

Reaproveita o sistema já existente de "Guia do Max" (`useGuide` + `GuideModal` + `src/lib/guides.ts`), o mesmo usado hoje em `routine_builder` — **não** o `ModuleOnboardingPopup` (esse é o loop de 1 módulo por login, sem link fixo pra reabrir, e não serve pro pedido). Abre sozinho na primeira vez que o **personal** acessa a tela de Financeiro; "Não mostrar mais" persiste local (localStorage no web, SecureStore no mobile, chave `guide_dismissed_faturas_cobranca_<userId>`) e depois disso só reabre pelo link "Instruções"/"Como funciona a cobrança?" na própria tela. Não aparece pro aluno (a tela dele é outro arquivo, sem o guia).

- **Conteúdo**: chave `faturas_cobranca` em `src/lib/guides.ts` (web e mobile), explicando recorrente vs pacote, como dar baixa e a opção de agenda.
- **Web**: `src/app/(dashboard)/dashboard/financeiro/financeiro-guide.tsx` (componente novo, client) — encapsula `useGuide('faturas_cobranca')` + link "Instruções" + `<GuideModal>`, montado uma única vez no header de `page.tsx` (ao lado do título, visível em qualquer aba). Scroll do modal segue o padrão já validado do `GuideModal.tsx` (`flex-1 min-h-0 overflow-y-auto` no corpo, header/footer `flex-shrink-0`) — não foi criado nada novo de layout.
- **Mobile**: `useGuide('faturas_cobranca', profile?.id)` direto em `app/(admin)/financeiro.tsx`; link "Como funciona a cobrança?" no topo da lista de alunos (`ListHeaderComponent` do `StudentListView`); `<GuideModal>` (tela cheia, `ScrollView` com `flex:1` — mesmo padrão de `planos/[id].tsx`) montado uma vez no fim do componente principal.
- Garoto-propaganda: Max Strive, igual aos outros guias — avatar `/max-avatar.png` no web, `MaxAvatar variant="happy"` no mobile, cor de identidade `#7C3AED` reservada a ele.
