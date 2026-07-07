'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, generateTempPassword } from '@/lib/supabase/admin'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'

// ── Criar academia (tenant tenant_type='academia') + dono + email de boas-vindas
// Espelha createClient_action (src/app/actions/clients.ts), com 2 diferenças:
// tenant_type='academia' desde a criação, e o dono também ganha uma linha em
// tenant_members (role owner) — necessário para o modelo multi-personal e para
// o seletor de organização (Fase 4).
export async function createAcademiaTenant(formData: FormData) {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const businessName          = (formData.get('business_name') as string)?.trim()
  const accessEmail           = (formData.get('access_email') as string)?.trim()
  const fullName              = (formData.get('full_name') as string)?.trim() || businessName
  const contactEmail          = (formData.get('contact_email') as string)?.trim() || null
  const contactPhone          = (formData.get('contact_phone') as string)?.trim() || null
  const plan                  = (formData.get('plan') as 'free' | 'pro' | 'premium') || 'free'
  const primaryColor          = (formData.get('primary_color') as string) || '#E8FF47'
  const maxStudents           = parseInt(formData.get('max_students') as string, 10) || 50
  const maxPersonals          = parseInt(formData.get('max_personals') as string, 10) || 5
  const selfAssignEnabled     = formData.get('self_assign_enabled') === 'on'
  const abacatepayCustomerId  = (formData.get('abacatepay_customer_id') as string)?.trim() || null
  const notes                 = (formData.get('notes') as string)?.trim() || null
  const cnpj                  = (formData.get('cnpj') as string)?.trim() || null

  if (!businessName) redirect('/admin/academias/nova?error=' + encodeURIComponent('Nome da academia é obrigatório.'))
  if (!accessEmail)  redirect('/admin/academias/nova?error=' + encodeURIComponent('E-mail de acesso do dono é obrigatório.'))
  if (!maxPersonals || maxPersonals < 1) redirect('/admin/academias/nova?error=' + encodeURIComponent('Limite de personais deve ser pelo menos 1.'))

  const tempPassword = generateTempPassword()

  // ── 1. Criar usuário do dono (owner) no Supabase Auth ──────────────────
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: accessEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'personal' },
  })

  if (authError || !authData.user) {
    redirect('/admin/academias/nova?error=' + encodeURIComponent(`Erro ao criar usuário: ${authError?.message ?? 'desconhecido'}`))
  }

  const userId = authData.user.id

  // ── 2. Gerar slug e criar tenant (tenant_type='academia') ──────────────
  const { data: slugRow } = await supabase
    .rpc('generate_tenant_slug', { p_name: businessName })

  const { data: tenant, error: tenantError } = await adminSupabase
    .from('tenants')
    .insert({
      business_name: businessName,
      slug: slugRow as string,
      plan,
      status: 'active',
      tenant_type: 'academia',
      max_students: maxStudents,
      max_personals: maxPersonals,
      self_assign_enabled: selfAssignEnabled,
      primary_color: primaryColor,
      contact_email: contactEmail ?? accessEmail,
      contact_phone: contactPhone,
      abacatepay_customer_id: abacatepayCustomerId,
      notes,
      cnpj,
    } as never)
    .select('id, business_name')
    .single()

  if (tenantError || !tenant) {
    await adminSupabase.auth.admin.deleteUser(userId)
    redirect('/admin/academias/nova?error=' + encodeURIComponent(`Erro ao criar tenant: ${tenantError?.message}`))
  }

  // ── 3. Vincular profile do dono ao tenant ───────────────────────────────
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ tenant_id: tenant.id, must_change_password: true })
    .eq('id', userId)

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(userId)
    await adminSupabase.from('tenants').delete().eq('id', tenant.id)
    redirect('/admin/academias/nova?error=' + encodeURIComponent(`Erro ao configurar perfil: ${profileError.message}`))
  }

  // ── 4. Vincular dono em tenant_members (role owner) ─────────────────────
  const { error: memberError } = await adminSupabase
    .from('tenant_members')
    .insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    })

  if (memberError) {
    await adminSupabase.auth.admin.deleteUser(userId)
    await adminSupabase.from('tenants').delete().eq('id', tenant.id)
    redirect('/admin/academias/nova?error=' + encodeURIComponent(`Erro ao vincular dono à equipe: ${memberError.message}`))
  }

  // ── 5. Habilitar todos os módulos disponíveis para a academia ──────────
  // Academia é uma conta institucional: todos os módulos do catálogo
  // (inclusive os exclusivos de academia, como "estoque") devem vir
  // liberados desde a criação — tanto para a organização quanto para os
  // personais que ela adicionar depois (módulos são habilitados por
  // tenant, não por membro). Espelha enableAllModulesForTenant
  // (src/app/actions/modules.ts), sem o filtro de ACADEMIA_ONLY_SLUGS
  // porque este tenant é, por definição, uma academia.
  const { data: allModules } = await adminSupabase
    .from('system_modules')
    .select('id')
    .eq('available', true)

  if (allModules?.length) {
    const moduleRows = allModules.map((m) => ({
      tenant_id: tenant.id,
      module_id: m.id,
      enabled: true,
      enabled_at: new Date().toISOString(),
    }))

    const { error: modulesError } = await adminSupabase
      .from('tenant_modules')
      .upsert(moduleRows, { onConflict: 'tenant_id,module_id' })

    if (modulesError) {
      console.error('[createAcademiaTenant] Falha ao habilitar módulos:', modulesError.message)
    }
  }

  // ── 6. Enviar e-mail de boas-vindas via Edge Function ───────────────────
  const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
    body: {
      email: accessEmail,
      fullName,
      businessName: tenant.business_name,
      tempPassword,
      logoUrl: null,
      primaryColor,
    },
  })

  if (emailError) {
    console.error('[createAcademiaTenant] Falha ao enviar e-mail de boas-vindas:', emailError.message)
  }

  // ── 7. Audit log ─────────────────────────────────────────────────────────
  await logAdminAction({
    action: AuditActions.TENANT_CREATED,
    category: 'tenant',
    description: `Academia "${tenant.business_name}" criada — dono: ${accessEmail} (plano: ${plan}, máx. ${maxPersonals} personais)`,
    targetType: 'tenant',
    targetId: tenant.id,
    metadata: {
      plan,
      maxStudents,
      maxPersonals,
      selfAssignEnabled,
      emailSent: !emailError,
    },
  })

  redirect('/admin/academias')
}

// ── Atualizar plano/limites de uma academia existente ──────────────────────
export async function updateAcademiaTenant(tenantId: string, formData: FormData) {
  const adminSupabase = createAdminClient()

  const businessName          = (formData.get('business_name') as string)?.trim()
  const plan                  = formData.get('plan') as 'free' | 'pro' | 'premium'
  const maxStudents           = parseInt(formData.get('max_students') as string, 10)
  const maxPersonals           = parseInt(formData.get('max_personals') as string, 10)
  const selfAssignEnabled     = formData.get('self_assign_enabled') === 'on'
  const abacatepayCustomerId  = (formData.get('abacatepay_customer_id') as string)?.trim() || null
  const notes                 = (formData.get('notes') as string)?.trim() || null
  const cnpj                  = (formData.get('cnpj') as string)?.trim() || null

  if (!businessName) return { error: 'Nome da academia é obrigatório.' }
  if (!maxPersonals || maxPersonals < 1) return { error: 'Limite de personais deve ser pelo menos 1.' }

  // Não permite reduzir o limite de personais abaixo do número de membros ativos —
  // evita deixar a academia num estado inconsistente (mais gente ativa do que o limite permite).
  const { count: activeCount } = await adminSupabase
    .from('tenant_members')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active')

  if ((activeCount ?? 0) > maxPersonals) {
    return { error: `A academia já tem ${activeCount} personal(is)/admin(s) ativo(s) — não é possível reduzir o limite abaixo disso.` }
  }

  // ── Logos (padrão + tema claro) ────────────────────────────────────────────
  // logo_url é usado sobre fundo escuro; logo_light_url sobre fundo claro (o
  // painel da academia). Bucket compartilhado 'client-logos'.
  const logoUpdates: Record<string, string | null> = {}
  const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'svg', 'webp']

  async function handleLogo(field: string, removeField: string, column: string, fileBase: string): Promise<string | null> {
    if (formData.get(removeField) === '1') {
      await adminSupabase.storage.from('client-logos').remove([`${tenantId}/${fileBase}`])
      logoUpdates[column] = null
      return null
    }
    const file = formData.get(field) as File | null
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) return 'Logo deve ter no máximo 2 MB.'
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
      if (!ALLOWED_EXT.includes(ext)) return 'Formato de imagem não suportado. Use PNG, JPG, SVG ou WebP.'
      const path = `${tenantId}/${fileBase}.${ext}`
      const { error: upErr } = await adminSupabase.storage
        .from('client-logos')
        .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true })
      if (upErr) return `Erro ao subir logo: ${upErr.message}`
      const { data: { publicUrl } } = adminSupabase.storage.from('client-logos').getPublicUrl(path)
      logoUpdates[column] = `${publicUrl}?v=${Date.now()}`
    }
    return null
  }

  const logoErr = await handleLogo('logo', 'remove_logo', 'logo_url', 'logo')
  if (logoErr) return { error: logoErr }
  const logoLightErr = await handleLogo('logo_light', 'remove_logo_light', 'logo_light_url', 'logo-light')
  if (logoLightErr) return { error: logoLightErr }

  const { error } = await adminSupabase
    .from('tenants')
    .update({
      business_name: businessName,
      plan,
      max_students: maxStudents,
      max_personals: maxPersonals,
      self_assign_enabled: selfAssignEnabled,
      abacatepay_customer_id: abacatepayCustomerId,
      notes,
      cnpj,
      ...logoUpdates,
    } as never)
    .eq('id', tenantId)
    .eq('tenant_type', 'academia')

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.TENANT_UPDATED,
    category: 'tenant',
    description: `Academia "${businessName}" atualizada (plano: ${plan}, máx. ${maxPersonals} personais)`,
    targetType: 'tenant',
    targetId: tenantId,
    metadata: { plan, maxStudents, maxPersonals, selfAssignEnabled },
  })

  redirect(`/admin/academias/${tenantId}`)
}

// ── Reenviar e-mail de boas-vindas para o OWNER de uma academia ─────────────
// Não reaproveita resendWelcomeEmail (clients.ts) porque aquela função resolve
// o destinatário via `profiles.tenant_id + role='personal'` com `.single()` —
// correto para tenant autônomo (1 personal por tenant), mas ambíguo/quebrado
// para uma academia, onde vários profiles com role='personal' podem
// compartilhar o mesmo tenant_id (o papel real de cada um vive em
// tenant_members, não em profiles.role). Aqui resolvemos o destinatário via
// tenant_members (role='owner'), que é sempre único por tenant.
export async function resendAcademiaOwnerEmail(tenantId: string) {
  const adminSupabase = createAdminClient()
  const supabase      = await createClient()

  const { data: tenant } = await adminSupabase
    .from('tenants')
    .select('business_name, primary_color, logo_url')
    .eq('id', tenantId)
    .eq('tenant_type', 'academia')
    .single()

  const { data: ownerMember } = await adminSupabase
    .from('tenant_members')
    .select('user_id, profiles(id, email, full_name)')
    .eq('tenant_id', tenantId)
    .eq('role', 'owner')
    .maybeSingle()

  const ownerProfile = ownerMember
    ? (Array.isArray(ownerMember.profiles) ? ownerMember.profiles[0] : ownerMember.profiles)
    : null

  if (!tenant || !ownerProfile) return { error: 'Academia ou owner não encontrado.' }

  const tempPassword = generateTempPassword()

  const { error: pwError } = await adminSupabase.auth.admin.updateUserById(ownerProfile.id, {
    password: tempPassword,
  })

  if (pwError) return { error: `Erro ao resetar senha: ${pwError.message}` }

  await adminSupabase
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', ownerProfile.id)

  const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
    body: {
      email: ownerProfile.email,
      fullName: ownerProfile.full_name ?? tenant.business_name,
      businessName: tenant.business_name,
      tempPassword,
      logoUrl: tenant.logo_url,
      primaryColor: tenant.primary_color,
    },
  })

  if (emailError) {
    console.error('[resendAcademiaOwnerEmail] Falha ao enviar e-mail:', emailError.message)
  }

  await logAdminAction({
    action: 'TENANT_EMAIL_RESENT',
    category: 'tenant',
    description: `E-mail de boas-vindas reenviado para o owner de "${tenant.business_name}"`,
    targetType: 'tenant',
    targetId: tenantId,
  })

  return { success: true }
}
