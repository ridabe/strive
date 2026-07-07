-- ============================================================
-- Lembrete de pagamento — canal usado no envio
--
-- Preparação para o lembrete automático de vencimento (cron diário).
-- Só e-mail está implementado agora; o enum já reserva 'whatsapp' para
-- quando um provedor for escolhido, sem precisar de nova migration.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'reminder_channel') then
    create type public.reminder_channel as enum ('email', 'whatsapp');
  end if;
end $$;

alter table public.financial_plans
  add column reminder_channel public.reminder_channel;

comment on column public.financial_plans.reminder_channel is
  'Canal usado no lembrete de vencimento (preenchido junto com reminder_sent_at). Hoje só "email" é enviado de fato — "whatsapp" existe no enum para quando um provedor for integrado.';
