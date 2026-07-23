-- Módulo "Biblioteca de Conteúdo" — Fase 5 (métricas de uso).
-- Contadores simples de engajamento por item, para o admin global priorizar
-- produção de conteúdo (itens mais salvos/usados). Sem tabela de eventos
-- detalhada por ora — apenas contadores agregados, incrementados via RPC
-- chamada pelo personal ao abrir o Canva ou baixar o arquivo.

alter table public.content_library_items
  add column if not exists canva_open_count integer not null default 0,
  add column if not exists download_count integer not null default 0;

create or replace function public.increment_content_library_item_usage(
  p_item_id uuid,
  p_event text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event not in ('canva_open', 'download') then
    raise exception 'evento inválido: %', p_event;
  end if;

  if p_event = 'canva_open' then
    update public.content_library_items
      set canva_open_count = canva_open_count + 1
      where id = p_item_id and status = 'published';
  else
    update public.content_library_items
      set download_count = download_count + 1
      where id = p_item_id and status = 'published';
  end if;
end;
$$;

grant execute on function public.increment_content_library_item_usage(uuid, text) to authenticated;
