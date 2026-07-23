-- O bucket 'challenge-covers' foi criado em 20260703_challenge_cover_image.sql
-- mas nunca recebeu policies de storage.objects — por isso todo upload falhava
-- com "new row violates row-level security policy" (nenhuma policy = deny by
-- default). Segue o mesmo padrão de path usado no upload (`${tenant_id}/${challenge_id}.ext`)
-- e o mesmo padrão de policy já usado em progress-photos (escopo por tenant via
-- storage.foldername).

create policy "challenge_covers: leitura pública"
  on storage.objects for select
  using (bucket_id = 'challenge-covers');

create policy "challenge_covers: upload do próprio tenant"
  on storage.objects for insert
  with check (
    bucket_id = 'challenge-covers'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.tenant_id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "challenge_covers: update do próprio tenant"
  on storage.objects for update
  using (
    bucket_id = 'challenge-covers'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.tenant_id::text = (storage.foldername(objects.name))[1]
    )
  )
  with check (
    bucket_id = 'challenge-covers'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.tenant_id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "challenge_covers: delete do próprio tenant"
  on storage.objects for delete
  using (
    bucket_id = 'challenge-covers'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.tenant_id::text = (storage.foldername(objects.name))[1]
    )
  );
