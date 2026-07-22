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

## Notas para implementação mobile

- Queries: mesmas tabelas (`student_billing_subscriptions`, `financial_plans`), RLS já cobre o aluno autenticado — reaproveitar as policies existentes sem mudança.
- Tela do aluno: replicar o que foi feito em `/student/financeiro` — card da assinatura (com badge de progresso quando `billing_type = 'pacote'`), lista "em aberto" e histórico. Tudo somente leitura.
- Personal (se o mobile também atender personal/academia): replicar o seletor recorrente/pacote e o fluxo de dar baixa (`registerPayment`/`undoPayment`/`cancelCharge`), chamando as mesmas server actions via RPC/Edge Function equivalente ou refazendo a lógica client-side com o SDK do Supabase (sem gateway de pagamento — é tudo update direto de `financial_plans`).
- Notificação ao aluno: hoje é pull (o aluno abre a tela e vê o status atualizado). Se o mobile quiser push, seria necessário criar uma tabela/canal de notificação disparado no `registerPayment` — não existe hoje.
