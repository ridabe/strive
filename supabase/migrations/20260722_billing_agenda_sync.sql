-- ============================================================
-- Cobrança na agenda (opt-in) — Etapa 2
--
-- Contexto: o personal pode querer que o vencimento de cada cobrança apareça
-- também na agenda (dele e do aluno, já que agenda_events é uma tabela única
-- filtrada por RLS). Isso é opcional por assinatura (recorrente ou pacote) —
-- desmarcado por padrão, para não mudar o comportamento de quem já usa
-- cobrança hoje.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Opt-in por assinatura
-- ------------------------------------------------------------
alter table public.student_billing_subscriptions
  add column if not exists sync_to_agenda boolean not null default false;

comment on column public.student_billing_subscriptions.sync_to_agenda is
  'Quando true, cada cobrança gerada (mensal ou parcela de pacote) também cria um evento em agenda_events (type=pagamento_a_receber). Desmarcado por padrão.';

-- ------------------------------------------------------------
-- 2. Link entre a cobrança e o evento de agenda gerado a partir dela
-- ------------------------------------------------------------
alter table public.agenda_events
  add column if not exists financial_plan_id uuid references public.financial_plans(id) on delete cascade;

comment on column public.agenda_events.financial_plan_id is
  'Preenchido quando o evento foi gerado automaticamente a partir de uma cobrança (student_billing_subscriptions.sync_to_agenda). Null para eventos criados manualmente.';

-- Evita duplicar o evento de agenda da mesma cobrança em reprocessamentos
-- (idempotência, mesmo padrão do índice único de financial_plans por mês).
create unique index if not exists agenda_events_financial_plan_uidx
  on public.agenda_events(financial_plan_id)
  where financial_plan_id is not null;
