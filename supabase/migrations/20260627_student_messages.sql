CREATE TABLE IF NOT EXISTS student_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id),
  title TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_messages_student ON student_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_tenant ON student_messages(tenant_id);

ALTER TABLE student_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE student_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE student_messages TO service_role;

DROP POLICY IF EXISTS "personal_send_messages" ON student_messages;
CREATE POLICY "personal_send_messages" ON student_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "personal_view_messages" ON student_messages;
CREATE POLICY "personal_view_messages" ON student_messages
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "student_view_messages" ON student_messages;
CREATE POLICY "student_view_messages" ON student_messages
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );

DROP POLICY IF EXISTS "student_mark_read" ON student_messages;
CREATE POLICY "student_mark_read" ON student_messages
  FOR UPDATE
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  )
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );

DROP POLICY IF EXISTS "service_role_all" ON student_messages;
CREATE POLICY "service_role_all" ON student_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'student_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_messages;
  END IF;
END $$;
