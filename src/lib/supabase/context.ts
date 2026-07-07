import { createClient } from './server'

export async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return null

  // Papel efetivo dentro do tenant ativo. Para personal, quando o tenant ativo é
  // uma academia, o papel real (owner/admin/personal) vem do vínculo em
  // tenant_members — a mesma pessoa pode ser admin numa academia e personal em
  // outra, então profiles.role sozinho não distingue isso. Para tenant autônomo
  // (comportamento de hoje, 100% dos tenants em produção), profiles.role
  // continua sendo a fonte da verdade — nenhuma mudança de comportamento.
  let role: string = profile.role as string

  if (role === 'personal') {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('tenant_type')
      .eq('id', profile.tenant_id)
      .single()

    if (tenant?.tenant_type === 'academia') {
      const { data: membership } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', profile.tenant_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (membership?.role) role = membership.role
    }
  }

  return { supabase, tenantId: profile.tenant_id, role }
}
