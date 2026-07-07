# Product Requirements Document (PRD) - Suporte a Academias no Strive Personal

## 1. Visão Geral do Produto

O Strive Personal hoje atende exclusivamente personal trainers autônomos: um tenant equivale a um profissional e sua carteira de alunos. Esta feature expande o produto para atender também **academias** — organizações com múltiplos personais e múltiplos alunos operando sob a mesma marca — sem alterar a experiência de quem já usa o sistema como autônomo.

Uma academia usa o mesmo sistema web já existente, mas com um papel administrativo adicional (gestão da academia: personais, alunos, estoque) e uma camada de atribuição que determina qual personal é responsável por qual aluno. O app mobile do aluno permanece o mesmo, apenas refletindo a marca (logo, cores, contato) da academia à qual o aluno pertence.

Este PRD complementa e referencia `docs/PLANEJAMENTO_Multi_Tenant_Academias.md`, onde as regras de negócio detalhadas estão documentadas.

## 2. Objetivos

- Permitir que uma academia opere no Strive Personal com múltiplos personais e um painel administrativo central, sem duplicar o sistema.
- Preservar 100% do comportamento atual para personais autônomos — nenhuma regressão, nenhuma tela nova obrigatória para quem já usa o sistema.
- Dar ao admin/owner da academia controle total sobre todos os alunos, independentemente de qual personal está diretamente responsável.
- Permitir que um personal atue em múltiplas academias (ou em uma academia e como autônomo) com uma identidade só, escolhendo o contexto no login quando necessário.
- Manter a venda de plano de academia como processo comercial manual (não autosserviço), controlado pelo global_admin, mas com faturamento recorrente integrado ao AbacatePay como já ocorre hoje.

## 3. Não-Objetivos (fora de escopo desta fase)

- Módulo de estoque da academia: citado como necessidade futura, mas será desenhado e implementado como módulo separado (via skill `strive-modulo`), fora do escopo desta primeira etapa de fundação.
- Cadastro público/self-service de plano de academia no site institucional.
- Qualquer mudança na experiência do app mobile do aluno além da marca exibida.

## 4. Usuários e Papéis

| Papel | Onde atua | Resumo |
|---|---|---|
| `global_admin` | Painel `/admin` | Cria e configura tenants academia manualmente (plano, limites, vínculo AbacatePay). Papel já existente, ganha nova responsabilidade. |
| `owner` (dono da academia) | Painel da academia (`/dashboard`) | Novo papel. Gerencia tudo: personais, admins, alunos, billing visível (read-only, pois plano é definido pelo global_admin), branding. |
| `admin` (gestor da academia) | Painel da academia (`/dashboard`) | Novo papel. Mesma amplitude de acesso a alunos e personais que o owner, exceto ações sensíveis (remover owner, mudar plano). |
| `personal` (staff da academia) | Painel da academia (`/dashboard`), com visão restrita | Continua operando exatamente como o personal autônomo hoje, mas só enxerga os alunos atribuídos a si dentro daquela academia. |
| `personal autônomo` | Painel próprio (`/dashboard`) | Papel atual, sem mudanças. |
| `student` | App mobile / área do aluno | Papel atual, sem mudanças funcionais — apenas branding dinâmico conforme a organização a que pertence. |

## 5. Escopo Funcional

### 5.1. Tipos de tenant

Todo tenant passa a ter um `tenant_type`: `autonomo` (comportamento atual, default) ou `academia` (novo). A escolha é feita uma única vez, na criação do tenant, e não muda por autosserviço.

### 5.2. Gestão de membros da academia

- Owner/admin convidam personais por e-mail. Se o e-mail já possui conta no Strive Personal (autônomo ou já vinculado a outra academia), o convite adiciona um novo vínculo sem afetar os vínculos existentes da pessoa.
- Owner pode convidar outros admins.
- Owner/admin podem remover um personal — ação bloqueada até que todos os alunos atribuídos a ele sejam reatribuídos (ver 5.4).

### 5.3. Seleção de organização no login

- Se o mesmo e-mail (mesmo `user_id`) tiver mais de um vínculo ativo (múltiplas academias, ou academia + autônomo), o login exibe uma tela de seleção de organização antes de entrar no dashboard, com opção de trocar depois via menu.
- Se cada academia usa e-mails distintos para seus profissionais, cada e-mail é uma conta separada e o login resolve o escopo sozinho — sem tela extra.
- A mesma lógica vale para alunos: se um aluno tiver vínculo com mais de um tenant sob o mesmo e-mail (ex.: cadastro antigo com um personal autônomo, hoje inativo, e um cadastro novo por uma academia), ele também escolhe o contexto no login.

### 5.4. Atribuição de alunos a personais

- Um aluno pertence à academia (`tenant_id`), mas está atribuído a exatamente um personal por vez (`assigned_personal_id`).
- Owner/admin atribuem e reatribuem livremente. Personal não se autoatribui, a menos que a academia tenha ativado o modo de autoatendimento (`self_assign_enabled`), caso em que o personal pode pegar alunos da fila de "não atribuídos" (nunca de outro personal).
- Personal só vê e opera os alunos atribuídos a si — mesma experiência de hoje.
- Owner/admin veem e podem **editar qualquer aluno da academia**, de qualquer personal, sem restrição — a atribuição controla a visão do personal, não limita o admin.
- Remoção de personal exige reatribuição prévia de todos os seus alunos.

### 5.5. Onboarding e branding

- Novo aluno cadastrado por uma academia recebe e-mail de boas-vindas com a identidade visual da academia (logo, nome, cor, contato), reaproveitando o white-label já existente por tenant.
- App mobile e área do aluno exibem a marca da organização à qual o aluno está vinculado no momento.

### 5.6. Plano e billing da academia

- Sem tela de contratação pública. O global_admin cadastra a academia, define plano, `max_students`, `max_personals`, e cria o vínculo com o AbacatePay (`abacatepay_customer_id`) manualmente pelo painel `/admin`.
- Faturamento recorrente segue o mecanismo já existente (assinatura única cobrindo toda a academia), sem cobrança por assento de personal.
- Excedente de `max_students` ou `max_personals` bloqueia novo cadastro/convite, com aviso de necessidade de ajuste de plano (contato comercial, não upgrade self-service).

## 6. Regras de Negócio (resumo — ver planejamento para detalhe completo)

- Isolamento de dados por `tenant_id` continua como hoje; nova camada de atribuição por `assigned_personal_id` só se aplica a `tenant_type = 'academia'`.
- Um personal pode ter vínculos ativos simultâneos em múltiplos tenants.
- Owner e admin têm acesso irrestrito a todos os alunos da academia.
- Remoção de personal é bloqueada sem reatribuição completa dos seus alunos.
- Plano de academia é inserido manualmente pelo global_admin, nunca via autosserviço, mas sempre com ID próprio no AbacatePay.
- Migração dos tenants existentes é automática e não disruptiva (todo tenant atual vira `autonomo`, com o dono como `owner`, e todos os alunos existentes recebem `assigned_personal_id` = o próprio dono).

## 7. Métricas de sucesso

- Zero regressão em fluxos de personal autônomo (medido via lint guard + testes manuais dos fluxos críticos: cadastro de aluno, criação de treino, execução, cobrança).
- Uma academia piloto consegue operar com 2+ personais e reatribuir alunos sem suporte manual do time Strive Personal.
- Tempo de onboarding de um novo personal em uma academia (convite → aceite → primeiro aluno atribuído) medido e abaixo de um fluxo aceitável (a definir com o piloto).

## 8. Stack e Compatibilidade

- Mesma stack atual: Next.js 15 (App Router), Supabase (Postgres + RLS), TypeScript, Tailwind CSS, AbacatePay.
- App mobile (React Native/Expo) não sofre mudança estrutural, apenas branding dinâmico já suportado.
