-- Módulo "Biblioteca de Conteúdo" — Fase 0 (fundação).
-- Catálogo central de artes prontas, materiais de apoio e estudos, mantido
-- exclusivamente pelo admin global. Consumo pelo personal via link de
-- template do Canva (canva_template_url) e/ou download direto (file_url).
-- Ver docs/modulos/biblioteca-conteudo-planejamento.md para o plano completo.

create table if not exists public.content_library_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null check (kind in ('arte', 'material', 'estudo')),
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_library_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.content_library_categories(id) on delete cascade,
  title text not null,
  description text,
  kind text not null check (kind in ('arte', 'material', 'estudo')),
  format text not null check (format in (
    'instagram_post', 'instagram_story', 'tiktok', 'pdf', 'planilha', 'infografico', 'outro'
  )),
  thumbnail_url text,
  canva_template_url text,
  file_url text,
  suggested_caption text,
  tags text[] not null default '{}',
  min_plan public.tenant_plan not null default 'free',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_library_items_has_link check (
    canva_template_url is not null or file_url is not null
  )
);

create index if not exists content_library_items_category_id_idx on public.content_library_items (category_id);
create index if not exists content_library_items_status_idx on public.content_library_items (status);
create index if not exists content_library_items_tags_idx on public.content_library_items using gin (tags);

create table if not exists public.content_library_item_saves (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.content_library_items(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  personal_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (item_id, personal_id)
);

alter table public.content_library_categories enable row level security;
alter table public.content_library_items enable row level security;
alter table public.content_library_item_saves enable row level security;

-- Categorias: leitura para qualquer usuário autenticado, escrita só global_admin.
create policy "content_library_categories: leitura autenticada"
  on public.content_library_categories for select
  to authenticated
  using (true);

create policy "content_library_categories: escrita global_admin"
  on public.content_library_categories for all
  to authenticated
  using (public.get_my_role() = 'global_admin'::public.app_role)
  with check (public.get_my_role() = 'global_admin'::public.app_role);

-- Itens: global_admin vê tudo (inclusive rascunho); demais usuários autenticados
-- só veem itens publicados (o gate de módulo/plano é aplicado na aplicação).
create policy "content_library_items: leitura published ou global_admin"
  on public.content_library_items for select
  to authenticated
  using (
    status = 'published' or public.get_my_role() = 'global_admin'::public.app_role
  );

create policy "content_library_items: escrita global_admin"
  on public.content_library_items for insert
  to authenticated
  with check (public.get_my_role() = 'global_admin'::public.app_role);

create policy "content_library_items: update global_admin"
  on public.content_library_items for update
  to authenticated
  using (public.get_my_role() = 'global_admin'::public.app_role)
  with check (public.get_my_role() = 'global_admin'::public.app_role);

create policy "content_library_items: delete global_admin"
  on public.content_library_items for delete
  to authenticated
  using (public.get_my_role() = 'global_admin'::public.app_role);

-- Salvos: cada personal só vê/gerencia os próprios.
create policy "content_library_item_saves: próprio personal"
  on public.content_library_item_saves for all
  to authenticated
  using (personal_id = auth.uid())
  with check (personal_id = auth.uid());

-- Registro do módulo no catálogo (fica desativado/"coming_soon" até o
-- catálogo ter pelo menos 5 itens publicados por categoria — critério
-- definido no planejamento).
insert into public.system_modules (name, slug, description, category, icon, status, available, sort_order)
values (
  'Biblioteca de Conteúdo',
  'biblioteca_conteudo',
  'Catálogo de artes prontas para redes sociais, materiais de apoio e estudos, editáveis no Canva do próprio personal.',
  'futuro',
  'images-outline',
  'coming_soon',
  false,
  140
)
on conflict (slug) do nothing;
