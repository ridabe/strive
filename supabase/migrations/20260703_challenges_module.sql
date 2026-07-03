-- Módulo Desafios: desafio (ex.: 21 dias) com participantes, dias, itens diários,
-- progresso e mensagens de acompanhamento.

CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  prizes TEXT,
  duration_days INT NOT NULL,
  release_mode TEXT NOT NULL DEFAULT 'progressive' CHECK (release_mode IN ('progressive', 'all_at_once')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finished', 'published')),
  start_date DATE,
  show_results_to_students BOOLEAN NOT NULL DEFAULT true,
  results_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  initial_age INT,
  initial_weight NUMERIC,
  initial_body_fat NUMERIC,
  initial_arm NUMERIC,
  initial_chest NUMERIC,
  initial_waist NUMERIC,
  initial_hip NUMERIC,
  initial_thigh NUMERIC,
  final_weight NUMERIC,
  final_body_fat NUMERIC,
  final_arm NUMERIC,
  final_chest NUMERIC,
  final_waist NUMERIC,
  final_hip NUMERIC,
  final_thigh NUMERIC,
  final_notes TEXT,
  result_rank INT,
  result_delta_pp NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, student_id)
);

CREATE TABLE IF NOT EXISTS challenge_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  title TEXT,
  release_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, day_number)
);

CREATE TABLE IF NOT EXISTS challenge_day_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  challenge_day_id UUID NOT NULL REFERENCES challenge_days(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('exercise', 'reading', 'file', 'tip')),
  title TEXT NOT NULL,
  content TEXT,
  exercise_id UUID REFERENCES exercises(id),
  file_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_item_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  challenge_day_item_id UUID NOT NULL REFERENCES challenge_day_items(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_day_item_id, participant_id)
);

CREATE TABLE IF NOT EXISTS challenge_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_tenant ON challenges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_student ON challenge_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_challenge_days_challenge ON challenge_days(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_day_items_day ON challenge_day_items(challenge_day_id);
CREATE INDEX IF NOT EXISTS idx_challenge_item_progress_item ON challenge_item_progress(challenge_day_item_id);
CREATE INDEX IF NOT EXISTS idx_challenge_item_progress_participant ON challenge_item_progress(participant_id);
CREATE INDEX IF NOT EXISTS idx_challenge_messages_challenge ON challenge_messages(challenge_id);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_day_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_item_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_day_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_item_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenges TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_participants TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_days TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_day_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_item_progress TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE challenge_messages TO service_role;

-- ── challenges ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "personal_manage_challenges" ON challenges;
CREATE POLICY "personal_manage_challenges" ON challenges
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "student_view_challenges" ON challenges;
CREATE POLICY "student_view_challenges" ON challenges
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT cp.challenge_id FROM challenge_participants cp
      JOIN students s ON s.id = cp.student_id
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_all" ON challenges;
CREATE POLICY "service_role_all" ON challenges
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── challenge_participants ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "personal_manage_participants" ON challenge_participants;
CREATE POLICY "personal_manage_participants" ON challenge_participants
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "student_view_own_participation" ON challenge_participants;
CREATE POLICY "student_view_own_participation" ON challenge_participants
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "service_role_all" ON challenge_participants;
CREATE POLICY "service_role_all" ON challenge_participants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── challenge_days ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "personal_manage_days" ON challenge_days;
CREATE POLICY "personal_manage_days" ON challenge_days
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "student_view_published_days" ON challenge_days;
CREATE POLICY "student_view_published_days" ON challenge_days
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND challenge_id IN (
      SELECT cp.challenge_id FROM challenge_participants cp
      JOIN students s ON s.id = cp.student_id
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_all" ON challenge_days;
CREATE POLICY "service_role_all" ON challenge_days
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── challenge_day_items ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "personal_manage_items" ON challenge_day_items;
CREATE POLICY "personal_manage_items" ON challenge_day_items
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "student_view_items" ON challenge_day_items;
CREATE POLICY "student_view_items" ON challenge_day_items
  FOR SELECT
  TO authenticated
  USING (
    challenge_day_id IN (
      SELECT cd.id FROM challenge_days cd
      WHERE cd.status = 'published'
      AND cd.challenge_id IN (
        SELECT cp.challenge_id FROM challenge_participants cp
        JOIN students s ON s.id = cp.student_id
        WHERE s.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "service_role_all" ON challenge_day_items;
CREATE POLICY "service_role_all" ON challenge_day_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── challenge_item_progress ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "personal_view_progress" ON challenge_item_progress;
CREATE POLICY "personal_view_progress" ON challenge_item_progress
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "student_manage_own_progress" ON challenge_item_progress;
CREATE POLICY "student_manage_own_progress" ON challenge_item_progress
  FOR ALL
  TO authenticated
  USING (
    participant_id IN (
      SELECT cp.id FROM challenge_participants cp
      JOIN students s ON s.id = cp.student_id
      WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    participant_id IN (
      SELECT cp.id FROM challenge_participants cp
      JOIN students s ON s.id = cp.student_id
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_all" ON challenge_item_progress;
CREATE POLICY "service_role_all" ON challenge_item_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── challenge_messages ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "personal_manage_messages" ON challenge_messages;
CREATE POLICY "personal_manage_messages" ON challenge_messages
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "student_view_messages" ON challenge_messages;
CREATE POLICY "student_view_messages" ON challenge_messages
  FOR SELECT
  TO authenticated
  USING (
    challenge_id IN (
      SELECT cp.challenge_id FROM challenge_participants cp
      JOIN students s ON s.id = cp.student_id
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_all" ON challenge_messages;
CREATE POLICY "service_role_all" ON challenge_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Catálogo de módulos ──────────────────────────────────────────────────────
INSERT INTO system_modules (name, slug, description, category, status, icon, available, sort_order)
VALUES (
  'Desafios',
  'desafios',
  'Crie desafios com regras, premiações e acompanhamento diário para seus alunos.',
  'acompanhamento',
  'active',
  'Trophy',
  true,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM system_modules WHERE category = 'acompanhamento')
)
ON CONFLICT (slug) DO NOTHING;
