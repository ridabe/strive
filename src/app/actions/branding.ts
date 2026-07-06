'use server'

import { revalidatePath } from 'next/cache'
import { getCtx } from '@/lib/supabase/context'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Salvar branding do tenant (logo + cor primária) ─────────────────────────
export async function saveBranding(formData: FormData) {
  const ctx = await getCtx()
  if (!ctx || ctx.role !== 'personal') return { error: 'Sem permissão.' }
  const { tenantId } = ctx
  const adminSupabase = createAdminClient()
  const primaryColor    = (formData.get('primary_color') as string | null) ?? null
  const accentTextColor = (formData.get('accent_text_color') as string | null) ?? null
  const onPrimaryTextColor = (formData.get('on_primary_text_color') as string | null) ?? null
  const logoFile     = formData.get('logo') as File | null
  const removeLogo   = formData.get('remove_logo') === '1'

  const updates: { primary_color?: string | null; accent_text_color?: string | null; on_primary_text_color?: string | null; logo_url?: string | null } = {}

  // ── Cor primária ─────────────────────────────────────────────────────────
  if (primaryColor) {
    // Validação básica de hex
    if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      return { error: 'Cor inválida. Use formato hex #RRGGBB.' }
    }
    updates.primary_color = primaryColor
  }

  // ── Cor da fonte de destaque ─────────────────────────────────────────────
  if (accentTextColor) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(accentTextColor)) {
      return { error: 'Cor da fonte inválida. Use formato hex #RRGGBB.' }
    }
    updates.accent_text_color = accentTextColor
  }

  // ── Cor do texto sobre a cor primária (auto ou override manual) ──────────
  if (onPrimaryTextColor) {
    if (onPrimaryTextColor === 'auto') {
      updates.on_primary_text_color = null
    } else if (/^#[0-9A-Fa-f]{6}$/.test(onPrimaryTextColor)) {
      updates.on_primary_text_color = onPrimaryTextColor
    } else {
      return { error: 'Valor inválido para cor do texto sobre a cor primária.' }
    }
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
