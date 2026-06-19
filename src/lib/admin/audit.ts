import { createClient } from '@/lib/supabase/server'
import type { audit_category } from '@/types/database'

export interface AuditLogEntry {
  action: string
  category: audit_category
  description: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Registra uma ação do admin global no log de auditoria.
 * Deve ser chamada a partir de Server Actions ou Route Handlers.
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: entry.action,
      category: entry.category,
      description: entry.description,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? null,
      ip_address: entry.ipAddress ?? null,
    })
  } catch {
    // Log não deve quebrar o fluxo principal
    console.error('[audit] Falha ao registrar log de auditoria')
  }
}

// ── Ações pré-definidas ──────────────────────────────────────────

export const AuditActions = {
  // Auth
  LOGIN:          'LOGIN',
  LOGOUT:         'LOGOUT',

  // Tenants
  TENANT_CREATED:   'TENANT_CREATED',
  TENANT_UPDATED:   'TENANT_UPDATED',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  TENANT_ACTIVATED: 'TENANT_ACTIVATED',
  TENANT_DELETED:   'TENANT_DELETED',
  TENANT_PLAN_CHANGED: 'TENANT_PLAN_CHANGED',

  // Clientes
  CLIENT_CREATED: 'CLIENT_CREATED',

  // Usuários
  USER_ROLE_CHANGED:    'USER_ROLE_CHANGED',
  USER_SUSPENDED:       'USER_SUSPENDED',
  USER_ACTIVATED:       'USER_ACTIVATED',
  USER_DELETED:         'USER_DELETED',
  PASSWORD_RESET:       'PASSWORD_RESET',
  USER_PASSWORD_RESET:  'USER_PASSWORD_RESET',

  // Sistema
  SYSTEM_CONFIG_UPDATED: 'SYSTEM_CONFIG_UPDATED',
} as const
