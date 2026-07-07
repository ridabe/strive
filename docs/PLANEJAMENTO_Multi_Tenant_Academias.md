# Planejamento: Suporte a Academias no StrivePersonal

Documento de regras de negócio para evolução do sistema de "tenant = 1 personal autônomo" para "tenant = organização (personal autônomo OU academia)". Base para próxima etapa de implementação.

---

## 1. Visão geral da mudança

Hoje, no banco de dados, `tenant_id` representa diretamente um personal trainer: cada tenant tem um dono, e todos os alunos (`students.tenant_id`) pertencem a esse dono. Não existe conceito de múltiplos operadores dentro de um mesmo tenant.

A mudança introduz um segundo tipo de tenant — a academia — que pode ter vários personais e vários admins operando sobre a mesma base de alunos, com regras de visibilidade e atribuição individual por personal. O tenant deixa de significar "um personal" e passa a significar "uma organização", com dois formatos:

- **Tenant autônomo** (`tenant_type = 'autonomo'`): comportamento atual, inalterado. Um personal, seus alunos, sem camada extra.
- **Tenant academia** (`tenant_type = 'academia'`): um ou mais admins, vários personais vinculados, alunos atribuídos individualmente a um personal responsável.

Personais podem ter vínculo com mais de uma organização simultaneamente (múltiplas academias, ou uma academia + carteira própria como autônomo), conforme decisão do usuário. Isso significa que a identidade do personal (`profiles`) é independente do tenant — o vínculo é modelado numa tabela própria, não mais um campo fixo no profile.

---

## 2. Papéis (roles) e hierarquia

Novo conjunto de papéis dentro de um tenant do tipo academia, além do `global_admin` (interno StrivePersonal) e `student` (inalterados):

| Papel | Escopo | Pode |
|---|---|---|
| **owner** (dono da academia) | 1 por tenant academia | Tudo que admin pode, mais: excluir a academia, transferir titularidade, gerenciar billing/assinatura, remover outros admins |
| **admin** (gestor da academia) | Vários por tenant | Gerenciar personais (convidar/remover), gerenciar todos os alunos, atribuir/reatribuir aluno a personal, gerenciar estoque, ver relatórios globais da academia. Não pode remover o owner nem mudar billing |
| **personal** (staff vinculado) | Vários por tenant | Ver e operar apenas os alunos atribuídos a si (treinos, dicas, avaliações, agenda), como já funciona hoje. Não vê alunos de outros personais, não gerencia outros personais |

Para tenant autônomo, o próprio dono ocupa papéis owner + personal simultaneamente (sem mudança perceptível de UX).

O vínculo personal↔academia (e admin↔academia) é registrado numa tabela de membership, não em um campo único no profile — isso é o que viabiliza um personal estar em múltiplas academias ao mesmo tempo. Ao acessar o sistema, se o usuário tiver mais de um vínculo ativo, ele escolhe (ou o sistema lembra a última) qual organização está operando — um seletor de contexto, parecido com "trocar de workspace".

### 2.1. Regra de login e seleção de organização (confirmada)

O comportamento no login depende de quantos vínculos ativos existem para o e-mail usado:

- **Mesmo e-mail em 2+ organizações** (ex.: personal usa o mesmo e-mail pessoal em duas academias, ou em uma academia + carteira autônoma): no login, o sistema detecta múltiplos vínculos ativos para aquele `user_id` e exibe uma tela de seleção de organização antes de entrar no dashboard. O usuário escolhe em qual está operando naquela sessão; o sistema pode lembrar a última escolha como padrão, mas sempre com opção de trocar (ex.: menu no header, "trocar de organização").
- **E-mails diferentes por organização** (cada academia cadastra o profissional com um e-mail próprio, ex. `joao@academiax.com` e `joao@academiaY.com`): são contas (`user_id`) distintas no Supabase Auth. O login já resolve o escopo sozinho, sem necessidade de seletor — é exatamente como funciona hoje.
- **Aluno com o mesmo e-mail em mais de um contexto**: pode acontecer de um aluno já ter cadastro via um personal autônomo (mesmo que esse personal esteja inativo/desligado do sistema) e depois ser cadastrado também por uma academia com o mesmo e-mail. A mesma lógica de seletor de organização se aplica ao aluno: no login, se houver mais de um vínculo (`students` com o mesmo `user_id` em tenants diferentes, incluindo tenants com status inativo), o aluno escolhe qual contexto quer acessar antes de ver seus treinos. Não é permitido mesclar automaticamente os dois históricos — são vínculos separados, o aluno decide.
- Este seletor de contexto é, portanto, um componente único e reutilizável (não uma tela separada para personal e outra para aluno), acionado sempre que a autenticação resolve mais de um vínculo ativo para o mesmo `user_id`.

---

## 3. Modelo de dados (alterações necessárias)

Sem editar migrations agora — isto é o desenho a validar antes de implementar (consultar Graphify antes de qualquer alteração real, conforme regra do projeto).

**`tenants`**
- novo campo `tenant_type`: `'autonomo' | 'academia'` (default `'autonomo'` para não quebrar os existentes)
- `max_students` já existe; adicionar `max_personals` (limite de personais ativos, parte do plano)
- campos de branding (`logo_url`, `primary_color`, `app_name` etc.) já existem e são reaproveitados 1:1 para a identidade da academia — nenhuma mudança necessária aqui

**Nova tabela `tenant_members`**
- `id`, `tenant_id`, `user_id`, `role` (`owner | admin | personal`), `status` (`active | invited | removed`), `invited_at`, `joined_at`
- um `user_id` pode ter várias linhas (uma por tenant em que atua) — é isso que permite múltiplos vínculos
- substitui a lógica atual (implícita) de "profile pertence a um tenant"; profiles de personal deixam de ter tenant fixo e passam a ter 0..N vínculos via esta tabela

**`students`**
- mantém `tenant_id` (a academia é a dona do dado do aluno, sempre)
- novo campo `assigned_personal_id` (nullable, FK para `tenant_members.id` ou `profiles.id`) — o personal responsável por aquele aluno *dentro daquele tenant*
- para tenant autônomo, `assigned_personal_id` é preenchido automaticamente com o próprio dono na criação — transparente, sem exigir nova ação do personal autônomo

**Migração dos dados existentes (não disruptiva)**
1. Todo tenant existente recebe `tenant_type = 'autonomo'`.
2. Para cada tenant, criar uma linha em `tenant_members` com `role = 'owner'` para o dono atual.
3. Todo `student` existente recebe `assigned_personal_id` = o próprio dono do tenant.
4. Nenhuma RLS policy antiga quebra, porque toda query que hoje filtra por `tenant_id` continua válida — a nova camada de `assigned_personal_id` só entra em vigor quando `tenant_type = 'academia'`.

---

## 4. Regras de negócio — atribuição de alunos

- Toda regra abaixo vale só para `tenant_type = 'academia'`; tenant autônomo continua 100% como hoje.
- Um aluno pertence à academia (`tenant_id`), mas só pode estar **atribuído a um personal por vez** (`assigned_personal_id`), evitando ambiguidade de "quem manda o treino".
- **Quem atribui:** owner e admin podem atribuir/reatribuir qualquer aluno a qualquer personal ativo da academia. Personal não atribui alunos a si mesmo por padrão.
- **Acesso irrestrito do admin (confirmado):** owner e admin podem visualizar e **editar** qualquer aluno da academia — ficha, treinos, avaliações, dados de contato — independentemente de qual personal está atribuído a ele. Não há bloqueio de edição por "não ser o personal responsável"; a atribuição (`assigned_personal_id`) controla a visibilidade do **personal**, não limita o alcance do admin/owner.
- **Auto-atribuição opcional:** flag por tenant `self_assign_enabled` (default `false`). Quando ativo, personal pode se auto-atribuir um aluno que esteja na fila de "não atribuídos" — não pode "roubar" aluno já atribuído a outro personal.
- **Visibilidade:**
  - Personal: vê e opera apenas alunos com `assigned_personal_id = seu próprio membership`. Dashboard, listagem de alunos, treinos, avaliações — tudo filtrado por essa atribuição, reaproveitando as telas atuais sem mudança visual para o personal.
  - Admin/owner: vê todos os alunos da academia, com filtro por personal disponível na UI, e pode ver alunos "não atribuídos" como fila prioritária.
- **Reatribuição:** histórico de reatribuições deve ser logado (quem, quando, de qual personal para qual) — útil para auditoria e para o aluno entender continuidade do acompanhamento.
- **Remoção de um personal da academia:** bloqueada até que todos os alunos dele sejam reatribuídos (a outro personal ou explicitamente para "não atribuído", se `self_assign_enabled`), conforme decidido. A tela de remoção deve forçar esse fluxo antes de confirmar — não deixar o sistema em estado inconsistente com alunos "órfãos" silenciosamente.

---

## 5. Regras de negócio — billing e planos

- Conforme decidido, a academia paga **assinatura única** que cobre toda a operação (não por assento de personal).
- O plano da academia define dois limites: `max_students` (já existe) e `max_personals` (novo). Exceder qualquer um bloqueia convite de novo personal ou cadastro de novo aluno, com aviso claro de upgrade — mesmo padrão de UX que hoje existe para `max_students`.
- **Plano de academia não tem autosserviço (confirmado):** diferente do fluxo atual (personal autônomo se cadastra e assina plano pelo site), o plano de uma academia **não** é contratado via cadastro público. É uma venda diferenciada, negociada fora do sistema, e o **global_admin insere manualmente** o tenant academia, o plano contratado e os limites (`max_students`, `max_personals`) direto pelo painel `/admin`. Não existe tela de "assinar plano academia" no site institucional.
- Mesmo sendo inserida manualmente, a academia **tem um ID único no AbacatePay** (customer/subscription), assim como os tenants autônomos — o global_admin cria esse vínculo no ato de configurar o tenant, para manter cobrança/faturas recorrentes dentro do mesmo mecanismo já existente (`abacatepay_customer_id`), só que sem passar pelo checkout self-service.
- Módulos exclusivos de academia (ex.: estoque) entram no sistema de toggle de módulo por tenant já existente (`tenant_modules`), condicionados a `tenant_type = 'academia'` — não exigem tabela nova, só regra de exibição. **Estoque será desenvolvido como módulo novo separado**, via skill `strive-modulo`, quando a fase de módulos exclusivos desta feature for iniciada — não faz parte da fundação de dados/permissões.

---

## 6. Fluxos principais

**Onboarding de uma academia (sem autosserviço)**
1. Não existe cadastro público de academia no site. O global_admin cria o tenant manualmente pelo painel `/admin`, define `tenant_type = 'academia'`, o plano contratado, `max_students`/`max_personals` e o vínculo com o AbacatePay (customer/subscription).
2. Global_admin define (ou o owner da academia define depois, ao logar pela primeira vez) nome, marca (logo, cores), e-mail/telefone de contato — reaproveita telas de white-label atuais.
3. Owner convida admins (opcional) e personais (obrigatório para operar) — esta parte é self-service normal, dentro do painel da própria academia.

**Convite de personal**
1. Admin/owner insere e-mail do personal.
2. Se o e-mail já tem conta StrivePersonal (personal de outra academia ou autônomo), ele recebe convite e, ao aceitar, ganha novo vínculo em `tenant_members` sem afetar seus vínculos existentes.
3. Se não tem conta, recebe e-mail de convite para criar conta já vinculada à academia.
4. Personal aceita → aparece na lista de personais ativos, pronto para receber alunos atribuídos.

**Cadastro de aluno por uma academia**
1. Admin (ou personal, se `self_assign_enabled`) cadastra o aluno.
2. Aluno recebe e-mail de boas-vindas com identidade visual da academia (logo, nome, cores, contato) — reaproveita o mecanismo de white-label já existente em `tenants`, sem necessidade de novo template por academia.
3. Aluno acessa o app normalmente, vê os treinos passados pelo personal a quem foi atribuído — nenhuma mudança na experiência do app do aluno.

**Remoção de personal**
1. Admin inicia remoção.
2. Sistema lista os alunos atribuídos a esse personal e exige reatribuição de cada um (ou definição como "não atribuído") antes de confirmar.
3. Só após resolver todos os alunos, o vínculo é marcado `removed` — o personal perde acesso àquela academia especificamente (mantém acesso a outras organizações onde ainda tem vínculo ativo).

---

## 7. RLS e segurança (pontos de atenção para a fase de implementação)

- Toda policy nova precisa considerar três camadas: `tenant_id` (isolamento entre organizações, já existe), `tenant_members.role` (owner/admin veem tudo do tenant; personal só o que está atribuído), e o novo `assigned_personal_id`.
- `global_admin` continua com acesso administrativo global, sem mudança.
- Atenção especial a queries que hoje assumem implicitamente "1 personal = 1 tenant" (relatórios, dashboards, exports) — precisam ser auditadas para não vazar dados entre personais de uma mesma academia.
- Seguir a regra do projeto: qualquer alteração de RLS/multi-tenant é mudança crítica → consultar Graphify antes, e atualizar (`graphify update .`) depois.

---

## 8. Impacto no app mobile (alunos)

Nenhuma mudança estrutural esperada do lado do aluno: ele continua vendo seu personal, seus treinos, seu progresso. A única mudança é que a marca exibida (logo, cores, nome, contato no rodapé/institucional) passa a refletir a academia em vez do personal individual quando aplicável — mecanismo já existe via white-label do tenant.

---

## 9. Único ponto ainda em aberto

- Se admin/owner reatribuir ou editar um aluno que está sob responsabilidade de outro personal, decidir se isso gera notificação para o personal responsável (ex.: "admin reatribuiu X para o personal Y" ou "admin alterou o treino do seu aluno X") ou se é silencioso. Não bloqueia o início da implementação — pode ser decidido na fase de UI de gestão (fase 3).

---

## 10. Fases sugeridas de implementação

1. **Fundação de dados**: `tenant_type`, `tenant_members`, `assigned_personal_id`, migração não disruptiva dos tenants existentes.
2. **RLS e permissões**: policies para owner/admin/personal, isolamento por `assigned_personal_id`.
3. **UI de gestão da academia**: convidar/remover personal e admin, atribuir/reatribuir aluno, fila de não atribuídos.
4. **Onboarding differenciado**: escolha autônomo vs academia no cadastro, e-mail de boas-vindas com branding da academia.
5. **Billing**: `max_personals` no plano, bloqueios de limite.
6. **Módulos exclusivos de academia** (estoque etc.) — via skill `strive-modulo`, um de cada vez.

Cada fase deve seguir o fluxo já estabelecido no projeto: consultar Graphify antes de iniciar, implementar, rodar lint guard, e só atualizar o Graphify ao final de fases que mudem topologia (fases 1 e 2, certamente; demais avaliar caso a caso).
