CREATE TABLE IF NOT EXISTS ai_usage_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id       UUID NULL REFERENCES students(id) ON DELETE SET NULL,
  conversation_id  UUID NULL REFERENCES ai_conversations(id) ON DELETE SET NULL,
  actor_profile_id UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  feature_type     TEXT NOT NULL CHECK (feature_type IN (
    'chat', 'generate_plan', 'analyze_progress', 'suggest_load', 'motivation'
  )),
  provider         TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'unknown')),
  usage_kind       TEXT NOT NULL CHECK (usage_kind IN ('completion', 'embedding')),
  client_platform  TEXT NOT NULL DEFAULT 'unknown' CHECK (client_platform IN ('web', 'android', 'ios', 'unknown')),
  model            TEXT NULL,
  status           TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  input_tokens     INTEGER NOT NULL DEFAULT 0,
  output_tokens    INTEGER NOT NULL DEFAULT 0,
  request_count    INTEGER NOT NULL DEFAULT 1,
  latency_ms       INTEGER NULL,
  error_message    TEXT NULL,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_created_at
  ON ai_usage_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_tenant_created
  ON ai_usage_events (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_feature_created
  ON ai_usage_events (feature_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_provider_created
  ON ai_usage_events (provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_platform_created
  ON ai_usage_events (client_platform, created_at DESC);

ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_events_global_admin_select" ON ai_usage_events;
CREATE POLICY "ai_usage_events_global_admin_select" ON ai_usage_events
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'global_admin'
  );

DROP POLICY IF EXISTS "ai_usage_events_personal_tenant_select" ON ai_usage_events;
CREATE POLICY "ai_usage_events_personal_tenant_select" ON ai_usage_events
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'personal'
  );

DROP POLICY IF EXISTS "ai_usage_events_service_role_all" ON ai_usage_events;
CREATE POLICY "ai_usage_events_service_role_all" ON ai_usage_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON TABLE public.ai_usage_events TO authenticated;
GRANT ALL ON TABLE public.ai_usage_events TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ai_messages') IS NOT NULL
     AND to_regclass('public.ai_conversations') IS NOT NULL THEN
    INSERT INTO ai_usage_events (
      tenant_id,
      student_id,
      conversation_id,
      feature_type,
      provider,
      usage_kind,
      client_platform,
      model,
      status,
      input_tokens,
      output_tokens,
      metadata,
      created_at
    )
    SELECT
      conv.tenant_id,
      conv.student_id,
      conv.id,
      conv.feature_type,
      CASE
        WHEN COALESCE(msg.metadata->>'provider', '') = 'openai' THEN 'openai'
        WHEN COALESCE(msg.metadata->>'provider', '') = 'unknown' THEN 'unknown'
        ELSE 'anthropic'
      END AS provider,
      'completion' AS usage_kind,
      CASE
        WHEN COALESCE(msg.metadata->>'client_platform', '') IN ('web', 'android', 'ios')
          THEN msg.metadata->>'client_platform'
        ELSE 'unknown'
      END AS client_platform,
      NULLIF(msg.metadata->>'model', '') AS model,
      'success' AS status,
      COALESCE(NULLIF(msg.metadata->>'tokens_input', '')::INTEGER, 0) AS input_tokens,
      COALESCE(NULLIF(msg.metadata->>'tokens_output', '')::INTEGER, 0) AS output_tokens,
      jsonb_build_object(
        'source', 'legacy_ai_messages_backfill',
        'message_id', msg.id
      ) AS metadata,
      msg.created_at
    FROM ai_messages AS msg
    INNER JOIN ai_conversations AS conv
      ON conv.id = msg.conversation_id
    WHERE msg.role = 'assistant'
      AND NOT EXISTS (
        SELECT 1
        FROM ai_usage_events AS existing
        WHERE existing.conversation_id = conv.id
          AND existing.usage_kind = 'completion'
          AND existing.provider = CASE
            WHEN COALESCE(msg.metadata->>'provider', '') = 'openai' THEN 'openai'
            WHEN COALESCE(msg.metadata->>'provider', '') = 'unknown' THEN 'unknown'
            ELSE 'anthropic'
          END
          AND existing.created_at = msg.created_at
          AND existing.metadata->>'message_id' = msg.id::TEXT
      );
  END IF;
END $$;
