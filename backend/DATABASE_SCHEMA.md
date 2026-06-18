# Strive Personal - Schema do Banco de Dados

## Visão Geral

O banco de dados do Strive Personal foi modelado com foco em **isolamento multi-tenant** através de Row Level Security (RLS). Cada personal trainer é um tenant independente, com seus dados completamente segregados.

## Tabelas Principais

### 1. `tenants` - Personal Trainers

Armazena informações dos personals trainers que usam a plataforma.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do tenant |
| `user_id` | UUID | Referência ao usuário Supabase Auth |
| `name` | VARCHAR | Nome do personal trainer |
| `cref` | VARCHAR | Número CREF (único) |
| `email` | VARCHAR | Email do personal |
| `phone` | VARCHAR | Telefone para contato |
| `bio` | TEXT | Biografia/descrição |
| `profile_image_url` | VARCHAR | URL da foto de perfil |
| `app_name` | VARCHAR | Nome customizado do app (white-label) |
| `primary_color` | VARCHAR | Cor primária em hex (white-label) |
| `logo_url` | VARCHAR | URL do logo (white-label) |
| `plan` | VARCHAR | Plano de assinatura (free/pro/premium) |
| `subscription_status` | VARCHAR | Status da assinatura |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

### 2. `alunos` - Clientes do Personal

Armazena informações dos alunos de cada personal trainer.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do aluno |
| `tenant_id` | UUID | Referência ao personal (tenant) |
| `nome` | VARCHAR | Nome completo |
| `email` | VARCHAR | Email do aluno |
| `telefone` | VARCHAR | Telefone para contato |
| `data_nascimento` | DATE | Data de nascimento |
| `genero` | VARCHAR | Gênero |
| `altura_cm` | DECIMAL | Altura em centímetros |
| `peso_kg` | DECIMAL | Peso em quilogramas |
| `objetivo` | TEXT | Objetivo de treinamento |
| `restricoes_medicas` | TEXT | Restrições médicas relevantes |
| `data_inicio` | DATE | Data de início do plano |
| `data_vencimento` | DATE | Data de vencimento do plano |
| `frequencia_semanal` | INT | Frequência de treinos por semana |
| `status` | VARCHAR | Status (ativo/inativo/pausado) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

### 3. `exercicios` - Banco de Exercícios

Armazena o catálogo reutilizável de exercícios de cada personal.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | UUID | Referência ao personal (tenant) |
| `nome` | VARCHAR | Nome do exercício |
| `descricao` | TEXT | Descrição detalhada |
| `grupo_muscular` | VARCHAR | Grupo muscular alvo |
| `instrucoes` | TEXT | Instruções de execução |
| `video_url` | VARCHAR | URL do vídeo de demonstração |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

### 4. `treinos` - Planos de Treino

Armazena os planos de treino prescritos para cada aluno.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | UUID | Referência ao personal (tenant) |
| `aluno_id` | UUID | Referência ao aluno |
| `nome` | VARCHAR | Nome do treino (ex: "Peito e Costas") |
| `descricao` | TEXT | Descrição do treino |
| `dia_semana` | VARCHAR | Dia da semana (segunda, terça, etc) |
| `status` | VARCHAR | Status (ativo/arquivado) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

### 5. `exercicios_treino` - Exercícios do Treino (Junction)

Tabela de junção que relaciona exercícios aos treinos com configurações específicas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `treino_id` | UUID | Referência ao treino |
| `exercicio_id` | UUID | Referência ao exercício |
| `ordem` | INT | Ordem de execução no treino |
| `series` | INT | Número de séries |
| `repeticoes` | INT | Número de repetições |
| `tempo_segundos` | INT | Tempo em segundos (para exercícios de tempo) |
| `carga_kg` | DECIMAL | Carga em quilogramas |
| `intervalo_descanso_segundos` | INT | Intervalo de descanso entre séries |
| `instrucoes_especificas` | TEXT | Instruções específicas para este exercício |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

### 6. `avaliacoes_fisicas` - Avaliações Físicas

Armazena o histórico de avaliações físicas dos alunos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | UUID | Referência ao personal (tenant) |
| `aluno_id` | UUID | Referência ao aluno |
| `peso_kg` | DECIMAL | Peso em quilogramas |
| `altura_cm` | DECIMAL | Altura em centímetros |
| `imc` | DECIMAL | Índice de Massa Corporal |
| `cintura_cm` | DECIMAL | Circunferência da cintura |
| `quadril_cm` | DECIMAL | Circunferência do quadril |
| `peito_cm` | DECIMAL | Circunferência do peito |
| `braco_cm` | DECIMAL | Circunferência do braço |
| `coxa_cm` | DECIMAL | Circunferência da coxa |
| `dobra_triceps` | DECIMAL | Dobra cutânea do tríceps |
| `dobra_biceps` | DECIMAL | Dobra cutânea do bíceps |
| `dobra_subescapular` | DECIMAL | Dobra cutânea subescapular |
| `dobra_suprailiaca` | DECIMAL | Dobra cutânea suprailiaca |
| `percentual_gordura` | DECIMAL | Percentual de gordura corporal |
| `foto_frente_url` | VARCHAR | URL da foto frontal |
| `foto_lado_url` | VARCHAR | URL da foto lateral |
| `foto_costas_url` | VARCHAR | URL da foto de costas |
| `observacoes` | TEXT | Observações gerais |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

## Segurança: Row Level Security (RLS)

Todas as tabelas possuem políticas RLS habilitadas para garantir isolamento de dados entre tenants.

### Princípio de Isolamento

Cada personal trainer (tenant) só pode acessar:
- Seus próprios dados na tabela `tenants`
- Seus próprios alunos na tabela `alunos`
- Seus próprios exercícios na tabela `exercicios`
- Os treinos de seus alunos na tabela `treinos`
- Os exercícios dos treinos de seus alunos
- As avaliações físicas de seus alunos

### Políticas Implementadas

Para cada tabela, as seguintes operações estão protegidas:
- **SELECT:** Apenas dados do tenant autenticado
- **INSERT:** Apenas inserção de dados do tenant autenticado
- **UPDATE:** Apenas atualização de dados do tenant autenticado
- **DELETE:** Apenas deleção de dados do tenant autenticado

## Índices para Performance

Foram criados índices nas seguintes colunas para otimizar queries:
- `tenants.user_id`
- `alunos.tenant_id` e `alunos.status`
- `exercicios.tenant_id`
- `treinos.tenant_id` e `treinos.aluno_id`
- `exercicios_treino.treino_id`
- `avaliacoes_fisicas.tenant_id` e `avaliacoes_fisicas.aluno_id`

## Próximas Tabelas (Fase 2+)

As seguintes tabelas serão adicionadas nas próximas fases:

- `execucoes_treino` - Registro de execução de treinos pelo aluno
- `progressos` - Registro de progresso manual (peso, fotos)
- `feedbacks` - Feedbacks dos alunos após treinos
- `faturas` - Gestão de cobranças
- `pagamentos` - Histórico de pagamentos
- `arquivos` - Compartilhamento de arquivos
