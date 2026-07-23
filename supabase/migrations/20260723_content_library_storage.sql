-- Bucket de Storage para thumbnails e arquivos (PDF/planilha) da Biblioteca de
-- Conteúdo. Só o admin global publica itens no catálogo, então escrita fica
-- restrita a global_admin; leitura é pública (mesmo padrão de client-logos e
-- challenge-covers). Policies já vêm junto nesta mesma migration — aprendizado
-- do bug do bucket challenge-covers, que foi criado sem nenhuma policy.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-library',
  'content-library',
  true,
  20971520, -- 20MB (PDFs/planilhas maiores que imagens)
  array[
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
)
on conflict (id) do nothing;

create policy "content_library: leitura pública"
  on storage.objects for select
  using (bucket_id = 'content-library');

create policy "content_library: upload global_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'content-library'
    and auth.role() = 'authenticated'
    and get_my_role() = 'global_admin'::app_role
  );

create policy "content_library: update global_admin"
  on storage.objects for update
  using (
    bucket_id = 'content-library'
    and auth.role() = 'authenticated'
    and get_my_role() = 'global_admin'::app_role
  )
  with check (
    bucket_id = 'content-library'
    and auth.role() = 'authenticated'
    and get_my_role() = 'global_admin'::app_role
  );

create policy "content_library: delete global_admin"
  on storage.objects for delete
  using (
    bucket_id = 'content-library'
    and auth.role() = 'authenticated'
    and get_my_role() = 'global_admin'::app_role
  );
