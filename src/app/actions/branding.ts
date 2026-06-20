'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Salvar branding do tenant (logo + cor primária) ─────────────────────────
export async function saveBranding(formData: FormData) {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role !== 'personal') {
    return { error: 'Sem permissão.' }
  }

  const tenantId    = profile.tenant_id
  const primaryColor = (formData.get('primary_color') as string | null) ?? null
  const logoFile     = formData.get('logo') as File | null
  const removeLogo   = formData.get('remove_logo') === '1'

  const updates: { primary_color?: string | null; logo_url?: string | null } = {}

  // ── Cor primária ─────────────────────────────────────────────────────────
  if (primaryColor) {
    // Validação básica de hex
    if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      return { error: 'Cor inválida. Use formato hex #RRGGBB.' }
    }
    updates.primary_color = primaryColor
  }

  // ── Logo ─────────────────────────────────────────────────────────────────
  if (removeLogo) {
    // Remove do Storage e limpa a URL
    await adminSupabase.storage
      .from('client-logos')
      .remove([`${tenantId}/logo`])
    updates.logo_url = null
  } else if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: 'Logo deve ter no máximo 2 MB.' }
    }

    const ext  = logoFile.name.split('.').pop()?.toLowerCase() ?? 'png'
    const allowed = ['png', 'jpg', 'jpeg', 'svg', 'webp']
    if (!allowed.includes(ext)) {
      return { error: 'Formato de imagem não suportado. Use PNG, JPG, SVG ou WebP.' }
    }

    const path = `${tenantId}/logo.${ext}`

    const { error: uploadError } = await adminSupabase.storage
      .from('client-logos')
      .upload(path, await logoFile.arrayBuffer(), {
        contentType: logoFile.type,
        upsert: true,
      })

    if (uploadError) {
      return { error: `Erro ao fazer upload: ${uploadError.message}` }
    }

    const { data: { publicUrl } } = adminSupabase.storage
      .from('client-logos')
      .getPublicUrl(path)

    // Cache-bust para forçar recarregamento da imagem no browser
    updates.logo_url = `${publicUrl}?v=${Date.now()}`
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Nenhuma alteração enviada.' }
  }

  const { error: updateError } = await adminSupabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard', 'layout')
  return { success: true, logoUrl: updates.logo_url }
}
