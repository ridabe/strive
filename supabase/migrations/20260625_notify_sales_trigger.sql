-- ============================================================
-- Notificação automática de vendas — novo cliente cadastrado
-- Dispara via pg_net → Edge Function → Resend → vendas@strivepersonal.com.br
--
-- Cobre TODOS os canais de cadastro sem alterar código:
--   • Cadastro pela web (app Next.js)
--   • Cadastro pelo app mobile (direto no Supabase)
--   • Criação manual pelo admin
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ── Tabela de configurações internas ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE internal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role only" ON internal_config
  USING (auth.role() = 'service_role');

-- ── Função do trigger ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_notify_sales_new_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret       text;
  v_function_url text;
  v_email        text;
  v_full_name    text;
  v_source       text;
BEGIN
  SELECT value INTO v_secret       FROM internal_config WHERE key = 'notify_sales_secret';
  SELECT value INTO v_function_url FROM internal_config WHERE key = 'supabase_url';
  v_function_url := v_function_url || '/functions/v1/notify-sales-new-client';

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING '[notify-sales] Segredo não configurado em internal_config';
    RETURN NEW;
  END IF;

  SELECT au.email, p.full_name
    INTO v_email, v_full_name
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.tenant_id = NEW.id AND p.role = 'personal'
  LIMIT 1;

  v_full_name := COALESCE(v_full_name, NEW.business_name);
  v_source    := CASE WHEN v_email IS NOT NULL THEN 'web' ELSE 'mobile/admin' END;

  PERFORM extensions.http_post(
    url     := v_function_url,
    headers := jsonb_build_object(
      'Content-Type',    'application/json',
      'x-notify-secret', v_secret
    ),
    body    := jsonb_build_object(
      'full_name',     v_full_name,
      'email',         COALESCE(v_email, ''),
      'business_name', NEW.business_name,
      'plan',          NEW.plan,
      'slug',          NEW.slug,
      'registered_at', NEW.created_at,
      'source',        v_source
    )
  );

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[notify-sales] Erro: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ── Trigger ───────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_notify_sales_new_client ON tenants;

CREATE TRIGGER trg_notify_sales_new_client
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_sales_new_client();

COMMENT ON FUNCTION trigger_notify_sales_new_client() IS
  'Notifica vendas@strivepersonal.com.br via Edge Function quando um novo tenant é criado.';
