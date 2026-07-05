import type { createClient } from './server'
import type { Tables } from '@/types/database'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * Resolve a linha de `students` correspondente ao vínculo ativo do aluno no
 * tenant atual. Um aluno pode ter mais de uma linha ativa (vínculo com mais
 * de um personal simultaneamente) — nesse caso, usa `profiles.tenant_id`
 * pra desempatar. Mesma lógica usada em `(student)/layout.tsx`.
 */
export async function getActiveStudentRow(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Tables<'students'> | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single()

  if (!profile?.tenant_id) return null

  const { data: rows } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  const active = rows ?? []
  if (active.length === 0) return null
  if (active.length === 1) return active[0]

  return active.find((r) => r.tenant_id === profile.tenant_id) ?? null
}
