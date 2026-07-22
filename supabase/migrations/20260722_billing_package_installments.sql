-- ============================================================
-- Cobrança em pacote (N meses fechados) — Etapa 1 (schema)
--
-- Contexto: hoje student_billing_subscriptions só suporta recorrência
-- mensal automática (gera 1 financial_plans por mês, indefinidamente).
-- O personal também precisa poder fechar um pacote de N meses de uma vez
-- (ex.: 6 meses), gerando já todas as parcelas, e dar baixa mês a mês —
-- só sendo avisado para renovar quando o pacote inteiro for quitado.
--
-- Esta migration não recria nada: apenas adiciona billing_type e
-- total_installments em student_billing_subscriptions. A geração em lote
-- das parcelas de um pacote é feita pela nova action
-- createPackageSubscription (Etapa 2), não por esta migration.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enum do tipo de cobrança
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'billing_type') then
    create type public.billing_type as enum ('recorrente', 'pacote');
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. Novas colunas em student_billing_subscriptions
-- ------------------------------------------------------------
alter table public.student_billing_subscriptions
  add column if not exists billing_type       public.billing_type not null default 'recorrente',
  add column if not exists total_installments smallint check (total_installments is null or total_installments between 1 and 24);

comment on column public.student_billing_subscriptions.billing_type is
  'recorrente: gera 1 cobrança por mês automaticamente (comportamento atual). pacote: todas as parcelas (total_installments) já são geradas de uma vez na criação, sem geração automática mensal.';

comment on column public.student_billing_subscriptions.total_installments is
  'Só preenchido quando billing_type = pacote. Número de parcelas mensais geradas de uma vez (ex.: 6 = pacote de 6 meses).';

-- Pacote sem número de parcelas não faz sentido; recorrente não deve ter.
alter table public.student_billing_subscriptions
  add constraint student_billing_subscriptions_pacote_installments_chk
  check (
    (billing_type = 'pacote' and total_installments is not null)
    or (billing_type = 'recorrente' and total_installments is null)
  );
