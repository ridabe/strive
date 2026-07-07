-- ============================================================
-- Cobrança recorrente de alunos — Etapa 1 (schema + RLS)
--
-- Contexto: hoje financial_plans é criado manualmente, sem recorrência.
-- Esta migration adiciona a "regra" de recorrência (student_billing_subscriptions)
-- e os campos de auditoria de baixa em financial_plans (quem deu baixa,
-- forma de pagamento, lembrete enviado).
--
-- Acesso: personal NUNCA acessa financeiro (nem academia, nem autônomo
-- teria sentido, mas a regra vale igual). Em tenant autônomo, o próprio
-- personal é o dono do negócio — mantém acesso total (nenhuma mudança de
-- comportamento). Em academia, só owner/admin/gerente/operador.
--
-- Bug corrigido: a policy antiga "financial_plans: personal CRUD no
-- próprio tenant" usava can_view_student_by_id(), que retorna true para
-- o personal de academia atribuído ao aluno — ou seja, hoje o personal
-- de academia CONSEGUE ler/editar financeiro do próprio aluno. Esta
-- migration substitui essa policy por can_manage_billing(), que exclui
-- personal em qualquer contexto de academia.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enum de forma de pagamento (baixa manual)
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('dinheiro', 'pix_manual', 'transferencia', 'cartao_manual', 'outro');
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. Regra de recorrência por aluno
-- ------------------------------------------------------------
create table public.student_billing_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id),
  student_id  uuid not null references public.students(id),
  plan_name   text not null default 'Mensalidade',
  amount      numeric(10,2) not null check (amount > 0),
  due_day     smallint not null check (due_day between 1 and 28),
  active      boolean not null default true,
  started_at  date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id)
);

comment on table public.student_billing_subscriptions is
  'Regra recorrente de cobrança de um aluno (valor + dia de vencimento). financial_plans é gerado mensalmente a partir daqui.';

create index student_billing_subscriptions_tenant_idx on public.student_billing_subscriptions(tenant_id) where active;

alter table public.student_billing_subscriptions enable row level security;

-- ------------------------------------------------------------
-- 3. Helper: quem pode gerenciar (ver + dar baixa) o financeiro do aluno
-- ------------------------------------------------------------
create or replace function public.can_manage_billing(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_tenant_id = public.get_my_tenant_id()
    and (
      coalesce((select tenant_type from public.tenants where id = p_tenant_id), 'autonomo') = 'autonomo'
      or public.tenant_member_role(p_tenant_id) in ('owner', 'admin', 'gerente', 'operador')
    );
$$;

comment on function public.can_manage_billing(uuid) is
  'Acesso ao financeiro de alunos (ver cobranças, dar baixa, gerenciar recorrência). Tenant autônomo: sempre true (o personal é o dono do negócio). Academia: só owner/admin/gerente/operador — personal (staff) nunca, mesmo para aluno atribuído a ele.';

create policy "student_billing_subscriptions: gestão financeira"
  on public.student_billing_subscriptions for all
  using (can_manage_billing(tenant_id))
  with check (can_manage_billing(tenant_id));

-- ------------------------------------------------------------
-- 4. financial_plans — novas colunas de auditoria de baixa
-- ------------------------------------------------------------
alter table public.financial_plans
  add column subscription_id  uuid references public.student_billing_subscriptions(id),
  add column paid_by          uuid references public.profiles(id),
  add column payment_method   public.payment_method,
  add column reminder_sent_at timestamptz;

comment on column public.financial_plans.paid_by is 'Quem deu a baixa manual (profiles.id) — auditoria para o owner/admin.';
comment on column public.financial_plans.subscription_id is 'Assinatura recorrente que gerou esta cobrança (null = cobrança avulsa, como hoje).';

-- Evita gerar 2 cobranças do mesmo mês para a mesma assinatura.
-- (extract() em vez de date_trunc(): date_trunc não é IMMUTABLE para uso em índice)
create unique index financial_plans_subscription_month_uidx
  on public.financial_plans(subscription_id, extract(year from due_date), extract(month from due_date))
  where subscription_id is not null;

create index financial_plans_tenant_due_idx on public.financial_plans(tenant_id, due_date, status);

-- ------------------------------------------------------------
-- 5. Corrige RLS de financial_plans — personal de academia deixa de ter acesso
-- ------------------------------------------------------------
drop policy if exists "financial_plans: personal CRUD no próprio tenant" on public.financial_plans;
drop policy if exists "financial_plans: operacao SELECT" on public.financial_plans;

create policy "financial_plans: gestão financeira"
  on public.financial_plans for all
  using (can_manage_billing(tenant_id))
  with check (can_manage_billing(tenant_id));

-- Mantida sem alteração: "financial_plans: aluno vê próprios planos financeiros"
