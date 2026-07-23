'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireGlobalAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'global_admin') return { error: 'Não autorizado' as const }
  return { supabase }
}

// ─── Categorias ─────────────────────────────────────────────────────────────

export async function createContentLibraryCategory(formData: FormData) {
  const ctx = await requireGlobalAdmin()
  if ('error' in ctx) return ctx
  const { supabase } = ctx

  const name = (formData.get('name') as string)?.trim()
  const kind = formData.get('kind') as string
  if (!name) return { error: 'Nome é obrigatório.' }
  if (!['arte', 'material', 'estudo'].includes(kind)) return { error: 'Tipo inválido.' }

  const slug = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const { error } = await supabase.from('content_library_categories').insert({
    name, kind, slug,
    icon: (formData.get('icon') as string | null) || null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Já existe uma categoria com esse nome.' }
    return { error: error.message }
  }

  revalidatePath('/admin/biblioteca/categorias')
  revalidatePath('/admin/biblioteca')
  return { success: true }
}

export async function deleteContentLibraryCategory(id: string) {
  const ctx = await requireGlobalAdmin()
  if ('error' in ctx) return ctx
  const { supabase } = ctx

  const { error } = await supabase.from('content_library_categories').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/biblioteca/categorias')
  revalidatePath('/admin/biblioteca')
  return { success: true }
}

// ─── Itens ──────────────────────────────────────────────────────────────────

function extractItemFields(formData: FormData) {
  const tagsRaw = (formData.get('tags') as string | null) ?? ''
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)

  return {
    category_id: formData.get('category_id') as string,
    title: (formData.get('title') as string)?.trim(),
    description: (formData.get('description') as string | null)?.trim() || null,
    kind: formData.get('kind') as string,
    format: formData.get('format') as string,
    thumbnail_url: (formData.get('thumbnail_url') as string | null) || null,
    canva_template_url: (formData.get('canva_template_url') as string | null)?.trim() || null,
    file_url: (formData.get('file_url') as string | null) || null,
    suggested_caption: (formData.get('suggested_caption') as string | null)?.trim() || null,
    tags,
    min_plan: formData.get('min_plan') as string,
    status: formData.get('status') as string,
  }
}

export async function createContentLibraryItem(formData: FormData) {
  const ctx = await requireGlobalAdmin()
  if ('error' in ctx) return ctx
  const { supabase } = ctx

  const { data: { user } } = await supabase.auth.getUser()
  const fields = extractItemFields(formData)

  if (!fields.title) return { error: 'Título é obrigatório.' }
  if (!fields.category_id) return { error: 'Selecione uma categoria.' }
  if (!fields.canva_template_url && !fields.file_url) {
    return { error: 'Informe um link de template do Canva ou envie um arquivo.' }
  }

  const { data, error } = await supabase
    .from('content_library_items')
    .insert({ ...fields, created_by: user!.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/biblioteca')
  return { id: data.id }
}

export async function updateContentLibraryItem(id: string, formData: FormData) {
  const ctx = await requireGlobalAdmin()
  if ('error' in ctx) return ctx
  const { supabase } = ctx

  const fields = extractItemFields(formData)
  if (!fields.title) return { error: 'Título é obrigatório.' }
  if (!fields.category_id) return { error: 'Selecione uma categoria.' }
  if (!fields.canva_template_url && !fields.file_url) {
    return { error: 'Informe um link de template do Canva ou envie um arquivo.' }
  }

  const { error } = await supabase
    .from('content_library_items')
    .update(fields)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/biblioteca')
  revalidatePath(`/admin/biblioteca/${id}`)
  return { success: true }
}

export async function deleteContentLibraryItem(id: string, storagePaths: string[]) {
  const ctx = await requireGlobalAdmin()
  if ('error' in ctx) return ctx
  const { supabase } = ctx

  const { error } = await supabase.from('content_library_items').delete().eq('id', id)
  if (error) return { error: error.message }

  if (storagePaths.length > 0) {
    const adminSupabase = createAdminClient()
    await adminSupabase.storage.from('content-library').remove(storagePaths)
  }

  revalidatePath('/admin/biblioteca')
  return { success: true }
}

// ─── Consumo pelo personal (leitura) ───────────────────────────────────────

export interface ContentLibraryCategorySummary {
  id: string
  name: string
  kind: string
  sort_order: number
}

export interface ContentLibraryItemSummary {
  id: string
  category_id: string
  title: string
  description: string | null
  kind: string
  format: string
  thumbnail_url: string | null
  canva_template_url: string | null
  file_url: string | null
  suggested_caption: string | null
  tags: string[]
  min_plan: string
  content_library_categories: { name: string } | null
  saved: boolean
}

async function requireAuthenticated() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' as const }
  return { supabase, user }
}

export async function getContentLibraryCategories(): Promise<ContentLibraryCategorySummary[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_library_categories')
    .select('id, name, kind, sort_order')
    .order('kind').order('sort_order')
  return data ?? []
}

export async function getContentLibraryItems(filters?: { kind?: string; categoryId?: string }): Promise<ContentLibraryItemSummary[]> {
  const ctx = await requireAuthenticated()
  if ('error' in ctx) return []
  const { supabase, user } = ctx

  let query = supabase
    .from('content_library_items')
    .select('id, category_id, title, description, kind, format, thumbnail_url, canva_template_url, file_url, suggested_caption, tags, min_plan, content_library_categories(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (filters?.kind) query = query.eq('kind', filters.kind)
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)

  const { data: items } = await query
  if (!items) return []

  const { data: saves } = await supabase
    .from('content_library_item_saves')
    .select('item_id')
    .eq('personal_id', user.id)

  const savedIds = new Set((saves ?? []).map(s => s.item_id))

  return items.map((it): ContentLibraryItemSummary => ({
    id: it.id,
    category_id: it.category_id,
    title: it.title,
    description: it.description,
    kind: it.kind,
    format: it.format,
    thumbnail_url: it.thumbnail_url,
    canva_template_url: it.canva_template_url,
    file_url: it.file_url,
    suggested_caption: it.suggested_caption,
    tags: it.tags,
    min_plan: it.min_plan,
    content_library_categories: Array.isArray(it.content_library_categories)
      ? (it.content_library_categories[0] ?? null)
      : it.content_library_categories,
    saved: savedIds.has(it.id),
  }))
}

export async function trackContentLibraryItemUsage(itemId: string, event: 'canva_open' | 'download') {
  const supabase = await createClient()
  await supabase.rpc('increment_content_library_item_usage', { p_item_id: itemId, p_event: event })
}

export async function toggleContentLibraryItemSave(itemId: string, tenantId: string) {
  const ctx = await requireAuthenticated()
  if ('error' in ctx) return ctx
  const { supabase, user } = ctx

  const { data: existing } = await supabase
    .from('content_library_item_saves')
    .select('id')
    .eq('item_id', itemId)
    .eq('personal_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('content_library_item_saves').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/biblioteca')
    return { success: true, saved: false }
  }

  const { error } = await supabase.from('content_library_item_saves').insert({
    item_id: itemId, tenant_id: tenantId, personal_id: user.id,
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/biblioteca')
  return { success: true, saved: true }
}
