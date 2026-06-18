# Strive Personal - Fluxo de Trabalho do Agente

Este documento define as regras de operação, o mapeamento de fases e o fluxo de trabalho que o agente (Manus) deve seguir para o desenvolvimento do projeto **Strive Personal**.

## Regras Gerais de Operação

1. **Abordagem Incremental:** O desenvolvimento deve seguir estritamente as fases mapeadas abaixo. Não avançar para a próxima fase sem concluir e validar a atual.
2. **Relatórios de Fase:** Ao finalizar cada fase por completo, o agente deve gerar um relatório detalhado do que foi construído, do status atual e solicitar aprovação explícita do usuário para avançar para a próxima fase.
3. **Mapeamento Prévio:** Antes de iniciar qualquer fase, o agente deve listar claramente o que será feito naquela etapa.
4. **Comunicação:** Manter respostas concisas e profissionais, sem excesso de detalhes técnicos, a menos que solicitado.
5. **Nomenclatura:** O nome do projeto é sempre **Strive Personal** (ignorar referências antigas como FitCoach Pro ou PersonalTrainerApp).

---

## Mapeamento de Fases do Projeto

### Fase 1: Fundação e Infraestrutura Técnica
*Foco: Estabelecer a base técnica, banco de dados, segurança e acessos.*

- **1.1. Setup do Repositório:** Inicialização do projeto web (Next.js 14, TailwindCSS, TypeScript).
- **1.2. Banco de Dados (Supabase):** Modelagem das tabelas essenciais (profiles, tenants, alunos).
- **1.3. Segurança (RLS):** Implementação rigorosa das políticas de Row Level Security para garantir o isolamento multi-tenant.
- **1.4. Autenticação:** Fluxos de login, cadastro e onboarding para personais.
- **1.5. Dashboard Base:** Criação do layout do painel administrativo e CRUD inicial de alunos (listagem, criação, edição, inativação).

### Fase 2: Prescrição e Execução de Treinos
*Foco: Core business - montagem de treinos pelo personal e execução pelo aluno.*

- **2.1. Banco de Exercícios:** CRUD de exercícios com suporte a upload de vídeos (Supabase Storage).
- **2.2. Prescrição (Web):** Interface para o personal montar treinos (séries, repetições, cargas, intervalos).
- **2.3. Setup Mobile:** Inicialização do app React Native (Expo) para o aluno.
- **2.4. App do Aluno (Visualização):** Tela inicial, lista de treinos atribuídos e detalhes do treino.
- **2.5. App do Aluno (Execução):** Fluxo interativo de execução (timer, registro de carga, conclusão de séries).

### Fase 3: Acompanhamento e Comunicação
*Foco: Retenção, evolução e feedback.*

- **3.1. Avaliações Físicas:** Registro de medidas, dobras cutâneas e fotos (Web/Mobile).
- **3.2. Progresso do Aluno:** Auto-registro de peso e fotos de evolução (Mobile).
- **3.3. Frequência e Relatórios:** Gráficos de aderência, streaks e alertas de inatividade.
- **3.4. Feedbacks:** Sistema de avaliação de dificuldade pós-treino pelo aluno.
- **3.5. Arquivos:** Compartilhamento de PDFs e laudos entre personal e aluno.

### Fase 4: Gestão Comercial e Personalização
*Foco: Monetização e consolidação da marca do personal.*

- **4.1. Configuração White-label:** Personalização de cores, logo e links dinâmicos no app do aluno.
- **4.2. Gestão Financeira:** Geração de faturas, controle de status (pendente/pago) e lembretes.
- **4.3. Notificações Push:** Alertas de novos treinos, vencimentos e inatividade (Expo Push).
- **4.4. Polimento:** Testes de integração, otimização de performance e correções finais.
- **4.5. Lançamento V1.0:** Deploy final (Vercel para Web, Lojas para Mobile).

---

## Fluxo de Execução Atual

O agente está atualmente instruído a iniciar a **Fase 1**. 

Passos imediatos a serem executados na Fase 1:
1. Inicializar o projeto Next.js na pasta `web`.
2. Configurar integração com Supabase.
3. Criar schema inicial do banco de dados e políticas RLS.
4. Construir fluxo de autenticação.
5. Desenvolver CRUD de alunos no dashboard.
6. Gerar relatório de conclusão da Fase 1.
