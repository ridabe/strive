# Strive Personal — TODO

## Fase 1: Design System + Estrutura Base
- [x] Configurar fontes Syncopate e DM Sans via Google Fonts
- [x] Aplicar tokens de cor do Design System em index.css (dark theme)
- [x] Configurar ThemeProvider para dark por padrão
- [x] Criar layout AppLayout com Sidebar persistente
- [x] Sidebar com links para todos os módulos e acento verde-lima
- [x] Proteção de rotas: apenas admin autenticado acessa o sistema
- [x] Tela de login / acesso negado

## Fase 2: Banco de Dados e Backend
- [ ] Schema: tabela `students` (alunos)
- [ ] Schema: tabela `workout_plans` (planos de treino)
- [ ] Schema: tabela `workout_exercises` (exercícios do plano)
- [ ] Schema: tabela `physical_assessments` (avaliações físicas)
- [ ] Schema: tabela `attendance` (frequência)
- [ ] Schema: tabela `financial_plans` (planos financeiros)
- [ ] Routers tRPC: dashboard (KPIs)
- [ ] Routers tRPC: students (CRUD)
- [ ] Routers tRPC: workouts (CRUD)
- [ ] Routers tRPC: assessments (CRUD)
- [ ] Routers tRPC: attendance (CRUD)
- [ ] Routers tRPC: financial (CRUD)

## Fase 3: Dashboard Home
- [ ] Card KPI: total de alunos ativos
- [ ] Card KPI: treinos executados na semana
- [ ] Card KPI: aniversariantes do mês
- [ ] Card KPI: alertas de planos vencendo em 7 dias
- [ ] Lista de atividade recente
- [ ] Lista de aniversariantes do mês

## Fase 4: Módulo de Alunos
- [ ] Listagem de alunos com busca e filtro
- [ ] Formulário de cadastro de aluno
- [ ] Formulário de edição de aluno
- [ ] Tela de perfil individual com histórico de treinos e métricas
- [ ] Inativação de aluno

## Fase 5: Módulo de Treinos
- [ ] Listagem de planos de treino por aluno
- [ ] Criação de plano de treino com exercícios
- [ ] Edição de plano de treino
- [ ] Adição/remoção de exercícios com séries, reps e carga

## Fase 6: Módulos Complementares
- [ ] Avaliações físicas: registro de medidas corporais
- [ ] Avaliações físicas: gráfico de evolução
- [ ] Frequência: registro de presença
- [ ] Frequência: visualização semanal e mensal
- [ ] Financeiro: listagem de planos e status de pagamento
- [ ] Financeiro: alertas de vencimento
- [ ] Financeiro: atualização de status de pagamento

## Fase 7: Qualidade e Entrega
- [ ] Testes Vitest nos routers principais
- [ ] Revisão visual de todos os módulos
- [ ] Checkpoint final
