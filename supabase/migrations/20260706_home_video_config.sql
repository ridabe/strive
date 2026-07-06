-- Configuração do vídeo do YouTube exibido na home pública
-- Singleton (uma única linha, id fixo) controlado pelo admin global.
-- Se youtube_url estiver NULL, a seção de vídeo não é exibida na home.

CREATE TABLE IF NOT EXISTS home_video_config (
  id          boolean     PRIMARY KEY DEFAULT true CHECK (id = true), -- garante linha única
  youtube_url text,                                                    -- URL completa do vídeo no YouTube
  title       text,                                                    -- título opcional exibido acima do vídeo
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid        REFERENCES auth.users(id)
);

-- Linha inicial (sem vídeo configurado)
INSERT INTO home_video_config (id, youtube_url, title)
VALUES (true, null, null)
ON CONFLICT (id) DO NOTHING;

-- RLS: leitura pública (home é acessada sem auth), escrita só global_admin
ALTER TABLE home_video_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_video_config_public_read"
  ON home_video_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "home_video_config_admin_write"
  ON home_video_config FOR ALL
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
