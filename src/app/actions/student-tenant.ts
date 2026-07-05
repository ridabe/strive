'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Troca o personal/estúdio ativo do aluno logado ────────────────────────────
export async function selectActiveTenant(tenantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Só permite trocar para um tenant onde o aluno realmente tem vínculo ativo —
  // evita que o client force um tenant_id arbitrário.
  const { data: activeRow } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle()

  if (!activeRow) redirect('/student')

  await supabase
    .from('profiles')
    .update({ tenant_id: tenantId })
    .eq('id', user.id)

  redirect('/student')
}
