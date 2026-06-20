-- ============================================================
-- Módulo: Planos de Treino Personalizados
-- Expande workout_plans + cria workout_routines e workout_items
-- ============================================================

-- 1. Adiciona colunas de vigência ao plano macro
ALTER TABLE workout_plans
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date   date,
  ADD COLUMN IF NOT EXISTS goal       text;   -- "Hipertrofia", "Emagrecimento", etc.

-- 2. Rotinas (divisões A/B/C) vinculadas ao plano
CREATE TABLE IF NOT EXISTS workout_routines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid        NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  tenant_id       uuid        NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
  name            text        NOT NULL,               -- "Treino A — Membros Superiores"
  day_of_week     smallint,                           -- 0=Dom … 6=Sáb, NULL=sem dia fixo
  display_order   smallint    NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 3. Itens de treino: vínculo real com banco de exercícios
CREATE TABLE IF NOT EXISTS workout_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id       uuid        NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
  tenant_id        uuid        NOT NULL REFERENCES tenants(id)          ON DELETE CASCADE,
  exercise_id      uuid        NOT NULL REFERENCES exercises(id)        ON DELETE RESTRICT,
  -- Combinação: itens com o mesmo combo_group_id formam bi-set/tri-set/circuito
  combo_group_id   uuid,
  combo_type       text CHECK (combo_type IN ('biset','triset','circuit')),
  display_order    smallint    NOT NULL DEFAULT 0,
  sets             smallint,
  reps             text,               -- "10-12" ou "12" ou "até a falha"
  duration_secs    integer,            -- quando count_type = 'time' ou 'both'
  rest_seconds     integer,
  load             text,               -- "20kg", "Peso corporal", "faixa verde"
  count_type       text        NOT NULL DEFAULT 'reps'
                   CHECK (count_type IN ('reps','time','both')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Índices para queries de carregamento do plano completo
CREATE INDEX IF NOT EXISTS idx_workout_routines_plan
  ON workout_routines (workout_plan_id);

CREATE INDEX IF NOT EXISTS idx_workout_items_routine
  ON workout_items (routine_id);

CREATE INDEX IF NOT EXISTS idx_workout_items_combo
  ON workout_items (combo_group_id) WHERE combo_group_id IS NOT NULL;

-- Trigger de updated_at nas rotinas
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_workout_routines_updated_at ON workout_routines;
CREATE TRIGGER trg_workout_routines_updated_at
  BEFORE UPDATE ON workout_routines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS — workout_routines
-- ============================================================
ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;

-- Personal: CRUD nos próprios planos
CREATE POLICY "tenant: full access to own routines"
  ON workout_routines FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1
    )
  );

-- Aluno: somente leitura dos treinos que lhe foram atribuídos
CREATE POLICY "student: read own routines"
  ON workout_routines FOR SELECT
  USING (
    workout_plan_id IN (
      SELECT id FROM workout_plans
      WHERE student_id = (
        SELECT id FROM students WHERE profile_id = auth.uid() LIMIT 1
      )
    )
  );

-- ============================================================
-- RLS — workout_items
-- ============================================================
ALTER TABLE workout_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant: full access to own items"
  ON workout_items FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "student: read own items"
  ON workout_items FOR SELECT
  USING (
    routine_id IN (
      SELECT wr.id FROM workout_routines wr
      JOIN workout_plans wp ON wp.id = wr.workout_plan_id
      WHERE wp.student_id = (
        SELECT id FROM students WHERE profile_id = auth.uid() LIMIT 1
      )
    )
  );
