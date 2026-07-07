'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'

type ModuleCategory = 'treinos' | 'acompanhamento' | 'financeiro' | 'comunicacao' | 'whitelabel' | 'futuro'
type ModuleStatus   = 'active' | 'beta' | 'coming_soon'

// Módulos que só fazem sentido (e só têm RLS permitindo) para tenants tipo 'academia'
const ACADEMIA_ONLY_SLUGS = ['estoque']

// ── Criar módulo no catálogo ──────────────────────────────────────
export async function createModule(formData: FormData) {
  const admin = createAdminClient()

  const name        = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const category    = formData.get('category') as ModuleCategory
  const status      = (formData.get('status') as ModuleStatus) || 'active'
  const icon        = (formData.get('icon') as string)?.trim() || null

  if (!name || !category) return { error: 'Nome e categoria são obrigatórios.' }

  // gera slug a partir do nome
  const slug = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')

  // verifica slug único
  const { data: existing } = await admin
    .from('system_modules').select('id').eq('slug', slug).maybeSingle()
  if (existing) return { error: 'Já existe um módulo com nome similar.' }

  const { data: mod, error } = await admin
    .from('system_modules')
    .insert({ name, slug, description, category, status, icon, available: status !== 'coming_soon' })
    .select('id, name')
    .single()

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.SYSTEM_CONFIG_UPDATED,
    category: 'system',
    description: `Módulo "${name}" criado no catálogo`,
    targetType: 'system_module',
    targetId: mod.id,
    metadata: { slug, status, category },
  })

  revalidatePath('/admin/modulos')
  return { success: true, id: mod.id }
}

// ── Atualizar módulo no catálogo ──────────────────────────────────
export async function updateModule(moduleId: string, formData: FormData) {
  const admin = createAdminClient()

  const name        = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const category    = formData.get('category') as ModuleCategory
  const status      = formData.get('status') as ModuleStatus
  const icon        = (formData.get('icon') as string)?.trim() || null

  if (!name || !category) return { error: 'Nome e categoria são obrigatórios.' }

  const { error } = await admin
    .from('system_modules')
    .update({ name, description, category, status, icon })
    .eq('id', moduleId)

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.SYSTEM_CONFIG_UPDATED,
    category: 'system',
    description: `Módulo "${name}" atualizado`,
    targetType: 'system_module',
    targetId: moduleId,
  })

  revalidatePath('/admin/modulos')
  return { success: true }
}

// ── Alternar disponibilidade global do módulo ─────────────────────
export async function toggleModuleAvailability(moduleId: string, available: boolean) {
  const admin = createAdminClient()

  const { data: mod } = await admin
    .from('system_modules').select('name').eq('id', moduleId).single()

  const { error } = await admin
    .from('system_modules')
    .update({ available })
    .eq('id', moduleId)

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.SYSTEM_CONFIG_UPDATED,
    category: 'system',
    description: `Módulo "${mod?.name}" ${available ? 'disponibilizado' : 'desativado'} globalmente`,
    targetType: 'system_module',
    targetId: moduleId,
    metadata: { available },
  })

  revalidatePath('/admin/modulos')
  return { success: true }
}

// ── Habilitar / desabilitar módulo para um tenant ─────────────────
export async function toggleTenantModule(tenantId: string, moduleId: string, enabled: boolean) {
  const admin = createAdminClient()

  // Defesa em profundidade: nunca habilitar um módulo exclusivo de academia
  // para um tenant autônomo, mesmo que a chamada não venha da UI (que já
  // desabilita o toggle nesse caso).
  if (enabled) {
    const { data: mod } = await admin.from('system_modules').select('slug').eq('id', moduleId).single()
    if (mod && ACADEMIA_ONLY_SLUGS.includes(mod.slug)) {
      const { data: tenant } = await admin.from('tenants').select('tenant_type').eq('id', tenantId).single()
      if (tenant?.tenant_type !== 'academia') {
        return { error: 'Este módulo está disponível apenas para tenants do tipo academia.' }
      }
    }
  }

  // upsert — cria o registro se não existir
  const { error } = await admin
    .from('tenant_modules')
    .upsert(
      { tenant_id: tenantId, module_id: moduleId, enabled, enabled_at: new Date().toISOString() },
      { onConflict: 'tenant_id,module_id' }
    )

  if (error) return { error: error.message }

  const { data: mod }    = await admin.from('system_modules').select('name').eq('id', moduleId).single()
  const { data: tenant } = await admin.from('tenants').select('business_name').eq('id', tenantId).single()

  await logAdminAction({
    action: AuditActions.SYSTEM_CONFIG_UPDATED,
    category: 'system',
    description: `Módulo "${mod?.name}" ${enabled ? 'habilitado' : 'desabilitado'} para "${tenant?.business_name}"`,
    targetType: 'tenant',
    targetId: tenantId,
    metadata: { moduleId, enabled },
  })

  revalidatePath(`/admin/clientes/${tenantId}/modulos`)
  return { success: true }
}

// ── Habilitar todos os módulos disponíveis para um tenant ─────────
export async function enableAllModulesForTenant(tenantId: string) {
  const admin = createAdminClient()

  const { data: tenant } = await admin
    .from('tenants')
    .select('tenant_type, business_name')
    .eq('id', tenantId)
    .single()

  const { data: allModules } = await admin
    .from('system_modules')
    .select('id, slug')
    .eq('available', true)

  // Módulos exclusivos de academia nunca são habilitados em massa para
  // tenants autônomos — a RLS já bloqueia o acesso real, mas evita poluir
  // tenant_modules com um estado que nunca terá efeito.
  const modules = tenant?.tenant_type === 'academia'
    ? allModules
    : allModules?.filter((m) => !ACADEMIA_ONLY_SLUGS.includes(m.slug))

  if (!modules?.length) return { error: 'Nenhum módulo disponível.' }

  const rows = modules.map((m) => ({
    tenant_id: tenantId,
    module_id: m.id,
    enabled: true,
    enabled_at: new Date().toISOString(),
  }))

  const { error } = await admin
    .from('tenant_modules')
    .upsert(rows, { onConflict: 'tenant_id,module_id' })

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.SYSTEM_CONFIG_UPDATED,
    category: 'system',
    description: `Todos os módulos habilitados para "${tenant?.business_name}"`,
    targetType: 'tenant',
    targetId: tenantId,
    metadata: { count: modules.length },
  })

  revalidatePath(`/admin/clientes/${tenantId}/modulos`)
  return { success: true }
}

// ── Desabilitar todos os módulos de um tenant ─────────────────────
export async function disableAllModulesForTenant(tenantId: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('tenant_modules')
    .update({ enabled: false })
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  const { data: tenant } = await admin.from('tenants').select('business_name').eq('id', tenantId).single()

  await logAdminAction({
    action: AuditActions.SYSTEM_CONFIG_UPDATED,
    category: 'system',
    description: `Todos os módulos desabilitados para "${tenant?.business_name}"`,
    targetType: 'tenant',
    targetId: tenantId,
  })

  revalidatePath(`/admin/clientes/${tenantId}/modulos`)
  return { success: true }
}
