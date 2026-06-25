-- ============================================================
-- Limite de alunos por plano — enforcement no banco de dados
-- Garante que o limite seja respeitado por qualquer cliente
-- (web, mobile, API direta) sem necessidade de código extra.
-- ============================================================

CREATE OR REPLACE FUNCTION enforce_student_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_students  integer;
  v_current_count integer;
BEGIN
  -- Só bloqueia INSERT com status active,
  -- ou UPDATE que reativa um aluno (inactive -> active).
  IF NOT (
    (TG_OP = 'INSERT' AND NEW.status = 'active') OR
    (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status <> 'active')
  ) THEN
    RETURN NEW;
  END IF;

  -- Limite do tenant
  SELECT max_students INTO v_max_students
  FROM tenants
  WHERE id = NEW.tenant_id;

  -- Contagem atual (exclui a própria linha no UPDATE)
  SELECT COUNT(*) INTO v_current_count
  FROM students
  WHERE tenant_id = NEW.tenant_id
    AND status = 'active'
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF v_current_count >= v_max_students THEN
    RAISE EXCEPTION 'STUDENT_LIMIT_EXCEEDED'
      USING
        DETAIL  = format('Limite de %s alunos atingido para o plano atual.', v_max_students),
        HINT    = 'Faça upgrade do plano para cadastrar mais alunos.';
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir, depois recria
DROP TRIGGER IF EXISTS trg_enforce_student_limit ON students;

CREATE TRIGGER trg_enforce_student_limit
  BEFORE INSERT OR UPDATE OF status ON students
  FOR EACH ROW
  EXECUTE FUNCTION enforce_student_limit();

COMMENT ON FUNCTION enforce_student_limit() IS
  'Impede INSERT/reativação de aluno quando o tenant já atingiu max_students do plano.';
