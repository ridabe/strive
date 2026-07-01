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
  return { supabase, tenantId: profile.tenant_id, role: profile.role as string }
}
