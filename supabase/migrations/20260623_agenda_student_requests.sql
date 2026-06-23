-- Fluxo de solicitação de aula presencial pelo aluno
-- Aluno cria solicitação → personal confirma ou recusa com justificativa

-- 1. Atualizar CHECK de status para incluir novos valores
ALTER TABLE agenda_events DROP CONSTRAINT IF EXISTS agenda_events_status_check;
ALTER TABLE agenda_events ADD CONSTRAINT agenda_events_status_check
  CHECK (status IN ('scheduled', 'completed', 'cancelled', 'pending_confirmation', 'rejected'));

-- 2. Adicionar novos campos
ALTER TABLE agenda_events
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS address_cep text;

ALTER TABLE agenda_events DROP CONSTRAINT IF EXISTS agenda_events_origin_check;
ALTER TABLE agenda_events ADD CONSTRAINT agenda_events_origin_check
  CHECK (origin IN ('personal', 'student'));

-- 3. RLS: aluno pode INSERT sua própria solicitação presencial
--    (status deve ser pending_confirmation, origin = student, student_id = próprio students.id)
CREATE POLICY "agenda_events_student_insert" ON agenda_events
  FOR INSERT WITH CHECK (
    origin = 'student'
    AND status = 'pending_confirmation'
    AND type = 'presencial'
    AND student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );

-- 4. Atualizar RLS do aluno para SELECT incluir pending_confirmation e rejected
--    (a policy anterior filtrava por status = 'scheduled'; agora inclui todos)
DROP POLICY IF EXISTS "agenda_events_student_select" ON agenda_events;

CREATE POLICY "agenda_events_student_select" ON agenda_events
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );
