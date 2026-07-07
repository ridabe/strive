'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Troca a organização ativa do personal logado ──────────────────────────
// Espelha selectActiveTenant (student-tenant.ts): só permite trocar para um
// tenant onde o personal realmente tem vínculo ativo em tenant_members —
// evita que o client force um tenant_id arbitrário.
export async function selectActiveOrg(tenantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activeRow } = await supabase
    .from('tenant_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle()

  if (!activeRow) redirect('/dashboard')

  await supabase
    .from('profiles')
    .update({ tenant_id: tenantId })
    .eq('id', user.id)

  redirect('/dashboard')
}
