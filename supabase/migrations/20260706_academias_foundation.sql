-- ============================================================
-- Fundação de dados — suporte a Academias (multi-personal)
-- Fase 1 de docs/FASES_Academias_StrivePersonal.md
--
-- Regra de segurança: TUDO aditivo. Nenhuma coluna existente é alterada,
-- renomeada ou removida. Nenhuma policy existente é tocada. Todo tenant
-- e todo aluno que já existe continua se comportando exatamente como hoje
-- (tenant_type default 'autonomo', assigned_personal_id preenchido
-- automaticamente para o dono do tenant).
-- ============================================================

-- ------------------------------------------------------------
-- 1. tenants: novo tipo de organização + limites de academia
-- ------------------------------------------------------------
alter table tenants
  add column if not exists tenant_type text not null default 'autonomo'
    check (tenant_type in ('autonomo', 'academia')),
  add column if not exists max_personals integer not null default 1,
  add column if not exists self_assign_enabled boolean not null default false;

comment on column tenants.tenant_type is
  'autonomo = personal trainer individual (comportamento atual). academia = organização com múltiplos personais/admins.';
comment on column tenants.max_personals is
  'Limite de personais ativos permitidos pelo plano. Tenants autônomos ficam sempre em 1 (o próprio dono).';
comment on column tenants.self_assign_enabled is
  'Quando true (só relevante para academia), permite que um personal se autoatribua um aluno da fila de não atribuídos.';

-- ------------------------------------------------------------
-- 2. tenant_members: vínculo pessoa <-> organização (N:N)
-- ------------------------------------------------------------
create table if not exists tenant_members (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        text not null check (role in ('owner', 'admin', 'personal')),
  status      text not null default 'active' check (status in ('active', 'invited', 'removed')),
  invited_at  timestamptz,
  joined_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, user_id)
);

comment on table tenant_members is
  'Vínculo de uma pessoa (profile) com uma organização (tenant). Um mesmo user_id pode ter várias linhas — uma por tenant em que atua (ex: personal em 2 academias, ou academia + carteira autônoma).';

create index if not exists idx_tenant_members_user_id   on tenant_members(user_id);
create index if not exists idx_tenant_members_tenant_id  on tenant_members(tenant_id);
create index if not exists idx_tenant_members_status     on tenant_members(status);

-- updated_at automático (reaproveita a função já usada em outras tabelas do projeto)
drop trigger if exists set_updated_at_tenant_members on tenant_members;
create trigger set_updated_at_tenant_members
  before update on tenant_members
  for each row execute function set_updated_at();

-- RLS — tabela nova, isolada, não afeta nenhuma policy existente
alter table tenant_members enable row level security;

-- Qualquer membro vê as próprias linhas de vínculo (em qualquer tenant)
create policy "tenant_members: ver os próprios vínculos"
  on tenant_members for select
  using (user_id = auth.uid());

-- Owner/admin de um tenant enxergam e gerenciam todos os vínculos daquele tenant
create policy "tenant_members: owner/admin gerenciam vínculos do próprio tenant"
  on tenant_members for all
  using (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = tenant_members.tenant_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = tenant_members.tenant_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('owner', 'admin')
    )
  );

-- global_admin (papel interno StrivePersonal) tem acesso irrestrito
create policy "tenant_members: global_admin acesso total"
  on tenant_members for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'global_admin'
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'global_admin'
    )
  );

-- ------------------------------------------------------------
-- 3. students: atribuição individual dentro da organização
-- ------------------------------------------------------------
alter table students
  add column if not exists assigned_personal_id uuid references tenant_members(id) on delete set null;

comment on column students.assigned_personal_id is
  'Personal responsável pelo aluno dentro do tenant (aponta para tenant_members). Nullable = aluno "não atribuído" (fila para admin resolver, ou autoatendimento se self_assign_enabled). Não limita o acesso de owner/admin, só a visão do personal.';

create index if not exists idx_students_assigned_personal_id on students(assigned_personal_id);

-- ------------------------------------------------------------
-- 4. Migração de dados — idempotente, não disruptiva
--    (safe para rodar mais de uma vez; usa ON CONFLICT / WHERE ... IS NULL)
-- ------------------------------------------------------------

-- 4.1. Todo tenant existente já nasce/permanece 'autonomo' via default acima —
--      nenhuma ação necessária nesta migration para tenants já existentes.

-- 4.2. Cria o vínculo de owner para o dono atual de cada tenant existente.
--      profiles.tenant_id é a coluna que hoje liga o personal ao seu tenant
--      (confirmado na Fase 0 via Graphify + database.ts).
insert into tenant_members (tenant_id, user_id, role, status, joined_at)
select p.tenant_id, p.id, 'owner', 'active', now()
from profiles p
where p.role = 'personal'
  and p.tenant_id is not null
on conflict (tenant_id, user_id) do nothing;

-- 4.3. Atribui todo aluno existente, ainda sem assigned_personal_id, ao
--      owner (dono) do próprio tenant — comportamento hoje é sempre "1
--      personal = todos os alunos do tenant", então isso é 100% transparente.
update students s
set assigned_personal_id = tm.id
from tenant_members tm
where tm.tenant_id = s.tenant_id
  and tm.role = 'owner'
  and tm.status = 'active'
  and s.assigned_personal_id is null;
