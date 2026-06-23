-- ============================================================
-- Módulo: Minha Agenda
-- Slug: minha-agenda
-- Criado em: 2026-06-23
-- ============================================================

-- ─── Tabela principal de eventos ─────────────────────────────
CREATE TABLE IF NOT EXISTS agenda_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Tipo de evento: presencial | virtual | pagamento_a_fazer | pagamento_a_receber
  type            text        NOT NULL CHECK (type IN ('presencial', 'virtual', 'pagamento_a_fazer', 'pagamento_a_receber')),
  title           text        NOT NULL,
  event_date      date        NOT NULL,
  start_time      time,
  -- Para presencial/virtual: referência ao aluno (opcional — pode ser evento sem aluno)
  student_id      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  student_name    text,       -- nome denormalizado para exibição rápida
  -- Campos específicos de presencial
  location        text,
  -- Campos específicos de virtual
  meeting_url     text,
  -- Campos específicos de pagamentos
  amount          numeric(10, 2),
  description     text,
  -- Status
  status          text        NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  -- Notificação enviada no dia?
  notified        boolean     NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS agenda_events_tenant_date_idx ON agenda_events (tenant_id, event_date);
CREATE INDEX IF NOT EXISTS agenda_events_student_idx     ON agenda_events (student_id);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

-- Personal vê todos os eventos do seu tenant
CREATE POLICY "agenda_events_personal_select" ON agenda_events
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('personal', 'global_admin')
  );

CREATE POLICY "agenda_events_personal_write" ON agenda_events
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('personal', 'global_admin')
  );

-- Aluno vê apenas os eventos onde ele aparece como student_id
CREATE POLICY "agenda_events_student_select" ON agenda_events
  FOR SELECT USING (
    student_id = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );

-- ─── Trigger updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_agenda_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agenda_events_updated_at
  BEFORE UPDATE ON agenda_events
  FOR EACH ROW EXECUTE FUNCTION update_agenda_events_updated_at();

-- ─── Inserir módulo em system_modules ────────────────────────
INSERT INTO system_modules (name, slug, description, category, status, icon, available, sort_order)
VALUES (
  'Minha Agenda',
  'minha-agenda',
  'Gerencie compromissos, atendimentos presenciais e virtuais, e pagamentos em um calendário completo.',
  'comunicacao',
  'active',
  'CalendarDays',
  true,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM system_modules WHERE category = 'comunicacao')
)
ON CONFLICT (slug) DO UPDATE SET
  status    = 'active',
  available = true,
  updated_at = now();
