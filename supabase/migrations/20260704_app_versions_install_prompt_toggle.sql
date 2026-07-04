-- Chave global para ativar/desativar o banner de sugestão de instalação
-- do app (QR code / link Play Store) exibido no acesso via web.
-- Controlada pelo admin global em /admin/app-versao, junto com o restante
-- do controle de versão do app Android.

ALTER TABLE app_versions
  ADD COLUMN IF NOT EXISTS show_install_prompt boolean NOT NULL DEFAULT true;
