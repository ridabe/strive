'use server'

import { getCtx } from '@/lib/supabase/context'

export interface TrainerNotification {
  id: string
  type: string
  title: string
  message: string
  student_id: string | null
  created_at: string
}

// ─── Listar notificações do tenant ────────────────────────────────────────────
export async function getTrainerNotifications(): Promise<TrainerNotification[]> {
  const ctx = await getCtx()
  if (!ctx) return []
  const { supabase, tenantId } = ctx

  const { data } = await supabase
    .from('trainer_notifications')
    .select('id, type, title, message, student_id, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ─── Excluir notificação (visualizada) ────────────────────────────────────────
export async function dismissTrainerNotification(id: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }
  const { supabase, tenantId } = ctx

  const { error } = await supabase
    .from('trainer_notifications')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  return { success: true }
}
