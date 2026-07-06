-- Override manual da cor do texto renderizado sobre o fundo primary_color
-- (topo do sistema, badges de iniciais, botões). NULL = calcular automaticamente
-- por contraste (luminância); '#000000'/'#FFFFFF' = forçado pelo personal.
ALTER TABLE tenants
  ADD COLUMN on_primary_text_color text;
