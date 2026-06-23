-- ============================================================
-- Módulo de Gamificação e Ranking Mensal
-- Timezone de referência: America/Sao_Paulo
-- ============================================================

-- ── 1. Configurações globais ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_settings (
  id                        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active                 boolean     DEFAULT false NOT NULL,
  -- Pesos de pontuação
  pts_workout_completed     integer     DEFAULT 50  NOT NULL,
  pts_exercise_completed    integer     DEFAULT 5   NOT NULL,
  pts_workout_100_percent   integer     DEFAULT 30  NOT NULL,
  pts_load_increase         integer     DEFAULT 20  NOT NULL,
  pts_weekly_bonus          integer     DEFAULT 100 NOT NULL,
  pts_monthly_consistency   integer     DEFAULT 300 NOT NULL,
  pts_per_minute_active     integer     DEFAULT 1   NOT NULL,
  -- Anti-abuso
  max_minutes_per_session   integer     DEFAULT 120 NOT NULL,
  max_pts_per_session       integer     DEFAULT 300 NOT NULL,
  min_session_duration_secs integer     DEFAULT 300 NOT NULL,
  -- Config
  ranking_timezone          text        DEFAULT 'America/Sao_Paulo' NOT NULL,
  updated_at                timestamptz DEFAULT now(),
  updated_by                uuid        REFERENCES profiles(id)
);

-- Seed com configurações padrão (desativado por padrão)
INSERT INTO gamification_settings (is_active) VALUES (false)
ON CONFLICT DO NOTHING;

-- ── 2. Eventos de gamificação (fonte da verdade) ──────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_events (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   uuid        REFERENCES students(id)        ON DELETE CASCADE NOT NULL,
  session_id   uuid        REFERENCES workout_sessions(id) ON DELETE CASCADE,
  event_type   text        NOT NULL,
  -- Tipos: 'workout_completed' | 'exercise_completed' | 'load_increased'
  --        | 'workout_100_percent' | 'active_minutes' | 'weekly_bonus'
  --        | 'monthly_consistency'
  points       integer     DEFAULT 0 NOT NULL,
  metadata     jsonb       DEFAULT '{}',
  event_month  smallint    NOT NULL,
  event_year   smallint    NOT NULL,
  is_suspicious boolean    DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gamif_events_student ON gamification_events(student_id);
CREATE INDEX IF NOT EXISTS idx_gamif_events_session  ON gamification_events(session_id);
CREATE INDEX IF NOT EXISTS idx_gamif_events_period   ON gamification_events(event_year, event_month);

-- ── 3. Pontuação mensal agregada ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_points (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id           uuid        REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  month                smallint    NOT NULL,
  year                 smallint    NOT NULL,
  total_points         integer     DEFAULT 0 NOT NULL,
  workouts_completed   integer     DEFAULT 0 NOT NULL,
  exercises_completed  integer     DEFAULT 0 NOT NULL,
  load_increases       integer     DEFAULT 0 NOT NULL,
  active_minutes       integer     DEFAULT 0 NOT NULL,
  weekly_bonuses       integer     DEFAULT 0 NOT NULL,
  consistency_bonuses  integer     DEFAULT 0 NOT NULL,
  last_calculated_at   timestamptz DEFAULT now(),
  UNIQUE(student_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_points_period ON monthly_points(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_points_total  ON monthly_points(year, month, total_points DESC);

-- ── 4. Snapshots de meses fechados ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_ranking_snapshots (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  month       smallint    NOT NULL,
  year        smallint    NOT NULL,
  closed_at   timestamptz DEFAULT now(),
  closed_by   uuid        REFERENCES profiles(id),
  rankings    jsonb       DEFAULT '[]' NOT NULL,
  -- [{ position, student_id, student_name, trainer_name, points, workouts_completed }]
  champion_id uuid        REFERENCES students(id),
  UNIQUE(month, year)
);

-- ── 5. Badges dos alunos ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_badges (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid        REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  badge_type text        NOT NULL,
  -- Tipos: 'foco_total' | 'evolucao_aco' | 'consistencia_maxima' | 'top_10'
  --        | 'campeao_mes' | 'disciplina' | 'treino_completo'
  month      smallint,
  year       smallint,
  metadata   jsonb       DEFAULT '{}',
  earned_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_badges_period  ON student_badges(year, month);
-- Evita duplicatas de badge por mês
CREATE UNIQUE INDEX IF NOT EXISTS idx_badges_unique_monthly
  ON student_badges(student_id, badge_type, month, year)
  WHERE month IS NOT NULL AND year IS NOT NULL;

-- ── RLS: gamification_settings ────────────────────────────────────────────────
ALTER TABLE gamification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gamif_settings_read" ON gamification_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "gamif_settings_admin" ON gamification_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'global_admin')
  );

-- ── RLS: gamification_events ──────────────────────────────────────────────────
ALTER TABLE gamification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gamif_events_own_read" ON gamification_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE id = student_id AND user_id = auth.uid())
  );

CREATE POLICY "gamif_events_own_insert" ON gamification_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = student_id AND user_id = auth.uid())
  );

CREATE POLICY "gamif_events_admin" ON gamification_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'global_admin')
  );

-- ── RLS: monthly_points ───────────────────────────────────────────────────────
ALTER TABLE monthly_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_pts_read_all" ON monthly_points
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "monthly_pts_own_write" ON monthly_points
  FOR ALL USING (
    EXISTS (SELECT 1 FROM students WHERE id = student_id AND user_id = auth.uid())
  );

CREATE POLICY "monthly_pts_admin" ON monthly_points
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'global_admin')
  );

-- ── RLS: monthly_ranking_snapshots ────────────────────────────────────────────
ALTER TABLE monthly_ranking_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_read_all" ON monthly_ranking_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "snapshots_admin" ON monthly_ranking_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'global_admin')
  );

-- ── RLS: student_badges ───────────────────────────────────────────────────────
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_read_all" ON student_badges
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "badges_own_write" ON student_badges
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = student_id AND user_id = auth.uid())
  );

CREATE POLICY "badges_admin" ON student_badges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'global_admin')
  );

-- ── Função auxiliar: recalcular posições do mês (SECURITY DEFINER) ────────────
-- Necessário pois o aluno só tem acesso aos próprios dados mas
-- precisamos atualizar todos os ranks do mês de uma vez.
-- Removemos rank_position da tabela e usamos ROW_NUMBER() nas queries.

-- ── View: ranking atual (facilita queries) ─────────────────────────────────────
CREATE OR REPLACE VIEW current_ranking AS
SELECT
  mp.student_id,
  mp.month,
  mp.year,
  mp.total_points,
  mp.workouts_completed,
  mp.exercises_completed,
  mp.load_increases,
  mp.active_minutes,
  mp.weekly_bonuses,
  mp.consistency_bonuses,
  ROW_NUMBER() OVER (
    PARTITION BY mp.month, mp.year
    ORDER BY mp.total_points DESC, mp.workouts_completed DESC
  ) AS rank_position,
  s.full_name        AS student_name,
  s.avatar_url       AS student_avatar,
  t.name             AS trainer_name,
  t.id               AS tenant_id
FROM monthly_points mp
JOIN students s ON s.id = mp.student_id
LEFT JOIN tenants t ON t.id = s.tenant_id;
