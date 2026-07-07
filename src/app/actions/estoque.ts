'use server'

// Módulo Estoque (Fase 7 da feature Academias) — exclusivo para tenants do tipo
// 'academia'. Uso interno da equipe (sem fluxo do aluno). A restrição por
// tenant_type é garantida pelas RLS policies de inventory_items/inventory_movements
// (ver supabase/migrations) — aqui fazemos apenas uma checagem de conveniência
// para retornar uma mensagem amigável antes de bater na policy.

import { revalidatePath } from 'next/cache'
import { getCtx } from '@/lib/supabase/context'
import { joinOne } from '@/lib/supabase/join'

// Papéis de equipe que podem operar o estoque de uma academia. 'student' e
// qualquer outro papel nunca devem chegar aqui — a RLS bloquearia de qualquer forma.
const ALLOWED_ROLES = ['owner', 'admin', 'personal']

export type InventoryItem = {
  id: string
  name: string
  sku: string | null
  category: string | null
  unit: string
  quantity_on_hand: number
  min_quantity: number
  unit_cost: number | null
  sale_price: number | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type InventoryMovement = {
  id: string
  item_id: string
  type: 'entrada' | 'saida' | 'ajuste'
  quantity: number
  reason: string | null
  created_at: string
  created_by: string | null
  created_by_name: string | null
}

async function requireAcademiaCtx() {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' as const }
  if (!ALLOWED_ROLES.includes(ctx.role)) return { error: 'Não autorizado' as const }

  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('tenant_type')
    .eq('id', ctx.tenantId)
    .single()

  if (tenant?.tenant_type !== 'academia') {
    return { error: 'Módulo de Estoque disponível apenas para academias' as const }
  }

  return { ctx }
}

// ─── Listar itens ──────────────────────────────────────────────────────────
export async function getInventoryItems(includeInactive = false): Promise<InventoryItem[]> {
  const result = await requireAcademiaCtx()
  if ('error' in result) return []
  const { ctx } = result

  let query = ctx.supabase
    .from('inventory_items')
    .select('id, name, sku, category, unit, quantity_on_hand, min_quantity, unit_cost, sale_price, is_active, notes, created_at, updated_at')
    .eq('tenant_id', ctx.tenantId)
    .order('name')

  if (!includeInactive) query = query.eq('is_active', true)

  const { data } = await query
  return (data ?? []) as InventoryItem[]
}

// ─── Criar item ────────────────────────────────────────────────────────────
export async function createInventoryItem(formData: FormData) {
  const result = await requireAcademiaCtx()
  if ('error' in result) return { error: result.error }
  const { ctx } = result

  const name = (formData.get('name') as string | null)?.trim()
  if (!name) return { error: 'Nome é obrigatório' }

  const sku          = (formData.get('sku') as string | null)?.trim() || null
  const category     = (formData.get('category') as string | null)?.trim() || null
  const unit         = (formData.get('unit') as string | null)?.trim() || 'un'
  const minQuantity  = formData.get('min_quantity') ? Number(formData.get('min_quantity')) : 0
  const initialQty   = formData.get('quantity_on_hand') ? Number(formData.get('quantity_on_hand')) : 0
  const unitCost     = formData.get('unit_cost') ? Number(formData.get('unit_cost')) : null
  const salePrice    = formData.get('sale_price') ? Number(formData.get('sale_price')) : null
  const notes        = (formData.get('notes') as string | null)?.trim() || null

  const { data, error } = await ctx.supabase
    .from('inventory_items')
    .insert({
      tenant_id:        ctx.tenantId,
      name,
      sku,
      category,
      unit,
      min_quantity:     minQuantity,
      quantity_on_hand: initialQty,
      unit_cost:        unitCost,
      sale_price:       salePrice,
      notes,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/estoque')
  return { success: true, id: data.id }
}

// ─── Editar item (dados cadastrais — quantidade só muda via movimento) ─────
export async function updateInventoryItem(itemId: string, formData: FormData) {
  const result = await requireAcademiaCtx()
  if ('error' in result) return { error: result.error }
  const { ctx } = result

  const name = (formData.get('name') as string | null)?.trim()
  if (!name) return { error: 'Nome é obrigatório' }

  const sku         = (formData.get('sku') as string | null)?.trim() || null
  const category    = (formData.get('category') as string | null)?.trim() || null
  const unit        = (formData.get('unit') as string | null)?.trim() || 'un'
  const minQuantity = formData.get('min_quantity') ? Number(formData.get('min_quantity')) : 0
  const unitCost    = formData.get('unit_cost') ? Number(formData.get('unit_cost')) : null
  const salePrice   = formData.get('sale_price') ? Number(formData.get('sale_price')) : null
  const notes       = (formData.get('notes') as string | null)?.trim() || null

  const { error } = await ctx.supabase
    .from('inventory_items')
    .update({
      name,
      sku,
      category,
      unit,
      min_quantity: minQuantity,
      unit_cost:    unitCost,
      sale_price:   salePrice,
      notes,
    })
    .eq('id', itemId)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/estoque')
  return { success: true }
}

// ─── Ativar / desativar item (soft delete) ─────────────────────────────────
export async function toggleInventoryItemActive(itemId: string, isActive: boolean) {
  const result = await requireAcademiaCtx()
  if ('error' in result) return { error: result.error }
  const { ctx } = result

  const { error } = await ctx.supabase
    .from('inventory_items')
    .update({ is_active: isActive })
    .eq('id', itemId)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/estoque')
  return { success: true }
}

// ─── Registrar movimento (entrada / saída / ajuste) ────────────────────────
// Delega à RPC register_inventory_movement, que atualiza quantity_on_hand e
// grava o log em inventory_movements atomicamente em uma única transação.
export async function registerInventoryMovement(
  itemId: string,
  type: 'entrada' | 'saida' | 'ajuste',
  quantity: number,
  reason?: string,
) {
  const result = await requireAcademiaCtx()
  if ('error' in result) return { error: result.error }
  const { ctx } = result

  if (!Number.isFinite(quantity) || quantity < 0) {
    return { error: 'Quantidade inválida' }
  }

  const { data, error } = await ctx.supabase.rpc('register_inventory_movement', {
    p_item_id: itemId,
    p_type: type,
    p_quantity: quantity,
    p_reason: reason?.trim() || undefined,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/estoque')
  return { success: true, movement: data }
}

// ─── Histórico de movimentos de um item ────────────────────────────────────
export async function getInventoryMovements(itemId: string): Promise<InventoryMovement[]> {
  const result = await requireAcademiaCtx()
  if ('error' in result) return []
  const { ctx } = result

  const { data } = await ctx.supabase
    .from('inventory_movements')
    .select('id, item_id, type, quantity, reason, created_at, created_by, profiles(full_name)')
    .eq('item_id', itemId)
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })

  if (!data) return []

  return data.map((m) => ({
    id: m.id,
    item_id: m.item_id,
    type: m.type as InventoryMovement['type'],
    quantity: m.quantity,
    reason: m.reason,
    created_at: m.created_at,
    created_by: m.created_by,
    created_by_name: joinOne<{ full_name: string | null }>(m.profiles)?.full_name ?? null,
  }))
}
