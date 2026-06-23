# Módulo: Gamificação e Ranking dos Campeões

**Versão:** 1.0  
**Data:** Junho 2026  
**Plataforma:** StrivePersonal Web (Next.js 15 + Supabase)  
**Referência de timezone:** `America/Sao_Paulo` (BRT, UTC-3)

---

## 1. Visão Geral

O módulo de gamificação cria uma **competição mensal global** entre todos os alunos da plataforma, independentemente do personal trainer responsável. Alunos acumulam pontos ao longo do mês com base em suas atividades de treino. No final de cada mês, o ranking é fechado oficialmente, os campeões são registrados e o ciclo reinicia.

**Princípios:**
- Valorizar **evolução individual**, não apenas volume absoluto
- Cálculo feito exclusivamente no **backend** (servidor e edge function)
- Controle total do admin global: ativar/desativar sem perda de dados
- Arquitetura baseada em **eventos** — o app emite eventos, o backend calcula pontos

---

## 2. Regras de Negócio

### 2.1 Ativação do Módulo

| Estado | Comportamento |
|--------|--------------|
| `is_active = false` | Nenhum ponto é contabilizado; módulo não aparece para alunos |
| `is_active = true`  | Pontos são calculados a cada treino; ranking aparece no app |

- Ao desativar: pontos existentes são preservados, mas não crescem
- Ao reativar: contagem continua do ponto parado
- Somente o `global_admin` pode alterar este estado

### 2.2 Ciclo Mensal

- O ranking é **mensal** — cada mês/ano é um ciclo independente
- Pontos não acumulam entre meses (cada mês começa do zero)
- O histórico de meses fechados é preservado indefinidamente
- Ao fechar o mês: Top 3 é registrado, badges são concedidas, novo ciclo inicia automaticamente
- Critério de desempate: maior número de treinos concluídos

### 2.3 Pontuação Base

| Evento | Pontos |
|--------|--------|
| Treino concluído (com `finished_at`) | +50 |
| Por exercício completado (sets > 0) | +5 cada |
| Treino 100% completo (todos os exercícios) | +30 bônus |
| Aumento de carga em exercício vs. sessão anterior | +20 por exercício |
| Por minuto ativo (tempo real de treino) | +1/minuto |
| Bônus semanal: 3+ treinos na mesma semana | +100 |
| Bônus consistência: 4 semanas com 3+ treinos | +300 |

### 2.4 Regras Anti-Abuso

| Regra | Valor configurável |
|-------|-------------------|
| Duração mínima para contar treino | 300 segundos (5 min) |
| Cap de minutos contabilizados por sessão | 120 minutos |
| Cap de pontos totais por sessão | 300 pontos |
| Aumento de carga > 200% | Marcado como suspeito, 0 pontos |
| Treino sem `finished_at` | Ignorado completamente |
| Evento de carga sem exercício anterior | Ignorado (sem base de comparação) |

**Fórmula de cap por sessão:**
```
se total_sessão > max_pts_per_session:
  ratio = max_pts_per_session / total_sessão
  cada_evento.points = floor(cada_evento.points × ratio)
```

### 2.5 Bônus Semanal

- Semana começa na **segunda-feira** (padrão ISO)
- Contagem: `workout_sessions` com `finished_at IS NOT NULL` na janela da semana
- Bônus concedido apenas **uma vez por semana**
- Badge "Foco Total" concedida junto ao bônus

### 2.6 Bônus de Consistência Mensal

- Requer **4 semanas distintas** no mês com **3+ treinos concluídos cada**
- Contagem feita sobre semanas do mês corrente
- Bônus concedido apenas **uma vez por mês**
- Badges "Consistência Máxima" + "Disciplina" concedidas junto

### 2.7 Badges

| Badge | Critério | Frequência |
|-------|----------|-----------|
| `foco_total` | Completou 3+ treinos em uma semana | Por semana |
| `evolucao_aco` | Aumentou carga em pelo menos 1 exercício | Por mês |
| `consistencia_maxima` | 4 semanas com 3+ treinos | Por mês |
| `top_10` | Entrou entre os 10 melhores do mês | Por mês |
| `campeao_mes` | 1º lugar ao fechar o mês | Por mês |
| `disciplina` | Concedida junto com consistência máxima | Por mês |
| `treino_completo` | Completou 100% dos exercícios de um treino | Por mês |

> Badges do mesmo tipo não são duplicadas no mesmo mês/ano.

---

## 3. Modelo de Banco de Dados

### 3.1 Tabelas

#### `gamification_settings` (1 linha — singleton)
```sql
id                        uuid PRIMARY KEY
is_active                 boolean DEFAULT false
pts_workout_completed     integer DEFAULT 50
pts_exercise_completed    integer DEFAULT 5
pts_workout_100_percent   integer DEFAULT 30
pts_load_increase         integer DEFAULT 20
pts_weekly_bonus          integer DEFAULT 100
pts_monthly_consistency   integer DEFAULT 300
pts_per_minute_active     integer DEFAULT 1
max_minutes_per_session   integer DEFAULT 120
max_pts_per_session       integer DEFAULT 300
min_session_duration_secs integer DEFAULT 300
ranking_timezone          text DEFAULT 'America/Sao_Paulo'
updated_at                timestamptz
updated_by                uuid REFERENCES profiles(id)
```

#### `gamification_events` (log de eventos — fonte da verdade)
```sql
id           uuid PRIMARY KEY
student_id   uuid REFERENCES students(id) ON DELETE CASCADE
session_id   uuid REFERENCES workout_sessions(id) ON DELETE CASCADE
event_type   text  -- ver tipos abaixo
points       integer DEFAULT 0
metadata     jsonb DEFAULT '{}'
event_month  smallint
event_year   smallint
is_suspicious boolean DEFAULT false
created_at   timestamptz DEFAULT now()
```

**Tipos de eventos (`event_type`):**
- `workout_completed` — treino finalizado
- `exercise_completed` — conjunto de exercícios feitos (1 evento por sessão)
- `workout_100_percent` — 100% dos exercícios da rotina
- `load_increased` — aumento de carga (1 evento por exercício)
- `active_minutes` — tempo ativo no treino
- `weekly_bonus` — bônus semanal de 3+ treinos
- `monthly_consistency` — bônus de 4 semanas consistentes

#### `monthly_points` (agregado por aluno/mês)
```sql
id                   uuid PRIMARY KEY
student_id           uuid REFERENCES students(id) ON DELETE CASCADE
month                smallint
year                 smallint
total_points         integer DEFAULT 0
workouts_completed   integer DEFAULT 0
exercises_completed  integer DEFAULT 0
load_increases       integer DEFAULT 0
active_minutes       integer DEFAULT 0
weekly_bonuses       integer DEFAULT 0
consistency_bonuses  integer DEFAULT 0
last_calculated_at   timestamptz
UNIQUE(student_id, month, year)
```

> Posições calculadas dinamicamente via `ROW_NUMBER() OVER (ORDER BY total_points DESC)`.

#### `monthly_ranking_snapshots` (histórico de meses fechados)
```sql
id          uuid PRIMARY KEY
month       smallint
year        smallint
closed_at   timestamptz
closed_by   uuid REFERENCES profiles(id)
rankings    jsonb  -- array de posições (ver estrutura abaixo)
champion_id uuid REFERENCES students(id)
UNIQUE(month, year)
```

**Estrutura do campo `rankings`:**
```json
[
  {
    "position": 1,
    "student_id": "uuid",
    "student_name": "João Silva",
    "trainer_name": "Academia XYZ",
    "points": 1540,
    "workouts_completed": 18
  }
]
```

#### `student_badges` (badges conquistadas)
```sql
id         uuid PRIMARY KEY
student_id uuid REFERENCES students(id) ON DELETE CASCADE
badge_type text
month      smallint
year       smallint
metadata   jsonb DEFAULT '{}'
earned_at  timestamptz DEFAULT now()
-- Índice único: (student_id, badge_type, month, year) WHERE month IS NOT NULL
```

### 3.2 View Auxiliar

```sql
-- current_ranking: calcula posições via window function
CREATE VIEW current_ranking AS
SELECT
  mp.*,
  ROW_NUMBER() OVER (
    PARTITION BY mp.month, mp.year
    ORDER BY mp.total_points DESC, mp.workouts_completed DESC
  ) AS rank_position,
  s.full_name     AS student_name,
  s.avatar_url    AS student_avatar,
  t.name          AS trainer_name,
  t.id            AS tenant_id
FROM monthly_points mp
JOIN students s ON s.id = mp.student_id
LEFT JOIN tenants t ON t.id = s.tenant_id;
```

### 3.3 Políticas RLS

| Tabela | Quem pode ler | Quem pode escrever |
|--------|--------------|-------------------|
| `gamification_settings` | Autenticados | `global_admin` |
| `gamification_events` | Próprios eventos | Próprio aluno (via server action) + `global_admin` |
| `monthly_points` | Todos autenticados | Próprio aluno (via server action) + `global_admin` |
| `monthly_ranking_snapshots` | Todos autenticados | `global_admin` |
| `student_badges` | Todos autenticados | Próprio aluno (via server action) + `global_admin` |

---

## 4. Fluxo de Cálculo de Pontuação

### 4.1 Gatilho Principal

```
Aluno finaliza treino
    → finishWorkoutSession() [workout-sessions.ts]
        → processWorkoutGamification(sessionId) [gamification.ts]
            (executa em background, não bloqueia retorno)
```

### 4.2 Fluxo Detalhado de `processWorkoutGamification`

```
1. Verificar is_active → se false, retornar
2. Buscar sessão + exercises + routine_id
3. Anti-abuso: duration_seconds >= min_session_duration_secs?
4. Verificar idempotência: já existe evento workout_completed para esta sessão?
5. Calcular exercícios completados (sets_done > 0)
6. Buscar total planejado na rotina (workout_items count)
7. Construir lista de eventos:
   a. workout_completed (+50)
   b. exercise_completed (+5 × n_exercícios_feitos)
   c. workout_100_percent (+30 se n_feitos >= n_planejados)
   d. active_minutes (+1/min, cap 120min)
   e. load_increased (+20 por exercício com carga > sessão anterior, skip se suspeito)
8. Aplicar cap de pontos por sessão (ratio proporcional)
9. Inserir todos os eventos em gamification_events
10. Verificar bônus semanal (3+ treinos na semana, sem bônus já dado)
    → inserir weekly_bonus event
    → award badge 'foco_total'
11. Verificar bônus mensal (4 semanas × 3 treinos, sem bônus já dado)
    → inserir monthly_consistency event
    → award badges 'consistencia_maxima' + 'disciplina'
12. Recalcular monthly_points (upsert via soma de events)
13. Award badges condicionais:
    → 'treino_completo' se 100% completado
    → 'evolucao_aco' se houve load_increased válido
14. Verificar Top 10 (posição calculada on-the-fly)
    → award 'top_10' se rank <= 10
15. revalidatePath('/student/ranking') + revalidatePath('/admin/ranking')
```

### 4.3 Cálculo de Posição (sem stored rank)

```typescript
// Posição do aluno:
const { count: aboveMe } = await supabase
  .from('monthly_points')
  .select('id', { count: 'exact', head: true })
  .eq('month', month).eq('year', year)
  .gt('total_points', myPoints.total_points)

const myRank = aboveMe + 1

// Ranking completo (ordenado no SELECT):
const { data } = await supabase
  .from('monthly_points')
  .select('...')
  .eq('month', month).eq('year', year)
  .order('total_points', { ascending: false })
  .order('workouts_completed', { ascending: false })
// → posição = índice + 1
```

---

## 5. Estratégia de Fechamento Mensal

### 5.1 Opções de Fechamento

**Opção A — Manual (via Admin Web):**
- Admin acessa `/admin/ranking`
- Seleciona mês e ano
- Clica em "Fechar e Registrar Campeão"
- `closeMonthlyRanking(month, year)` é chamada

**Opção B — Automático (Edge Function + Cron):**
- Edge function `close-monthly-ranking` configurada com cron
- Cron sugerido: `0 3 1 * *` (dia 1 de cada mês às 3h BRT)
- Para configurar no Supabase Dashboard:

```bash
# Via CLI
supabase functions deploy close-monthly-ranking

# Configurar cron via Dashboard:
# Project Settings → Edge Functions → Schedules
# Schedule: "0 6 1 * *" (UTC = 3h BRT)
```

### 5.2 O que acontece ao fechar

```
1. Buscar todos os monthly_points do mês (ordenados por pontos)
2. Construir array `rankings` com Top N
3. Inserir/atualizar monthly_ranking_snapshots (upsert por month/year)
4. Conceder badge 'campeao_mes' ao 1º lugar
5. Conceder badge 'top_10' às posições 1-10 (se ainda não tiverem)
6. Log de sucesso
```

### 5.3 Reabertura / Recálculo

- `closeMonthlyRanking` usa `upsert` — pode ser chamada novamente para corrigir
- `recalculateStudentPoints(studentId, month, year)` — recalcula pontos de 1 aluno
- Para recalcular todos: chamar `updateMonthlyPoints` para cada aluno do mês

---

## 6. Arquivos do Módulo

### 6.1 Backend (Next.js)

```
src/app/actions/gamification.ts          → Todas as server actions do módulo
src/actions/workout-sessions.ts          → Modificado: chama processWorkoutGamification
```

**Server Actions exportadas:**
| Função | Uso | Contexto |
|--------|-----|---------|
| `getGamificationSettings()` | Ler configurações | Qualquer autenticado |
| `updateGamificationSettings(updates)` | Alterar configurações | `global_admin` |
| `processWorkoutGamification(sessionId)` | Processar treino | Interno (student) |
| `getCurrentRanking(limit?)` | Ranking do mês atual | Qualquer autenticado |
| `getMyRankingCard()` | Card pessoal do aluno | Student |
| `getRankingHistory(limit?)` | Histórico de snapshots | Qualquer autenticado |
| `closeMonthlyRanking(month, year)` | Fechar mês | `global_admin` |
| `getAdminRanking(month, year, tenantId?)` | Ranking com filtros | `global_admin` |
| `recalculateStudentPoints(studentId, m, y)` | Recalcular manualmente | `global_admin` |
| `getTenantsForFilter()` | Lista tenants para filtro | `global_admin` |

### 6.2 Frontend (Next.js)

```
src/app/(student)/student/ranking/page.tsx      → Tela do aluno (Server Component)
src/app/(admin)/admin/ranking/page.tsx          → Tela admin (Server Component)
src/app/(admin)/admin/ranking/ranking-admin-client.tsx → Controles interativos (Client)
src/components/layout/student-sidebar.tsx       → Modificado: link condicional
src/components/layout/admin-sidebar.tsx         → Modificado: link Ranking adicionado
src/app/(student)/layout.tsx                    → Modificado: busca gamificationActive
```

### 6.3 Banco de Dados

```
supabase/migrations/20260623_gamification.sql   → Tabelas, índices, RLS, view
```

### 6.4 Edge Function

```
supabase/functions/close-monthly-ranking/index.ts → Fechamento automático mensal
```

---

## 7. UX e Interface

### 7.1 Tela do Aluno (`/student/ranking`)

**Visível apenas quando `is_active = true`**

Seções:
1. **Header** — título, mês atual, total de participantes
2. **Meu Card** — destaque com minha posição, pontos, stats, badges do mês, mensagem motivacional
3. **Campeão anterior** — banner amarelo com o vencedor do mês passado
4. **Pódio Top 3** — cards visuais ouro/prata/bronze em layout de pódio
5. **Ranking completo** — lista com destaque especial para a própria linha do aluno
6. **Histórico** — campeões de meses anteriores
7. **Como ganhar pontos** — grid informativo com valores configurados

**Mensagens motivacionais dinâmicas:**
- `rank = 1` → "🏆 Você é o líder do ranking! Mantenha o ritmo!"
- `rank ≤ 3` → "🥇 Você está no Top 3! Faltam X pts para subir!"
- `rank ≤ 10` → "⭐ Você está no Top 10! Continue assim!"
- `pts_to_next < 50` → "🔥 Você está quase no próximo lugar! Faltam X pts!"
- `rank ≤ total/2` → "💪 Você está na metade superior! Continue treinando!"

### 7.2 Tela Admin (`/admin/ranking`)

Seções:
1. **Header** — status do ranking (ativo/inativo)
2. **Métricas** — participantes, pontos totais, treinos, média de pontos
3. **Painel de controle** (Client Component):
   - Toggle ativar/desativar
   - Seletor de mês/ano + botão "Fechar e Registrar Campeão"
4. **Filtro por personal trainer**
5. **Ranking com tabela** — posição, nome, treinos, exercícios, cargas+, pontos
6. **Histórico de campeões** — accordion expansível por mês
7. **Análise rápida** — Mais ativos, Maior evolução, Por personal
8. **Configurações** — exibe pesos configurados

---

## 8. Guia de Implementação para App Android

### 8.1 Endpoints Necessários

O app Android consome os mesmos dados via Supabase SDK ou via API REST. Recomenda-se usar o **Supabase SDK para Kotlin**.

#### 8.1.1 Verificar se gamificação está ativa

```kotlin
val settings = supabase.from("gamification_settings")
    .select("is_active")
    .decodeSingle<GamificationSettings>()

if (!settings.isActive) {
    // Ocultar aba de ranking
}
```

#### 8.1.2 Buscar ranking do mês atual

```kotlin
val now = LocalDate.now()
val month = now.monthValue
val year = now.year

val ranking = supabase.from("monthly_points")
    .select("student_id, total_points, workouts_completed, " +
            "students(full_name, avatar_url, tenants(name))")
    .eq("month", month)
    .eq("year", year)
    .order("total_points", ascending = false)
    .limit(50)
    .decodeList<RankingEntry>()

// Calcular posição localmente: index + 1
```

#### 8.1.3 Buscar card do próprio aluno

```kotlin
// 1. Buscar studentId pelo userId
val student = supabase.from("students")
    .select("id")
    .eq("user_id", supabase.auth.currentUserOrNull()?.id ?: return)
    .decodeSingle<Student>()

// 2. Buscar pontos mensais
val myPoints = supabase.from("monthly_points")
    .select("*")
    .eq("student_id", student.id)
    .eq("month", month)
    .eq("year", year)
    .decodeSingleOrNull<MonthlyPoints>()

// 3. Calcular posição
val aboveMe = supabase.from("monthly_points")
    .select("id", head = true, count = Count.EXACT)
    .eq("month", month)
    .eq("year", year)
    .gt("total_points", myPoints?.totalPoints ?: 0)
    .countOrNull() ?: 0

val myRank = aboveMe + 1

// 4. Buscar badges do mês
val badges = supabase.from("student_badges")
    .select("badge_type, earned_at")
    .eq("student_id", student.id)
    .eq("month", month)
    .eq("year", year)
    .decodeList<Badge>()
```

#### 8.1.4 Buscar histórico de campeões

```kotlin
val history = supabase.from("monthly_ranking_snapshots")
    .select("id, month, year, closed_at, champion_id, rankings")
    .order("year", ascending = false)
    .order("month", ascending = false)
    .limit(6)
    .decodeList<RankingSnapshot>()
```

### 8.2 Modelos de Dados Kotlin

```kotlin
@Serializable
data class GamificationSettings(
    @SerialName("is_active") val isActive: Boolean,
    @SerialName("pts_workout_completed") val ptsWorkoutCompleted: Int = 50,
    @SerialName("pts_exercise_completed") val ptsExerciseCompleted: Int = 5,
    @SerialName("pts_workout_100_percent") val ptsWorkout100Percent: Int = 30,
    @SerialName("pts_load_increase") val ptsLoadIncrease: Int = 20,
    @SerialName("pts_weekly_bonus") val ptsWeeklyBonus: Int = 100,
    @SerialName("pts_monthly_consistency") val ptsMonthlyConsistency: Int = 300,
)

@Serializable
data class MonthlyPoints(
    @SerialName("student_id") val studentId: String,
    @SerialName("total_points") val totalPoints: Int,
    @SerialName("workouts_completed") val workoutsCompleted: Int,
    @SerialName("exercises_completed") val exercisesCompleted: Int,
    @SerialName("load_increases") val loadIncreases: Int,
    @SerialName("active_minutes") val activeMinutes: Int,
    @SerialName("weekly_bonuses") val weeklyBonuses: Int,
    @SerialName("consistency_bonuses") val consistencyBonuses: Int,
)

@Serializable
data class Badge(
    @SerialName("badge_type") val badgeType: String,
    @SerialName("earned_at") val earnedAt: String,
)

@Serializable
data class RankingEntry(
    @SerialName("student_id") val studentId: String,
    @SerialName("total_points") val totalPoints: Int,
    @SerialName("workouts_completed") val workoutsCompleted: Int,
    val students: StudentInfo?,
) {
    val rankPosition: Int = 0 // preenchido localmente
}

@Serializable
data class StudentInfo(
    @SerialName("full_name") val fullName: String,
    @SerialName("avatar_url") val avatarUrl: String?,
    val tenants: TenantInfo?,
)

@Serializable
data class TenantInfo(val name: String)

@Serializable
data class RankingSnapshot(
    val id: String,
    val month: Int,
    val year: Int,
    @SerialName("closed_at") val closedAt: String,
    val rankings: List<SnapshotEntry>,
)

@Serializable
data class SnapshotEntry(
    val position: Int,
    @SerialName("student_name") val studentName: String,
    @SerialName("trainer_name") val trainerName: String?,
    val points: Int,
)
```

### 8.3 Badges no App Android

```kotlin
enum class BadgeType(val label: String, val icon: Int) {
    FOCO_TOTAL("Foco Total", R.drawable.ic_flame),
    EVOLUCAO_ACO("Evolução de Aço", R.drawable.ic_trending_up),
    CONSISTENCIA_MAXIMA("Consistência Máx.", R.drawable.ic_shield),
    TOP_10("Top 10", R.drawable.ic_star),
    CAMPEAO_MES("Campeão do Mês", R.drawable.ic_crown),
    DISCIPLINA("Disciplina", R.drawable.ic_target),
    TREINO_COMPLETO("Treino Completo", R.drawable.ic_zap);

    companion object {
        fun from(type: String) = values().find { it.name.lowercase() == type } ?: TREINO_COMPLETO
    }
}
```

### 8.4 Onde o App Android NÃO processa pontos

O app Android **não calcula nem envia pontos**. Ele apenas:
- Exibe o ranking (leitura de `monthly_points`)
- Exibe o card do aluno
- Exibe badges

O cálculo ocorre no backend Next.js quando `finishWorkoutSession` é chamado. Se no futuro o Android tiver execução de treinos, deve chamar a API/webhook equivalente para que o backend processe a pontuação.

### 8.5 Tela de Ranking Sugerida (Android)

```
┌─────────────────────────────────┐
│  🏆 Ranking dos Campeões        │
│  Junho 2026 · 47 participantes  │
├─────────────────────────────────┤
│  [MEU CARD — destaque verde]    │
│  #5 de 47 · 830 pts             │
│  Faltam 70 pts para o 4º lugar  │
│  Badges: 🔥 ⚡ ⭐              │
│  "Você está no Top 10!"         │
├─────────────────────────────────┤
│         [PÓDIO]                 │
│    🥈        🥇        🥉      │
│  Pedro   Ana Lima    Marcos      │
│  810pts  1.240pts   720pts      │
├─────────────────────────────────┤
│  CLASSIFICAÇÃO GERAL            │
│  1  Ana Lima      1.240 ▲       │
│  2  Pedro Santos    810         │
│  3  Marcos Silva    720         │
│  4  Juliana F.      900 ▲       │
│  ► 5  Você (Ana)   830          │
│  ...                            │
└─────────────────────────────────┘
```

---

## 9. Segurança e Confiabilidade

### 9.1 Por que o app não envia pontos prontos?

Se o cliente (web ou mobile) enviasse a pontuação calculada, seria trivial manipulá-la. O backend:
1. Recebe apenas o `session_id` (dado interno do banco)
2. Busca todos os dados da sessão diretamente do banco
3. Calcula a pontuação com base em dados não editáveis pelo cliente
4. Verifica idempotência (não processa a mesma sessão duas vezes)

### 9.2 Detecção de Anomalias

```typescript
// Sessão muito curta → ignorada
if (duration_seconds < min_session_duration_secs) return

// Carga suspeita → pontos zerados, marcado is_suspicious = true
if (increase_ratio > 2.0) {
  event.points = 0
  event.is_suspicious = true
}

// Tempo excessivo → capped (não bloqueado, apenas limitado)
const minutes = Math.min(actual_minutes, max_minutes_per_session)

// Cap total da sessão → proporção aplicada
if (total > max_pts_per_session) {
  each_event.points = floor(each_event.points × ratio)
}
```

### 9.3 Idempotência

```typescript
// Verifica antes de processar:
const { count } = await supabase
  .from('gamification_events')
  .select('id', { count: 'exact', head: true })
  .eq('session_id', sessionId)
  .eq('event_type', 'workout_completed')

if (count > 0) return // já processado
```

### 9.4 RLS como camada adicional

Mesmo que um request malicioso tente inserir eventos diretamente via PostgREST:
- Política `gamif_events_own_insert`: só pode inserir se `student_id` mapeia para `auth.uid()`
- Política `gamif_events_own_read`: só pode ler os próprios eventos
- Cálculos que precisam ver todos os dados (`monthly_points`, etc.) são feitos via server actions com privilégios validados

---

## 10. Configuração e Deploy

### 10.1 Aplicar Migration

```bash
# Via Supabase CLI
supabase db push

# Ou via MCP (Supabase MCP no Claude)
# apply_migration com o conteúdo de 20260623_gamification.sql
```

### 10.2 Deploy da Edge Function

```bash
supabase functions deploy close-monthly-ranking
```

### 10.3 Configurar Cron (Supabase Dashboard)

```
Project → Edge Functions → Schedules → New Schedule
Function: close-monthly-ranking
Schedule: 0 6 1 * *   (UTC = 3h BRT, dia 1 de cada mês)
```

### 10.4 Ativar o Módulo

1. Acessar `/admin/ranking`
2. Clicar em "Ativar Ranking"
3. Confirmar no dialog
4. O módulo aparece automaticamente para todos os alunos

---

## 11. Manutenção e Operação

### 11.1 Recalcular pontos manualmente

Via server action (chamada pelo admin via UI futura ou direto):
```typescript
await recalculateStudentPoints(studentId, month, year)
```

### 11.2 Verificar eventos suspeitos

```sql
SELECT s.full_name, ge.metadata, ge.created_at
FROM gamification_events ge
JOIN students s ON s.id = ge.student_id
WHERE ge.is_suspicious = true
ORDER BY ge.created_at DESC;
```

### 11.3 Ranking de um mês específico

```sql
SELECT
  ROW_NUMBER() OVER (ORDER BY total_points DESC) as pos,
  s.full_name, t.name as trainer, mp.total_points, mp.workouts_completed
FROM monthly_points mp
JOIN students s ON s.id = mp.student_id
LEFT JOIN tenants t ON t.id = s.tenant_id
WHERE mp.month = 5 AND mp.year = 2026
ORDER BY total_points DESC;
```

### 11.4 Auditar sessão específica

```sql
SELECT event_type, points, metadata, is_suspicious, created_at
FROM gamification_events
WHERE session_id = '<session_id>'
ORDER BY created_at;
```

---

*Documento gerado para o projeto StrivePersonal — Junho 2026.*
