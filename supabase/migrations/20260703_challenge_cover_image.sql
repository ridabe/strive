-- Capa do desafio: coluna na tabela challenges + bucket de Storage dedicado.

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('challenge-covers', 'challenge-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
