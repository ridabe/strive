-- Tabela de controle de versão do app mobile
-- Lida pelo app para exibir alerta de atualização

CREATE TABLE IF NOT EXISTS app_versions (
  platform             text        PRIMARY KEY CHECK (platform IN ('android', 'ios')),
  current_version      text        NOT NULL,          -- ex: "1.0.2"  (exibição)
  current_version_code integer     NOT NULL,          -- ex: 2        (comparação)
  min_version_code     integer     NOT NULL,          -- abaixo disto → exige atualização
  force_update         boolean     NOT NULL DEFAULT false, -- true = bloqueia app, false = banner
  store_url            text,                          -- link da loja
  release_notes        text,                          -- novidades da versão
  updated_at           timestamptz NOT NULL DEFAULT now(),
  updated_by           uuid        REFERENCES auth.users(id)
);

-- Dados iniciais
INSERT INTO app_versions (platform, current_version, current_version_code, min_version_code, force_update, store_url)
VALUES
  ('android', '1.0.2', 2, 1, false, 'https://play.google.com/store/apps/details?id=com.strive.personal'),
  ('ios',     '1.0.2', 2, 1, false, null)
ON CONFLICT (platform) DO NOTHING;

-- RLS: leitura pública (app consulta sem auth), escrita só global_admin
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_versions_public_read"
  ON app_versions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "app_versions_admin_write"
  ON app_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'global_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'global_admin'
    )
  );
