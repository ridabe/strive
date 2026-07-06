-- Cor de destaque para textos (menu ativo, links, títulos) — independente da
-- primary_color, que hoje só é aplicada a botões e fundos de destaque.
ALTER TABLE tenants
  ADD COLUMN accent_text_color text;
