DROP POLICY IF EXISTS "student_delete_messages" ON student_messages;
CREATE POLICY "student_delete_messages" ON student_messages
  FOR DELETE
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );
