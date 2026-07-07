# Spec Driven Development (SDD) - Suporte a Academias no Strive Personal

## 1. Introdução

Este documento define as especificações técnicas para implementar o suporte a academias (multi-personal, multi-tenant) no Strive Personal web, referenciando as regras de negócio de `docs/PLANEJAMENTO_Multi_Tenant_Academias.md` e os objetivos de `docs/PRD_Academias_StrivePersonal.md`. Antes de qualquer implementação real, consultar o Graphify (`/graphify`) para validar dependências existentes de `tenant_id`, RLS e módulos, conforme regra obrigatória do projeto.

## 2. Modelo de Dados

### 2.1. Alteração em `tenants`

```sql
alter table tenants
  add column tenant_type text not null default 'autonomo'
    check (tenant_type in ('autonomo', 'academia')),
  add column max_personals integer not null default 1;
```

- `tenant_type = 'autonomo'` é o default — nenhum tenant existente muda de comportamento.
- `max_personals` só é relevante para `tenant_type = 'academia'` (autônomo sempre = 1, o próprio dono).

### 2.2. Nova tabela `tenant_members`

```sql
create table tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'personal')),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index idx_tenant_members_user_id on tenant_members(user_id);
create index idx_tenant_members_tenant_id on tenant_members(tenant_id);
```

- Um `user_id` pode ter múltiplas linhas (uma por tenant), viabilizando multi-vínculo.
- `unique (tenant_id, user_id)` evita duplicidade de vínculo na mesma organização.

### 2.3. Alteração em `students`

```sql
alter table students
  add column assigned_personal_id uuid references tenant_members(id) on delete set null;

create index idx_students_assigned_personal_id on students(assigned_personal_id);
```

- Nullable — permite estado "não atribuído" (fila para admin resolver ou personal se autoatribuir, se habilitado).
- FK aponta para `tenant_members`, não para `profiles`, porque o vínculo relevante é "personal dentro daquele tenant especificamente".

### 2.4. Flag de autoatendimento por tenant

```sql
alter table tenants
  add column self_assign_enabled boolean not null default false;
```

### 2.5. Migração de dados (idempotente, não disruptiva)

```sql
-- 1. Todo tenant existente já é 'autonomo' via default — nenhuma ação necessária.

-- 2. Criar membership de owner para cada tenant existente.
insert into tenant_members (tenant_id, user_id, role, status, joined_at)
select t.id, p.id, 'owner', 'active', now()
from tenants t
join profiles p on p.tenant_id = t.id and p.role = 'personal'  -- ajustar conforme coluna real que hoje liga profile a tenant
on conflict (tenant_id, user_id) do nothing;

-- 3. Atribuir todo aluno existente ao dono do tenant.
update students s
set assigned_personal_id = tm.id
from tenant_members tm
where tm.tenant_id = s.tenant_id
  and tm.role = 'owner'
  and s.assigned_personal_id is null;
```

Nota: confirmado na Fase 0 (investigação via Graphify + leitura direta de `src/types/database.ts`) que `profiles.tenant_id` é exatamente a coluna que liga hoje o personal ao seu tenant — o join do passo 2 está correto e não precisa de ajuste.

## 3. RLS (Row Level Security)

Camadas de policy necessárias em `students` e tabelas dependentes (treinos, avaliações, frequência etc.):

1. **Isolamento por tenant** (já existe): usuário só acessa linhas do seu `tenant_id`.
2. **Isolamento por papel dentro do tenant** (novo):
   - `owner`/`admin` (via `tenant_members` com esse role e status `active`): acesso total a todas as linhas do tenant.
   - `personal`: acesso restrito a linhas onde `assigned_personal_id` corresponde ao seu próprio `tenant_members.id` naquele tenant.
3. **`global_admin`**: mantém acesso administrativo global, sem alteração.

Policy de exemplo (ilustrativa, a validar em implementação):

```sql
create policy "personal_ve_apenas_seus_alunos"
on students for select
using (
  exists (
    select 1 from tenant_members tm
    where tm.tenant_id = students.tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
      and (
        tm.role in ('owner', 'admin')
        or students.assigned_personal_id = tm.id
      )
  )
);
```

Auditar toda função/view que hoje assume implicitamente "1 tenant = 1 personal" (relatórios, exports, dashboards agregados) antes de liberar para academias — listar essas queries via Graphify (`/graphify query "relatórios que dependem de tenant_id"`).

### 3.1. Achado da Fase 0 — o trabalho de RLS é aditivo, não uma reescrita

Toda policy de isolamento por tenant hoje segue o padrão `tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)`, repetido inline em cada migration (sem função central `get_tenant_id()`) — confirmado em pelo menos 7 arquivos (`workout_module`, `agenda_student_requests`, `minha_agenda`, `ai_usage_events`, `student_messages`, `challenges_module`, `trainer_notifications`).

Como `profiles.tenant_id` já representa "o tenant ativo da sessão" (é o mesmo campo que o seletor de organização atualiza — ver seção 4.1), **essas policies não precisam ser reescritas**: owner, admin e personal autônomo continuam com acesso total ao tenant ativo exatamente como hoje. O trabalho real é adicionar, apenas nas tabelas relacionadas a `students` (treinos, avaliações, frequência, feedbacks etc.), uma condição extra tipo:

```sql
and (
  (select role from tenant_members where tenant_id = students.tenant_id and user_id = auth.uid() and status = 'active') in ('owner', 'admin')
  or students.assigned_personal_id = (
    select id from tenant_members where tenant_id = students.tenant_id and user_id = auth.uid() and status = 'active'
  )
  or (select tenant_type from tenants where id = students.tenant_id) = 'autonomo'
)
```

Ou seja: personal autônomo cai no último `or` e mantém acesso total (comportamento inalterado); dentro de uma academia, só owner/admin ou o personal atribuído passam.

## 4. Contexto de Organização (seletor de login)

### 4.0. Achado da Fase 0 — este mecanismo já existe para alunos, é só replicar para personal

O padrão abaixo **já está implementado e em produção** para o papel `student`:

- `src/app/(student)/layout.tsx` busca todos os `students` com `status = 'active'` do `user_id` logado; se houver mais de um e nenhum bater com `profiles.tenant_id` atual, redireciona para `/student/trocar-personal`.
- `src/app/(student)/student/trocar-personal/page.tsx` lista as organizações com vínculo ativo.
- `src/app/actions/student-tenant.ts` → `selectActiveTenant(tenantId)` revalida o vínculo ativo e então atualiza `profiles.tenant_id` — é essa atualização que "troca" o tenant ativo da sessão (o mesmo campo que toda RLS já usa, ver 3.1).

A implementação para `personal` deve **copiar esse padrão**, trocando a fonte de "vínculos ativos" de `students` para `tenant_members`:

### 4.1. Lógica de resolução no login/dashboard do personal

1. No layout do dashboard (`src/app/(dashboard)/dashboard/layout.tsx` ou equivalente), buscar todos os `tenant_members` com `status = 'active'` do `user_id` logado.
2. Se houver exatamente 1 vínculo → segue direto (comportamento atual de personal autônomo, inalterado).
3. Se houver 2+ vínculos e nenhum bater com `profiles.tenant_id` atual → redirecionar para uma tela nova `/dashboard/trocar-organizacao` (equivalente a `/student/trocar-personal`).
4. Nova server action `selectActiveOrg(tenantId)` (mesmo formato de `selectActiveTenant`): revalida que existe um `tenant_members` ativo para aquele `user_id` + `tenantId`, só então atualiza `profiles.tenant_id`.
5. Adicionar um link "Trocar de organização" no menu do dashboard quando houver múltiplos vínculos ativos (mesmo padrão do botão "Trocar de Personal" já existente no layout do aluno).

### 4.2. Superfícies a construir

- `/dashboard/trocar-organizacao` (página nova, personal) — mesma estrutura visual de `/student/trocar-personal`, adaptada para listar tenants via `tenant_members`.
- `selectActiveOrg(tenantId)` (server action nova, mesma lógica de `selectActiveTenant`).
- Link/botão de troca no header ou sidebar do dashboard, condicionado a `hasMultipleActiveOrgs` (mesmo padrão de `hasMultipleActiveTenants` no layout do aluno).
- App mobile do aluno já não precisa de nada novo aqui — o mecanismo de aluno já existe; só precisa ser reconfirmado quando o aluno pertencer a uma academia (o `tenant_id` resolvido é o mesmo, academia ou autônomo).
- Ponto a decidir antes da Fase 4 (ver Fase 0 no doc de fases): se o filtro deve continuar sendo só `status = 'active'` do vínculo, ou também considerar o `tenant_type`/status do tenant.

## 5. Server Actions e APIs (novas ou alteradas)

- `createTenantMember(tenantId, email, role)` — convite de personal/admin. Valida `max_personals` antes de criar.
- `acceptTenantInvite(inviteToken)` — aceite de convite, cria/atualiza linha em `tenant_members`.
- `removeTenantMember(tenantMemberId)` — bloqueia se houver alunos com `assigned_personal_id` apontando para esse membro; força reatribuição antes.
- `assignStudentToPersonal(studentId, tenantMemberId)` — usado por owner/admin (e por personal, se `self_assign_enabled` e aluno não atribuído).
- `resolveActiveMemberships(userId)` — usada no login e no app mobile para decidir se mostra o seletor de organização.
- Server actions existentes (`createStudent`, `createWorkoutPlan` etc.) precisam validar/gravar `assigned_personal_id` quando `tenant_type = 'academia'`, mantendo comportamento atual para `autonomo`.

Todas seguem o padrão já estabelecido no projeto (`'use server'`, nunca receber `tenant_id` não validado como parâmetro — sempre resolvido via sessão/RLS).

**Achado da Fase 0 / implementado na Fase 2:** `getCtx()` (`src/lib/supabase/context.ts`) é o resolvedor central usado por dezenas de server actions no dashboard (58 conexões no grafo) — resolve `{ supabase, tenantId, role }` direto de `profiles.tenant_id` + `profiles.role`. Atualizado na Fase 2 para, de forma retrocompatível, resolver o `role` efetivo via `tenant_members` quando o tenant ativo é `academia` (uma pessoa pode ser `admin` numa academia e `personal` em outra — `profiles.role` sozinho não distingue isso). Para `tenant_type = 'autonomo'`, comportamento idêntico ao anterior (só 1 leitura extra e barata de `tenant_type`, sem consulta a `tenant_members`). Formato de retorno inalterado — os ~58 call sites não precisaram de nenhuma mudança. `requirePersonalCtx()` (visto no grafo com 29 conexões) é um helper local só do módulo de desafios, não um ponto central — não exigiu atenção especial.

## 6. Admin Global (`/admin`)

Novas telas/ações no painel do `global_admin`:

- Criar tenant do tipo `academia` manualmente: nome, branding inicial, plano, `max_students`, `max_personals`, `self_assign_enabled`.
- Vincular/criar `abacatepay_customer_id` para a academia (mesma integração já usada para tenants autônomos, acionada manualmente em vez de via checkout).
- Editar limites e plano de uma academia existente.
- Listar academias com contagem de personais ativos / alunos / uso de limite.

## 7. Módulos (`tenant_modules`)

- Nenhuma alteração de schema necessária — módulos exclusivos de academia (ex.: estoque, quando desenvolvido) usam o mecanismo de toggle já existente, condicionado no código a `tenant_type = 'academia'`.
- Esta fase **não** implementa o módulo de estoque em si — apenas garante que a fundação (`tenant_type`) já permite condicioná-lo no futuro.

## 8. Impacto no App Mobile

- Consumir `resolveActiveMemberships` (ou endpoint equivalente) no fluxo de login para decidir se exibe seletor de organização antes do dashboard do aluno.
- Branding dinâmico (`logo_url`, `primary_color`, `app_name`) já é buscado por `tenant_id` — passa a ser buscado pelo `tenant_id` da organização selecionada, sem mudança de mecanismo.
- Nenhuma mudança nas telas de treino, progresso, frequência etc.

## 9. Testes e Verificação

- Testes de RLS: personal A não deve conseguir ler/escrever aluno atribuído a personal B na mesma academia.
- Teste de migração: rodar migração num dump de produção (staging) e validar que todo tenant autônomo continua funcional sem nenhuma tela nova aparecendo.
- Teste de multi-vínculo: mesmo `user_id` em 2 tenants → seletor aparece; em 1 tenant → não aparece.
- Teste de remoção de personal: tentar remover com alunos ainda atribuídos deve falhar com mensagem clara.
- Lint guard (`strive-lint-guard`) obrigatório após cada arquivo `.ts`/`.tsx` tocado, conforme regra do projeto.
- Ao final da fase de fundação e da fase de RLS (mudanças críticas), rodar `graphify update .`.
