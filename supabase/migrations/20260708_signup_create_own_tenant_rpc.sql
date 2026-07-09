-- Corrige bug: signUpPersonal fazia insert direto em public.tenants, mas a
-- tabela nao tem policy de RLS de INSERT para usuarios comuns (so global_admin).
-- O insert sempre falhava silenciosamente para cadastros feitos pelo site,
-- deixando o profile criado (role='personal') porem sem tenant_id, sem
-- tenant_members e sem aparecer na area de Clientes.
--
-- Esta funcao SECURITY DEFINER cria o tenant + vincula profile + tenant_members
-- atomicamente, chamada via RPC pelo signUpPersonal em vez do insert direto.
create or replace function public.create_own_tenant(
  p_business_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_role public.app_role;
  v_existing_tenant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select role, tenant_id into v_role, v_existing_tenant_id
  from public.profiles
  where id = auth.uid();

  if v_role is distinct from 'personal' then
    raise exception 'only personal accounts can create a tenant';
  end if;

  if v_existing_tenant_id is not null then
    raise exception 'profile already has a tenant';
  end if;

  insert into public.tenants (business_name, slug, plan, max_students, tenant_type, status)
  values (p_business_name, p_slug, 'free', 5, 'autonomo', 'active')
  returning id into v_tenant_id;

  update public.profiles
  set tenant_id = v_tenant_id
  where id = auth.uid();

  insert into public.tenant_members (tenant_id, user_id, role, status, joined_at)
  values (v_tenant_id, auth.uid(), 'owner', 'active', now());

  return v_tenant_id;
end;
$$;

grant execute on function public.create_own_tenant(text, text) to authenticated;
