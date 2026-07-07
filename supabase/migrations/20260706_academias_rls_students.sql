-- ============================================================
-- RLS por papel/atribuição — Fase 2 de docs/FASES_Academias_StrivePersonal.md
--
-- Objetivo: personal dentro de uma academia só enxerga/edita os alunos
-- atribuídos a si; owner/admin continuam com acesso total ao tenant;
-- personal autônomo mantém 100% do comportamento atual (zero mudança).
--
-- Estratégia de segurança: como Postgres combina múltiplas policies
-- permissivas com OR, não é possível "restringir" apenas adicionando
-- uma policy nova — é preciso substituir a policy existente por uma
-- versão que inclui a condição extra. Mitigamos o risco assim:
--   1. A nova condição é sempre TRUE para tenant_type = 'autonomo',
--      que é o caso de 100% dos tenants em produção hoje — nenhuma
--      mudança de comportamento observável.
--   2. Toda a lógica fica centralizada em uma função só
--      (can_view_student), testável isoladamente antes do swap.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Papel do usuário autenticado dentro de um tenant específico
-- ------------------------------------------------------------
create or replace function public.tenant_member_role(p_tenant_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.tenant_members
  where tenant_id = p_tenant_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

comment on function public.tenant_member_role(uuid) is
  'Papel (owner/admin/personal) do usuário autenticado dentro de um tenant específico, via tenant_members. Retorna null se não houver vínculo ativo naquele tenant.';

-- ------------------------------------------------------------
-- 2. Regra central de visibilidade/edição de um aluno
-- ------------------------------------------------------------
create or replace function public.can_view_student(p_tenant_id uuid, p_assigned_personal_id uuid)
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
      or public.tenant_member_role(p_tenant_id) in ('owner', 'admin')
      or p_assigned_personal_id = (
        select id from public.tenant_members
        where tenant_id = p_tenant_id and user_id = auth.uid() and status = 'active'
        limit 1
      )
    );
$$;

comment on function public.can_view_student(uuid, uuid) is
  'Regra central de acesso a um aluno dentro do tenant ativo do usuário: tenant autônomo e owner/admin de academia sempre veem tudo; personal de academia só vê/edita o aluno cujo assigned_personal_id bate com o seu próprio vínculo (tenant_members.id). Usada hoje pela policy de students; tabelas dependentes (treinos, avaliações etc.) devem migrar para a mesma função na Fase 2b, uma de cada vez.';

-- ------------------------------------------------------------
-- 3. Substitui a policy de CRUD do personal em `students`
-- ------------------------------------------------------------
drop policy if exists "students: personal CRUD no próprio tenant" on public.students;

create policy "students: personal CRUD no próprio tenant"
  on public.students for all
  using (public.can_view_student(tenant_id, assigned_personal_id))
  with check (public.can_view_student(tenant_id, assigned_personal_id));

-- Policies não tocadas (mantidas exatamente como estavam):
--   "students: aluno vê próprio registro"   (SELECT, user_id = auth.uid())
--   "students: global_admin vê tudo"        (SELECT, get_my_role() = 'global_admin')
