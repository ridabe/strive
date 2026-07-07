# Fases de Implementação - Suporte a Academias no Strive Personal

Roadmap de execução da feature descrita em `PRD_Academias_StrivePersonal.md` e `SPEC_Academias_StrivePersonal.md`. Cada fase é independentemente entregável e não quebra o comportamento de tenants autônomos existentes. Seguir sempre o fluxo do projeto: consultar Graphify antes de iniciar cada fase, implementar, rodar `strive-lint-guard`, e atualizar o Graphify (`graphify update .`) ao final das fases marcadas como críticas.

---

## Fase 0 — Preparação (CONCLUÍDA em 2026-07-06)

Investigação feita via Graphify (`graphify-out/GRAPH_REPORT.md`) + leitura direta do código. Achados que mudam/confirmam o desenho do SPEC:

### 0.1. `profiles.tenant_id` confirmado como o campo de vínculo

A coluna que liga um personal ao seu tenant é literalmente `profiles.tenant_id` (nullable, FK para `tenants`). A migration de dados desenhada no SPEC (`profiles.tenant_id = tenants.id and profiles.role = 'personal'`) está correta — não precisa de ajuste.

### 0.2. Já existe um seletor de organização em produção — para alunos

O sistema **já implementa** o exato mecanismo planejado para a Fase 4, só que hoje limitado ao aluno:

- `src/app/(student)/layout.tsx`: busca todos os vínculos `students` ativos (`status = 'active'`) do `user_id` logado. Se houver mais de um, compara com `profiles.tenant_id` atual; se não bater com nenhum, redireciona para `/student/trocar-personal`.
- `src/app/(student)/student/trocar-personal/page.tsx`: lista as organizações onde o aluno tem vínculo ativo e deixa escolher.
- `src/app/actions/student-tenant.ts` → `selectActiveTenant(tenantId)`: revalida que o aluno realmente tem uma linha `students` ativa naquele `tenant_id` antes de atualizar `profiles.tenant_id` — é isso que "troca" a organização ativa da sessão.

**Impacto no planejamento:** a Fase 4 deixa de ser "construir do zero" e passa a ser "replicar o mesmo padrão para personal", reduzindo risco — é um padrão já testado em produção. O componente de seleção de organização não precisa ser genérico entre aluno/personal na V1 (o SPEC sugeria isso); mais seguro copiar o padrão existente para uma rota equivalente do personal (ex.: `/dashboard/trocar-organizacao` + `selectActiveOrg()`), e só unificar depois se fizer sentido.

**Ponto a validar com o usuário antes da Fase 4:** o switcher atual filtra por `students.status = 'active'`, não pelo status do tenant. Ou seja, se o vínculo antigo do aluno com um personal autônomo nunca foi marcado como inativo (o `student.status` continua `active` mesmo que o personal tenha parado de usar o sistema), ele já aparece como opção hoje. Se o personal antigo *cancelou a assinatura* (tenant inativo) mas o `student.status` permanece `active`, também aparece — o que já atende ao pedido original. Só não cobre o caso de o `student.status` ter sido explicitamente marcado como inativo — nesse caso, hoje o aluno simplesmente não vê mais aquele vínculo. Avaliar se isso precisa mudar.

### 0.3. Padrão de RLS confirmado: subquery inline em `profiles.tenant_id`, sem função central

Toda policy de isolamento por tenant hoje segue este padrão, repetido em cada migration (não existe uma função SQL central tipo `get_tenant_id()`):

```sql
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1))
```

Localizado literalmente em 7 arquivos de migration (`workout_module`, `agenda_student_requests`, `minha_agenda`, `ai_usage_events`, `student_messages`, `challenges_module`, `trainer_notifications`) — provavelmente mais tabelas usam variações próximas do mesmo padrão.

**Impacto no planejamento:** boa notícia — como `profiles.tenant_id` já é (e continua sendo) o "tenant ativo da sessão", **a maioria das policies de isolamento por tenant não precisa mudar** quando um personal de academia troca de organização — o mecanismo de switch já resolve isso reaproveitando o mesmo campo. O trabalho real da Fase 2 é **aditivo**: para tabelas relacionadas a `students` (treinos, avaliações, frequência etc.), adicionar uma condição extra que, quando `role = 'personal'` E o tenant é `academia`, também exige `assigned_personal_id` bater — sem tocar nas policies de owner/admin/autônomo, que continuam com acesso total ao tenant como já é hoje.

### 0.4. `getCtx()` é o resolvedor central (58 conexões no grafo) — ponto de maior impacto

`src/lib/supabase/context.ts` → `getCtx()` retorna `{ supabase, tenantId, role }` a partir de `profiles.tenant_id` + `profiles.role`, e é consumido em dezenas de server actions no dashboard do personal. Esta função precisa ganhar, de forma retrocompatível: quando o tenant ativo é `academia`, resolver o `role` efetivo a partir de `tenant_members` (porque uma pessoa pode ser `admin` numa academia e `personal` em outra, e `profiles.role` sozinho não captura isso); quando é `autonomo`, comportamento 100% inalterado. `requirePersonalCtx()` é local ao módulo de desafios (não é um helper global, apesar do nome parecido) — não precisa de atenção especial além do próprio módulo.

**Crítica?** Não (fase de investigação, sem mudança de código) — mas os achados acima já reduzem escopo e risco da Fase 1, 2 e 4.

---

## Fase 1 — Fundação de dados (CONCLUÍDA em 2026-07-06)

Objetivo: existir a estrutura de dados sem nenhuma mudança visível para quem já usa o sistema.

- Migration: `tenants.tenant_type`, `tenants.max_personals`, `tenants.self_assign_enabled`, tabela `tenant_members`, `students.assigned_personal_id`.
- Migration de dados: todo tenant existente vira `autonomo`, ganha membership `owner` para o dono atual, todo aluno existente recebe `assigned_personal_id` apontando para esse membership.
- Regenerar `src/types/database.ts` (`supabase gen types typescript ... > src/types/database.ts`, nunca `>>`) e validar duplicatas conforme regra do projeto.
- Nenhuma tela nova ainda — é puramente estrutural.

**Critério de saída:** `tsc --noEmit` limpo, sistema atual funcionando 100% igual para tenants autônomos, dados migrados conferidos por amostragem.

### Verificação pós-aplicação (feita via Supabase MCP + tsc local)

- Migration `supabase/migrations/20260706_academias_foundation.sql` aplicada em produção (projeto `lodetzmtsymvnjffmvat`) pelo usuário.
- Colunas confirmadas via `information_schema.columns`: `tenants.tenant_type` (`text`, default `'autonomo'`, not null), `tenants.max_personals` (`integer`, default `1`, not null), `tenants.self_assign_enabled` (`boolean`, default `false`, not null), `students.assigned_personal_id` (`uuid`, nullable).
- Os 2 tenants existentes permanecem 100% `tenant_type = 'autonomo'`, `max_personals = 1`, `self_assign_enabled = false` — nenhuma mudança de comportamento para quem já usa o sistema.
- `tenant_members`: 2 linhas criadas (uma por tenant, role `owner`) — RLS habilitado, sem alerta de "RLS sem policy" no advisor de segurança.
- `students`: 15/15 alunos existentes receberam `assigned_personal_id` apontando para o membership do dono — nenhum aluno ficou "não atribuído" pela migração.
- `get_advisors` (security): nenhum alerta novo introduzido por esta migration — todos os itens listados já eram pré-existentes (funções sem `search_path`, buckets públicos, etc.), sem relação com `tenant_members`/`tenant_type`/`assigned_personal_id`.
- `src/types/database.ts` regenerado direto do schema real (via `generate_typescript_types`), sobrescrito por completo (não appendado) — `export type Database` e `export const Constants` aparecem exatamente 1 vez cada, sem null bytes, arquivo termina corretamente em `} as const`.
- `npx tsc --noEmit --skipLibCheck`: 25 erros encontrados, todos em 4 arquivos que já apareciam modificados no `git status` **antes** desta sessão mexer em qualquer coisa (`dashboard/alunos/page.tsx`, `dashboard/alunos/[id]/page.tsx`, `app/page.tsx`, `admin-sidebar.tsx` — JSX truncado, problema pré-existente no working tree, não relacionado a esta migration). Nenhum erro novo em qualquer arquivo tocado por esta fase.

**Pendência a resolver antes da Fase 2, fora do escopo desta migration:** os 4 arquivos com JSX truncado listados acima parecem ter sido corrompidos em edição anterior (padrão já documentado no `CLAUDE.md` do projeto — Write truncando arquivo >18KB). Recomendo rodar a skill `strive-lint-guard` ou revisar esses arquivos antes de seguir, para não confundir esse problema pré-existente com algo introduzido pela feature de academias.

**Crítica?** Sim — mudança estrutural de banco. `graphify update .` já foi rodado (confirmado 2026-07-06): commit indexado bate com `git rev-parse HEAD`, e `src/types/database.ts` aparece re-extraído (AST hash atualizado) no manifest. Por desenho, esse comando rápido só reprocessa `.ts`/`.tsx` via AST — a migration SQL e os docs novos (PRD/SPEC/FASES/PLANEJAMENTO) não entram nessa passada (exigiriam o fluxo manual `/graphify --update` com subagents para extração semântica), o que está de acordo com a regra do próprio projeto de não usar o fluxo pesado para mudanças já bem documentadas fora do código. Fase 1 encerrada.

---

## Fase 2 — RLS e permissões (núcleo concluído em 2026-07-06; Fase 2b pendente)

Objetivo: as três camadas de acesso (tenant, papel, atribuição) funcionando corretamente e testadas.

- Policies novas em `students` e tabelas dependentes (treinos, avaliações, frequência, feedbacks etc.) considerando `tenant_members.role` e `assigned_personal_id`.
- Testes automatizados/manuais: personal A não acessa aluno de personal B na mesma academia; owner/admin acessam tudo; personal autônomo continua acessando tudo (papel owner+personal implícito).
- Auditoria das queries/relatórios mapeados na Fase 0 — corrigir qualquer ponto que vazasse dados entre personais de uma mesma academia.

**Critério de saída:** suíte de testes de isolamento passando, nenhuma regressão em RLS de tenants autônomos.

### O que foi feito (núcleo — `supabase/migrations/20260706_academias_rls_students.sql`)

- Função `public.tenant_member_role(p_tenant_id)`: resolve o papel (owner/admin/personal) do usuário autenticado dentro de um tenant específico, via `tenant_members`.
- Função `public.can_view_student(p_tenant_id, p_assigned_personal_id)`: regra central de acesso a um aluno — sempre `true` para tenant autônomo (nenhuma mudança de comportamento hoje) ou para owner/admin de academia; para personal de academia, exige que `assigned_personal_id` bata com o próprio vínculo.
- Policy `"students: personal CRUD no próprio tenant"` substituída para usar `can_view_student(tenant_id, assigned_personal_id)` no lugar do antigo `tenant_id = get_my_tenant_id()` puro. As outras duas policies de `students` (aluno vê próprio registro, global_admin vê tudo) não foram tocadas.
- Verificado via `get_advisors`: nenhum alerta novo de severidade além do mesmo padrão (`SECURITY DEFINER` chamável via RPC) que as funções `get_my_role`/`get_my_tenant_id` já tinham antes — nada pior que o já existente.
- `getCtx()` (`src/lib/supabase/context.ts`) atualizado: para role `personal`, se o tenant ativo for `academia`, resolve o papel efetivo via `tenant_members` (pode ser owner/admin/personal ali); para tenant `autonomo`, comportamento idêntico a antes, sem consulta extra além de 1 leitura barata de `tenant_type`. Formato de retorno (`{ supabase, tenantId, role }`) inalterado — os ~58 pontos de código que consomem `getCtx()` continuam funcionando sem alteração.
- `tsc --noEmit` limpo para este arquivo (os únicos erros remanescentes no projeto são os 4 arquivos pré-existentes não relacionados, ver nota abaixo).

### Nota de ferramental (não é bug do projeto)

Durante esta fase identifiquei que o mount Linux usado para rodar `tsc`/`git diff` neste ambiente às vezes fica dessincronizado do arquivo real (Windows). Os 4 arquivos que eu tinha reportado como "JSX truncado" no fechamento da Fase 1 (`dashboard/alunos/page.tsx`, `dashboard/alunos/[id]/page.tsx`, `app/page.tsx`, `admin-sidebar.tsx`) foram reverificados diretamente no arquivo real e **estão corretos — não havia nada para corrigir**, era o mount desatualizado. Nenhuma alteração foi feita neles. Para as mudanças desta fase (`context.ts`), confirmei o conteúdo real via leitura direta do arquivo antes de considerar qualquer verificação de `tsc` válida.

### Fase 2b — tabelas dependentes (CONCLUÍDA em 2026-07-06 — `supabase/migrations/20260706_academias_rls_fase2b.sql`)

**Catálogo/recursos compartilhados do tenant (decidido não tocar — todo personal da academia continua vendo o catálogo inteiro):** `exercises`, `exercise_combos`, `exercise_combo_items`, `exercise_embeddings`, `food_items`, `anamnese_templates`, `tenant_modules`, `subscriptions`, `challenges`, `challenge_days`, `challenge_day_items`, `challenge_messages`, `trainer_notifications`, `profiles`, `tenants`, `tenant_members`.

**Dados individuais do aluno — 23 tabelas migradas** (`workout_plans`, `workout_routines`, `workout_items`, `workout_exercises`, `workout_sessions`, `workout_session_exercises`, `workout_feedbacks`, `extra_workouts`, `extra_workout_items`, `physical_assessments`, `attendance`, `financial_plans`, `agenda_events`, `anamnese_responses`, `student_messages`, `student_progress`, `student_plan_assignments`, `meal_plans`, `student_meal_plan_assignments`, `challenge_participants`, `shared_files`, `ai_conversations`, `ai_messages`, `ai_usage_events`):

- Nova função `public.can_view_student_by_id(p_student_id)`: atalho para `can_view_student()` a partir de um `student_id`, resolvendo `tenant_id`/`assigned_personal_id` do próprio registro do aluno. Evita repetir o join em cada policy.
- Cada policy de personal foi recriada preservando **exatamente** a condição original (mesmo texto de `tenant_id`/`role`), só **acrescentando** a checagem de atribuição — nada além disso mudou.
- Tabelas sem `student_id` direto (`workout_routines`, `workout_items`, `workout_exercises`, `extra_workout_items`, `workout_session_exercises`, `ai_messages`) usam `EXISTS` com join até a tabela pai (`workout_plans`, `extra_workouts`, `workout_sessions`, `ai_conversations`) para chegar no aluno.
- Colunas `student_id` nullable (`agenda_events`, `ai_usage_events`, `extra_workouts`, `meal_plans`, `shared_files`, `workout_plans` e, por herança, `workout_routines`/`workout_items`/`workout_exercises`/`extra_workout_items`) usam o padrão `student_id IS NULL OR can_view_student_by_id(student_id)` — registro não vinculado a um aluno específico (template, arquivo geral do tenant) continua visível a qualquer personal, sem restrição.
- Policies que já incluíam `global_admin` no mesmo `role = ANY(...)` (`agenda_events` x2, `meal_plans_tenant_write`) ganharam bypass explícito `get_my_role() = 'global_admin' OR ...`, para não quebrar o acesso do admin global (que não tem `tenant_id` necessariamente alinhado ao tenant do aluno).

**Verificação:** contagem de linhas de todas as 23 tabelas comparada antes/depois da migration (via conexão direta, que ignora RLS) — idêntica em 100% dos casos, confirmando que nenhum dado foi afetado pela migration em si. `get_advisors` (security) rodado depois: nenhum alerta novo além do mesmo padrão de "função SECURITY DEFINER chamável via RPC" que as funções já existentes (`get_my_role`, `get_my_tenant_id`) já tinham — nada pior que o risco já aceito no projeto.

**Atualização 2026-07-06 — teste ponta a ponta executado e confirmado:** ao contrário do que essa nota original previa, foi possível simular um usuário autenticado via SQL direto (`SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = '<uuid>';`, que é exatamente como `auth.uid()` resolve o usuário nesta base), sem precisar esperar a Fase 3 estar em produção real. Teste executado com dados 100% descartáveis:

1. Criados 2 usuários de teste (`auth.users` + `profiles` auto-criado via trigger `handle_new_user`), um tenant `tenant_type='academia'` de teste, 2 vínculos em `tenant_members` (`owner` e `personal`), 2 alunos de teste (um atribuído a cada um) e 1 registro em `physical_assessments` por aluno (para cobrir também uma tabela dependente da Fase 2b, não só `students`).
2. Simulado como o `personal` comum: `SELECT * FROM students` retornou **apenas** o aluno atribuído a ele — o aluno do owner não apareceu. Mesmo resultado em `physical_assessments` (tabela dependente via `can_view_student_by_id`).
3. Simulado como o `owner`: viu os **dois** alunos, confirmando o bypass de owner/admin funciona como desenhado.
4. Toda a massa de teste foi apagada ao final (`DELETE` do tenant — cascata cobre `tenant_members`/`students`; `DELETE` dos 2 `auth.users` — cascata cobre `profiles`) e a limpeza foi conferida por contagem: `tenant`, `tenant_members`, `students`, `physical_assessments`, `auth.users` e `profiles` de teste = 0 em todos, e as contagens totais de `profiles(role=personal)`/`tenant_members` do sistema voltaram exatamente ao valor de antes do teste (2/2) — nenhum dado de produção foi tocado ou alterado.
5. `get_advisors` (security) rodado após a limpeza: nenhum alerta novo — mesmo conjunto de avisos pré-existentes de antes do teste.

**Conclusão:** o isolamento por atribuição funciona corretamente em produção, tanto na tabela núcleo (`students`, Fase 2) quanto numa tabela dependente (`physical_assessments`, Fase 2b), e o bypass de owner/admin também está correto. A pendência anterior está resolvida.

`graphify update .` rodado e confirmado: commit indexado bate com `git rev-parse HEAD`. Esta fase só alterou SQL (nenhum `.ts`/`.tsx`), então não havia nó de código novo a capturar além do já confirmado nas fases anteriores — Fase 2b encerrada.

**Crítica?** Sim — autenticação/RLS/multi-tenant. `graphify update .` rodado e confirmado (commit indexado bate com `git rev-parse HEAD`; `src/lib/supabase/context.ts` aparece com AST hash novo no manifest). Fase 2 (núcleo) encerrada — Fase 2b permanece como pendência explícita, ver acima.

---

## Fase 3 — Gestão da academia (UI + server actions) (CONCLUÍDA em 2026-07-06)

Objetivo: owner/admin conseguem operar a academia de ponta a ponta.

### O que foi feito

- **`src/actions/tenant-members.ts`** (novo): `requireOwnerOrAdminCtx()` (helper privado, bloqueia quem não é owner/admin), `listTenantMembers()`, `createTenantMember(formData)`, `removeTenantMember(tenantMemberId)`, `assignStudentToPersonal(studentId, tenantMemberId)`.
  - `createTenantMember`: valida `tenant_type === 'academia'` e limite `max_personals`; reaproveita conta existente por e-mail (personal que já atua em outra academia/autônomo) ou cria usuário novo via `createAdminClient()` + Edge Function `send-welcome-email` (mesmo padrão de `createStudent`).
  - `removeTenantMember`: bloqueia remoção do `owner` e bloqueia se o membro ainda tiver alunos com `assigned_personal_id` apontando pra ele (reatribuição obrigatória antes, conforme regra de negócio confirmada no planejamento) — apenas marca `status = 'removed'`, não apaga o vínculo.
  - `assignStudentToPersonal`: owner/admin atribuem livremente; personal só pode se autoatribuir a aluno ainda não atribuído, e apenas se `tenants.self_assign_enabled = true`. Usa `createAdminClient()` (service role) porque a policy de `students` para role `personal` não cobre leitura/escrita de alunos com `assigned_personal_id IS NULL` — a autorização é toda feita em código antes do update administrativo.
- **`/dashboard/equipe`** (novo): página server component restrita a owner/admin de tenant `academia` (redireciona para `/dashboard` caso contrário); lista membros com contagem de alunos atribuídos, formulário de convite (`invite-member-form.tsx`) e botão de remoção (`remove-member-button.tsx`, oculto para o `owner`).
- **`/dashboard/alunos`** (editado): para owner/admin de uma academia, cada linha ganha um `<select>` de atribuição de personal (`assign-personal-select.tsx`) fora do `<Link>` do card (para não aninhar elemento interativo dentro de link); para todos os outros casos (autônomo, ou personal comum de academia) o comportamento visual é idêntico ao anterior.
- **Sidebar/navegação** (`dashboard-sidebar.tsx`, `dashboard-mobile-nav.tsx`, `(dashboard)/layout.tsx`): item "Equipe" só aparece quando `tenant_type === 'academia'` e o papel efetivo (via `getCtx()`) é `owner` ou `admin` — 100% invisível para tenants autônomos.

### Verificação

- Todos os 9 arquivos novos/editados desta fase revisados via leitura direta do conteúdo real (não via mount Linux, que segue apresentando desincronização esporádica — ver nota da Fase 2) antes de qualquer checagem de compilação.
- `npx tsc --noEmit --skipLibCheck`: zero erros novos. Os únicos erros remanescentes seguem sendo os mesmos 3 arquivos pré-existentes e não relacionados (`dashboard/alunos/[id]/page.tsx`, `app/page.tsx`, `admin-sidebar.tsx`) — mesmo padrão de mount desatualizado já documentado nas Fases 1/2, confirmados como não tocados por esta feature.

### Deferido / fora de escopo desta fase

- **Fluxo de "aceitar convite"**: não implementado — segue o mesmo padrão direto de `createStudent` (conta criada de imediato com senha temporária, sem etapa de confirmação por e-mail). Se o negócio precisar de um convite com aceite explícito no futuro, é um incremento sobre `createTenantMember`.
- **Notificação ao personal quando reatribuído/alterado**: ainda não implementado — ponto em aberto explícito do planejamento original, não resolvido nesta fase. Fica como candidato para revisão futura (possivelmente reaproveitando `TrainerNotificationBell`).
- **Tela de gestão de admins separada**: a mesma tela `/dashboard/equipe` já cobre convite/remoção tanto de `personal` quanto de `admin` (select de papel no formulário de convite) — não foi construída uma tela separada, considerada redundante.
- **Teste ponta a ponta com academia real** (personal A não vê aluno de personal B): ainda pendente, como já registrado na Fase 2b — só é possível quando existir a primeira academia de teste (depende também da Fase 6, criação manual pelo global_admin).

**Critério de saída:** um admin consegue convidar 2 personais, atribuir alunos distintos a cada um, e cada personal só vê os seus (verificação lógica via RLS + código concluída; teste end-to-end com dados reais ainda pendente, ver acima).

**Crítica?** Média — nova feature de domínio (gestão multi-personal). Rodar `graphify update .` ao final desta fase.

---

## Fase 4 — Seleção de organização (login multi-vínculo) (CONCLUÍDA em 2026-07-06 — lado do personal)

Objetivo: personal ou aluno com mais de um vínculo ativo escolhe o contexto corretamente, tanto na web quanto no app.

### Achado crítico antes de implementar: gap de dados descoberto

Ao investigar quem gera vínculos em `tenant_members`, encontrei que **apenas** `src/actions/tenant-members.ts` (Fase 3, convite de equipe) inseria linhas ali. O fluxo de cadastro de um novo personal autônomo (`signUpPersonal`, `src/app/actions/auth.ts`) criava o `tenant` e atualizava `profiles.tenant_id`, mas **nunca inseria a linha correspondente em `tenant_members`** — ou seja, qualquer tenant autônomo criado *depois* da migration de fundação da Fase 1 ficaria sem vínculo em `tenant_members`, quebrando a premissa de que essa tabela é a fonte única de vínculos (usada pelo seletor desta fase). Verificado via `execute_sql`: hoje 2/2 personais têm `tenant_members` (nenhum tenant novo foi criado desde a Fase 1), mas o gap era real e passaria despercebido até o próximo cadastro.

**Correção aplicada, em duas partes (aditiva, sem risco para o que já existe):**
1. `src/app/actions/auth.ts` → `signUpPersonal` agora insere a linha `tenant_members` (role `owner`, status `active`) logo após vincular `profiles.tenant_id` — best-effort (loga erro mas não bloqueia o cadastro se falhar, já que o tenant autônomo sempre funcionou 100% via `profiles.tenant_id` sozinho).
2. Migration `supabase/migrations/20260706_academias_fase4_backfill_tenant_members.sql`: backfill idempotente (`INSERT ... WHERE NOT EXISTS ... ON CONFLICT DO NOTHING`) para qualquer personal que tenha `tenant_id` mas ainda não tenha linha em `tenant_members`. Aplicada e confirmada: 0 linhas novas (nenhum gap existia ainda na prática), migration é segura para rodar novamente a qualquer momento.

### O que foi feito (lado do personal — mobile/app fica para uma iteração futura, ver pendências)

- **`src/app/actions/personal-tenant.ts`** (novo): `selectActiveOrg(tenantId)` — espelha exatamente `selectActiveTenant` (`student-tenant.ts`), trocando a tabela de origem de `students` para `tenant_members`. Revalida que o vínculo é realmente ativo antes de atualizar `profiles.tenant_id`, bloqueando troca para um tenant arbitrário.
- **`/dashboard/trocar-organizacao`** (novo, `src/app/(dashboard)/dashboard/trocar-organizacao/page.tsx`): espelha `(student)/student/trocar-personal/page.tsx` — lista as organizações onde o personal tem vínculo ativo em `tenant_members` e deixa escolher.
- **`src/app/(dashboard)/layout.tsx`** (editado): busca todos os vínculos ativos em `tenant_members` do usuário logado; se houver 2+ e o `tenant_id` atual do perfil não bater com nenhum, redireciona para `/dashboard/trocar-organizacao` — mesma lógica de `(student)/layout.tsx`. Com 0 ou 1 vínculo (100% dos casos em produção hoje), nenhuma escrita ou redirecionamento extra é executado — comportamento idêntico ao pré-Fase 4.
- **Link "Trocar de organização"** adicionado ao rodapé do sidebar desktop (`(dashboard)/layout.tsx`) e ao drawer mobile (`dashboard-mobile-nav.tsx`, nova prop `hasMultipleActiveTenants`), visível apenas quando o personal tem 2+ vínculos ativos.

### Verificação

- Todos os 5 arquivos tocados (`auth.ts`, `personal-tenant.ts`, `trocar-organizacao/page.tsx`, `(dashboard)/layout.tsx`, `dashboard-mobile-nav.tsx`) revisados via leitura direta do conteúdo real antes de qualquer checagem de compilação (mesmo protocolo das fases anteriores, por causa da desincronização esporádica do mount Linux).
- `npx tsc --noEmit --skipLibCheck`: zero erros novos — os únicos erros remanescentes seguem sendo os 3 arquivos pré-existentes e não relacionados já documentados nas Fases 1–3.
- Migration de backfill aplicada e confirmada sem efeito colateral (0 linhas inseridas, pois nenhum gap existia ainda).

**Critério de saída:** login com 1 vínculo segue direto (sem tela nova) — confirmado por construção, já que o código só ativa o redirecionamento quando há 2+ vínculos; login com 2+ vínculos exibe seletor; troca de organização funcional no header — verificação lógica concluída, teste end-to-end com uma conta real de múltiplos vínculos ainda pendente (mesma limitação já registrada nas Fases 2b/3: só é possível testar de ponta a ponta quando existir uma academia de teste com mais de um vínculo por pessoa).

### Pendências / fora de escopo desta etapa

- **App mobile**: não ajustado nesta fase — o app hoje resolve `tenant_id` só via `profiles`, então continua funcionando para tenants com vínculo único; um personal com múltiplos vínculos que logar pelo app não verá o seletor (só a organização atualmente marcada em `profiles.tenant_id`). Fica como item explícito para uma iteração futura do app.
- **Caso de e-mail duplicado (aluno com cadastro antigo + novo)**: mencionado no SPEC original como escopo do aluno, não do personal — não tratado aqui; seguir usando `(student)/layout.tsx` como estava.
- **Teste end-to-end** com conta real de múltiplos vínculos: pendente, mesma nota das fases anteriores.

**Crítica?** Sim — muda o fluxo de autenticação/contexto ativo. Atualizar Graphify ao final desta fase.

---

## Fase 5 — Onboarding e branding da academia (CONCLUÍDA em 2026-07-06)

Objetivo: aluno cadastrado por uma academia recebe experiência com a marca correta.

### Achado e correção: "meu personal" errado para alunos de academia (web)

Investigando o e-mail de boas-vindas e a área do aluno, encontrei que **o e-mail já funcionava corretamente sem nenhuma mudança** — `createStudent`/`resendStudentInvite` (`src/actions/students.ts`) resolvem `business_name`/`logo_url`/`primary_color` a partir do `tenant_id` ativo do personal que está cadastrando o aluno, e isso já é o tenant da academia quando aplicável (o mecanismo de white-label nunca dependeu de `tenant_type`). `personalName` no e-mail também já é sempre quem de fato criou o cadastro — correto tanto para autônomo quanto para qualquer personal de uma academia.

Só que a **área do aluno na web** (`src/app/(student)/layout.tsx`) tinha um bug real: resolvia "meu personal" com

```ts
supabase.from('profiles').select('full_name').eq('tenant_id', tenantId).eq('role', 'personal').limit(1).single()
```

Essa query pega **qualquer** profile com `role='personal'` naquele tenant — correto para autônomo (só existe 1), mas **errado para uma academia**: todo profile de um membro da equipe tem `role='personal'` em `profiles` (o papel real — owner/admin/personal — vive em `tenant_members`, não em `profiles.role`, achado já registrado nas Fases 3/6). Sem `assigned_personal_id`, o `.limit(1)` pegava um personal arbitrário da academia, não necessariamente o que de fato atende aquele aluno.

**Correção aplicada** (`src/app/(student)/layout.tsx`): quando `tenant_type === 'academia'`, resolve o nome do personal via `students.assigned_personal_id → tenant_members.user_id → profiles.full_name` — o personal realmente responsável por aquele aluno específico. Para tenant `autonomo`, comportamento 100% idêntico ao anterior (a query antiga continua sendo usada ali, porque é sempre segura nesse caso — só existe 1 personal). Aluno de academia ainda não atribuído a ninguém: `personalName` fica `null`, e a UI (já preparada) simplesmente omite a linha "Personal: ..." em vez de mostrar um nome errado.

### Validações sem necessidade de mudança de código

- **App mobile** (`strivePersonalApp/src/hooks/useTenant.ts`): resolve toda a marca (`business_name`, `logo_url`, `primary_color`, `accent_text_color`) puramente por `tenant_id`, sem nenhuma suposição sobre quantos personais existem no tenant — já funciona corretamente para academia sem alteração. O app não tem hoje um equivalente de "meu personal" na tela do aluno, então não existe o mesmo bug para corrigir lá.
- **Edge Function `send-student-welcome`**: 100% parametrizada por `businessName`/`logoUrl`/`primaryColor`/`personalName` recebidos do caller — nenhuma lógica hardcoded que assuma tenant autônomo.

### Verificação

- Arquivo `(student)/layout.tsx` revisado via leitura direta antes do force-sync (protocolo já estabelecido).
- `npx tsc --noEmit --skipLibCheck`: zero erros novos, mesmos 2 arquivos pré-existentes não relacionados de sempre.
- Não foi possível testar visualmente com uma conta de aluno real de uma academia (nenhuma academia real existe em produção ainda) — a correção foi verificada por leitura de código e é logicamente equivalente ao teste de isolamento já validado na Fase 2b/6 (mesmo padrão de `assigned_personal_id → tenant_members`).

**Critério de saída:** aluno cadastrado por uma academia piloto recebe e-mail e acessa o app com a marca da academia — confirmado por código; falta validação visual end-to-end quando existir a primeira academia real (mesma pendência já registrada na Fase 6).

**Crítica?** Não — ajuste pontual e correção de bug em superfície já existente, sem mudança de RLS/auth core.

---

## Fase 6 — Painel do global_admin para criação manual de academias (CONCLUÍDA em 2026-07-06)

Objetivo: global_admin consegue criar e configurar uma academia sem depender de deploy/SQL manual.

### O que foi feito

- **`src/actions/admin-academias.ts`** (novo): `createAcademiaTenant(formData)` — espelha `createClient_action` (`src/app/actions/clients.ts`) com 2 diferenças: cria o tenant já com `tenant_type='academia'` e insere o dono também em `tenant_members` (role `owner`), essencial para o modelo multi-personal e para o seletor de organização da Fase 4. `updateAcademiaTenant(tenantId, formData)` atualiza plano/limites/AbacatePay/notes, bloqueando reduzir `max_personals` abaixo do número de membros ativos (evita estado inconsistente). `resendAcademiaOwnerEmail(tenantId)` reenvia acesso especificamente ao owner.
- **`/admin/academias`** (novo, listagem): espelha `/admin/clientes`, trocando a métrica principal de "alunos" para "personais/admins" (o limite que faz sentido controlar manualmente numa academia) — alunos aparece como métrica secundária. Badge de "Autoatribuição" quando `self_assign_enabled=true`.
- **`/admin/academias/nova`** (novo, criação): formulário com dados da academia + dono, limites (`max_personals`, `max_students`, `self_assign_enabled`), campo manual de `abacatepay_customer_id` (assinatura única da academia, cobrada fora do fluxo automático de planos individuais — decisão já confirmada no `PLANEJAMENTO`), plano e cor primária.
- **`/admin/academias/[id]`** (novo, detalhe/edição): métricas de uso (personais/admins, alunos, plano), formulário de edição (`AcademiaEditForm`) e card mostrando o owner atual (nome/e-mail resolvidos via `tenant_members`).
- **Nav do admin**: item "Academias" adicionado a `admin-sidebar.tsx` (reaproveitado automaticamente pelo drawer mobile, que já usa o mesmo componente).

### Achados de correção durante a implementação (não deixados para depois)

1. **`resendWelcomeEmail` (clients.ts) é ambígua para academias**: resolve o destinatário via `profiles.tenant_id + role='personal'` com `.single()` — correto quando há só 1 personal por tenant (autônomo), mas quebraria (erro do Postgrest por múltiplas linhas) numa academia com 2+ personais/admins, já que todos os profiles de uma mesma academia têm `role='personal'` na tabela `profiles` (o papel real — owner/admin/personal — vive em `tenant_members`, não em `profiles.role`). Em vez de reaproveitar essa função quebrada, criei `resendAcademiaOwnerEmail` (mesma lógica, mas resolve o destinatário via `tenant_members.role='owner'`, que é sempre único por tenant).
2. **`deleteClient` (clients.ts) não é seguro para academias no modelo multi-tenant da Fase 4**: apaga a conta Supabase Auth de *todo* profile com aquele `tenant_id` — correto para autônomo (1 personal, sem outros vínculos), mas arriscado para uma academia: um personal/admin pode pertencer a mais de uma organização (Fase 4), e teria a conta inteira apagada, perdendo acesso às outras organizações também. Decisão: **não expor "Deletar" na tela de academias** até esse fluxo ser revisado — documentado explicitamente no código (`AcademiaDetailActions`) e aqui.

### Verificação

- Todos os 9 arquivos novos/editados revisados via leitura direta do conteúdo real antes de qualquer checagem de compilação (mesmo protocolo das fases anteriores).
- `npx tsc --noEmit --skipLibCheck`: zero erros novos. Interessante: `admin-sidebar.tsx`, que aparecia nos 3 arquivos "pré-existentes com erro" desde a Fase 1 (por causa do mount Linux desatualizado), **saiu da lista** depois do force-sync desta fase — restam apenas 2 arquivos não relacionados (`dashboard/alunos/[id]/page.tsx`, `app/page.tsx`), mesmo padrão já documentado.
- Testado apenas por leitura de código/schema (colunas de `tenants`/`plans` confirmadas via `execute_sql`) — criação real de uma academia de teste pelo painel ainda não foi executada nesta sessão.

**Critério de saída:** global_admin cria uma academia do zero pelo painel, sem tocar em banco diretamente, e ela aparece operacional para o owner convidado — implementação e verificação lógica concluídas. O teste end-to-end de isolamento entre personais (pendente desde a Fase 2b) foi executado separadamente via simulação de RLS direto no banco (ver nota "Atualização 2026-07-06" na seção da Fase 2b) e confirmou o comportamento correto — não foi necessário esperar por uma academia real criada pelo painel.

### Pendências / fora de escopo desta etapa

- Teste manual real *pelo painel*: criar uma academia de teste clicando em `/admin/academias/nova` (em vez de via simulação SQL), convidar 2 personais pela tela `/dashboard/equipe` (Fase 3) e testar o seletor de organização (Fase 4) com uma conta que pertença a 2 tenants — é um teste de UX/fluxo completo, complementar ao teste de isolamento de dados já confirmado.
- Revisão de `deleteClient` para segurança multi-tenant antes de expor exclusão de academias no painel.
- Fluxo de "Deletar academia" propriamente dito, condicionado à revisão acima.

**Crítica?** Média — nova superfície administrativa, não mexe em RLS/auth core. Rodar `graphify update .` ao final desta fase.

---

## Fase 7 — Módulos exclusivos de academia (estoque e futuros)

**Status: CONCLUÍDA em 2026-07-06.**

Objetivo: primeiro módulo exclusivo de academia funcionando.

- Usar a skill `strive-modulo` para desenhar e construir o módulo de estoque como módulo novo, condicionado a `tenant_type = 'academia'` no sistema de toggle já existente.
- Qualquer outro módulo específico de academia identificado depois do piloto entra aqui, um de cada vez.

### O que foi construído

- **Banco**: tabelas `inventory_items` (cadastro) e `inventory_movements` (log imutável — só `SELECT`/`INSERT`, sem `UPDATE`/`DELETE`), RLS em ambas condicionada a `get_my_role() = 'personal' AND tenants.tenant_type = 'academia'`, e RPC `register_inventory_movement` (`SECURITY INVOKER`) que atualiza `quantity_on_hand` e grava o movimento atomicamente em uma transação. Módulo registrado em `system_modules` com `category = 'financeiro'` (não existe categoria própria de "operacional" no CHECK constraint atual — reaproveita o grupo "Financeiro" já existente no sidebar).
- **Server actions** (`src/app/actions/estoque.ts`): CRUD de itens, toggle ativo/inativo (soft delete), registro de movimento via RPC, histórico de movimentos.
- **UI do personal**: lista com alerta de estoque baixo (`/dashboard/estoque`), criação (`/novo`), detalhe com edição + registro de movimento + histórico (`/[id]`).
- **Integração ao sistema de módulos**: rota e ícone (`Package`) adicionados a `modules-config.ts` e ao `ICON_MAP` do sidebar/dashboard home; slug `estoque` incluído no grupo "Financeiro" já existente (não foi criado um grupo "Academia" separado, ajuste em relação ao plano original).
- **Exclusividade para academia, em 3 camadas de defesa**: (1) RLS no banco — a condição `tenant_type = 'academia'` nunca é satisfeita para tenant autônomo, então bloqueia acesso real independentemente de qualquer outra coisa; (2) UI do toggle por tenant (`/admin/clientes/[id]/modulos`) desabilita o switch e mostra "somente para academias" quando o tenant não é academia; (3) as actions `toggleTenantModule` e `enableAllModulesForTenant` recusam habilitar `estoque` para tenant não-academia mesmo se chamadas fora da UI.
- **Documentação técnica**: `docs/modulos/estoque.md`, incluindo notas para implementação mobile futura.

### Correção durante a implementação

Um bug real (não relacionado ao ambiente) foi encontrado e corrigido durante a Etapa 4: `enableAllModulesForTenant` declarava `const { data: tenant }` duas vezes no mesmo escopo (erro de compilação). Corrigido reaproveitando a primeira consulta (que já buscava `tenant_type`) para também trazer `business_name`.

**Critério de saída:** módulo de estoque ativável apenas para tenants `academia`, com documentação técnica gerada pela própria skill (incluindo nota para implementação mobile futura, se aplicável). ✅ Atingido — `tsc --noEmit` limpo (só os 2 erros pré-existentes não relacionados, já documentados nas fases anteriores).

**Crítica?** Média — nova tabela + RPC + RLS, mas isolada (não toca em auth/RLS core de outras tabelas). Recomenda-se rodar `graphify update .` ao final desta fase.

---

## Resumo de dependências entre fases

```
Fase 0 (investigação)
   └─> Fase 1 (dados) ──> Fase 2 (RLS) ──> Fase 3 (gestão UI) ──> Fase 4 (login multi-vínculo)
                                                  │
                                                  └──> Fase 5 (branding/onboarding)
   Fase 1 também habilita ──────────────────────> Fase 6 (painel global_admin)
                                                  │
Fase 6 concluída (existe pelo menos 1 academia real) ──> Fase 7 (módulos exclusivos)
```

Fases 1, 2 e 4 são as únicas com risco real de regressão (dados, RLS, autenticação) — merecem revisão dedicada antes de avançar para a próxima. Fases 3, 5, 6 e 7 são construção de superfície nova, com risco de regressão baixo se as fundações estiverem corretas.
