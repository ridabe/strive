-- Corrige FK: student_id deve apontar para students(id), não profiles(id)
-- O seletor usa students.id; o aluno acessa via students.user_id = auth.uid()

ALTER TABLE agenda_events DROP CONSTRAINT IF EXISTS agenda_events_student_id_fkey;

ALTER TABLE agenda_events
  ADD CONSTRAINT agenda_events_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Atualiza RLS do aluno: usa join students -> user_id
DROP POLICY IF EXISTS "agenda_events_student_select" ON agenda_events;

CREATE POLICY "agenda_events_student_select" ON agenda_events
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );
