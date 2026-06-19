'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, generateTempPassword } from '@/lib/supabase/admin'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'

// ── Criar cliente (tenant) + usuário personal + email de boas-vindas ──────────
export async function createClient_action(formData: FormData) {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const businessName  = (formData.get('business_name') as string)?.trim()
  const accessEmail   = (formData.get('access_email') as string)?.trim()
  const fullName      = (formData.get('full_name') as string)?.trim() || businessName
  const contactEmail  = (formData.get('contact_email') as string)?.trim() || null
  const contactPhone  = (formData.get('contact_phone') as string)?.trim() || null
  const plan          = (formData.get('plan') as 'free' | 'pro' | 'premium') || 'free'
  const primaryColor  = (formData.get('primary_color') as string) || '#E8FF47'
  const notes         = (formData.get('notes') as string)?.trim() || null
  const logoFile      = formData.get('logo') as File | null

  if (!businessName) redirect('/admin/clientes/novo?error=' + encodeURIComponent('Nome do negócio é obrigatório.'))
  if (!accessEmail)  redirect('/admin/clientes/novo?error=' + encodeURIComponent('E-mail de acesso é obrigatório.'))

  // Busca max_students da tabela plans (fonte de verdade)
  const { data: planRow } = await supabase
    .from('plans')
    .select('max_students')
    .eq('slug', plan)
    .single()
  const maxStudents = planRow?.max_students ?? (plan === 'premium' ? 9999 : plan === 'pro' ? 30 : 5)
  const tempPassword = generateTempPassword()

  // ── 1. Criar usuário no Supabase Auth (service role) ──────────────────
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: accessEmail,
    password: tempPassword,
    email_confirm: true, // confirma e-mail automaticamente
    user_metadata: {
      full_name: fullName,
      role: 'personal',
    },
  })

  if (authError || !authData.user) {
    redirect('/admin/clientes/novo?error=' + encodeURIComponent(`Erro ao criar usuário: ${authError?.message ?? 'desconhecido'}`))
  }

  const userId = authData.user.id

  // ── 2. Gerar slug e criar tenant ───────────────────────────────────────
  const { data: slugRow } = await supabase
    .rpc('generate_tenant_slug', { p_name: businessName })

  const { data: tenant, error: tenantError } = await adminSupabase
    .from('tenants')
    .insert({
      business_name: businessName,
      slug: slugRow as string,
      plan,
      status: 'active',
      max_students: maxStudents,
      primary_color: primaryColor,
      contact_email: contactEmail ?? accessEmail,
      contact_phone: contactPhone,
      notes,
    })
    .select('id, business_name')
    .single()

  if (tenantError || !tenant) {
    await adminSupabase.auth.admin.deleteUser(userId)
    redirect('/admin/clientes/novo?error=' + encodeURIComponent(`Erro ao criar tenant: ${tenantError?.message}`))
  }

  // ── 3. Atualizar profile: vincular tenant + marcar must_change_password ──
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({
      tenant_id: tenant.id,
      must_change_password: true,
    })
    .eq('id', userId)

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(userId)
    await adminSupabase.from('tenants').delete().eq('id', tenant.id)
    redirect('/admin/clientes/novo?error=' + encodeURIComponent(`Erro ao configurar perfil: ${profileError.message}`))
  }

  // ── 4. Upload do logo ──────────────────────────────────────────────────
  let logoUrl: string | null = null

  if (logoFile && logoFile.size > 0) {
    const ext  = logoFile.name.split('.').pop() ?? 'png'
    const path = `${tenant.id}/logo.${ext}`

    const { error: uploadError } = await adminSupabase.storage
      .from('client-logos')
      .upload(path, await logoFile.arrayBuffer(), {
        contentType: logoFile.type,
        upsert: true,
      })

    if (!uploadError) {
      const { data: { publicUrl } } = adminSupabase.storage
        .from('client-logos')
        .getPublicUrl(path)
      logoUrl = publicUrl

      await adminSupabase
        .from('tenants')
        .update({ logo_url: logoUrl })
        .eq('id', tenant.id)
    } else {
      console.error('[createClient] Logo upload falhou:', uploadError.message)
    }
  }

  // ── 5. Enviar e-mail de boas-vindas via Edge Function ─────────────────
  const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
    body: {
      email: accessEmail,
      fullName,
      businessName: tenant.business_name,
      tempPassword,
      logoUrl,
      primaryColor,
    },
  })

  if (emailError) {
    // Não bloqueia o fluxo — loga o erro mas continua
    console.error('[createClient] Falha ao enviar e-mail de boas-vindas:', emailError.message)
  }

  // ── 6. Audit log ───────────────────────────────────────────────────────
  await logAdminAction({
    action: AuditActions.TENANT_CREATED,
    category: 'tenant',
    description: `Cliente "${tenant.business_name}" criado — acesso: ${accessEmail} (plano: ${plan})`,
    targetType: 'tenant',
    targetId: tenant.id,
    metadata: {
      plan,
      slug: slugRow,
      hasLogo: !!logoUrl,
      emailSent: !emailError,
    },
  })

  redirect('/admin/clientes')
}

// ── Suspender cliente ────────────────────────────────────────────
export async function suspendClient(tenantId: string) {
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants').select('business_name').eq('id', tenantId).single()

  const { error } = await supabase
    .from('tenants').update({ status: 'suspended' }).eq('id', tenantId)

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.TENANT_SUSPENDED,
    category: 'tenant',
    description: `Cliente "${tenant?.business_name}" suspenso`,
    targetType: 'tenant',
    targetId: tenantId,
  })

  return { success: true }
}

// ── Reativar cliente ─────────────────────────────────────────────
export async function activateClient(tenantId: string) {
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants').select('business_name').eq('id', tenantId).single()

  const { error } = await supabase
    .from('tenants').update({ status: 'active' }).eq('id', tenantId)

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.TENANT_ACTIVATED,
    category: 'tenant',
    description: `Cliente "${tenant?.business_name}" reativado`,
    targetType: 'tenant',
    targetId: tenantId,
  })

  return { success: true }
}

// ── Atualizar dados do cliente ────────────────────────────────────
export async function updateClient(tenantId: string, formData: FormData) {
  const adminSupabase = createAdminClient()
  const supabase      = await createClient()

  const businessName = (formData.get('business_name') as string)?.trim()
  const fullName     = (formData.get('full_name') as string)?.trim()
  const contactEmail = (formData.get('contact_email') as string)?.trim() || null
  const contactPhone = (formData.get('contact_phone') as string)?.trim() || null
  const plan         = formData.get('plan') as 'free' | 'pro' | 'premium'
  const primaryColor = formData.get('primary_color') as string
  const notes        = (formData.get('notes') as string)?.trim() || null
  const logoFile     = formData.get('logo') as File | null

  if (!businessName) return { error: 'Nome do negócio é obrigatório.' }

  // Busca max_students da tabela plans (fonte de verdade)
  const { data: planRow2 } = await supabase
    .from('plans')
    .select('max_students')
    .eq('slug', plan)
    .single()
  const maxStudents = planRow2?.max_students ?? (plan === 'premium' ? 9999 : plan === 'pro' ? 30 : 5)

  // Busca tenant atual
  const { data: current } = await adminSupabase
    .from('tenants').select('business_name, logo_url').eq('id', tenantId).single()

  // Upload de novo logo (se enviado)
  let logoUrl = current?.logo_url ?? null

  if (logoFile && logoFile.size > 0) {
    const ext  = logoFile.name.split('.').pop() ?? 'png'
    const path = `${tenantId}/logo.${ext}`

    const { error: uploadError } = await adminSupabase.storage
      .from('client-logos')
      .upload(path, await logoFile.arrayBuffer(), { contentType: logoFile.type, upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = adminSupabase.storage
        .from('client-logos').getPublicUrl(path)
      logoUrl = publicUrl
    }
  }

  // Atualiza tenant
  const { error: tenantError } = await adminSupabase
    .from('tenants')
    .update({
      business_name: businessName,
      plan,
      primary_color: primaryColor,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      notes,
      max_students: maxStudents,
      logo_url: logoUrl,
    })
    .eq('id', tenantId)

  if (tenantError) return { error: tenantError.message }

  // Atualiza full_name do perfil do personal vinculado
  if (fullName) {
    const { data: profile } = await adminSupabase
      .from('profiles').select('id').eq('tenant_id', tenantId).eq('role', 'personal').single()

    if (profile) {
      await adminSupabase
        .from('profiles').update({ full_name: fullName }).eq('id', profile.id)
    }
  }

  await logAdminAction({
    action: AuditActions.TENANT_UPDATED,
    category: 'tenant',
    description: `Cliente "${businessName}" atualizado`,
    targetType: 'tenant',
    targetId: tenantId,
    metadata: { plan, hasNewLogo: !!(logoFile && logoFile.size > 0) },
  })

  redirect(`/admin/clientes/${tenantId}`)
}

// ── Deletar cliente ───────────────────────────────────────────────
export async function deleteClient(tenantId: string) {
  const adminSupabase = createAdminClient()

  // Busca todos os usuários do tenant
  const { data: profiles } = await adminSupabase
    .from('profiles').select('id, email, business_name:tenant_id').eq('tenant_id', tenantId)

  const tenantName = (await adminSupabase
    .from('tenants').select('business_name').eq('id', tenantId).single()).data?.business_name

  // Deleta usuários do Auth
  if (profiles?.length) {
    for (const p of profiles) {
      await adminSupabase.auth.admin.deleteUser(p.id)
    }
  }

  // Remove logo do storage
  const { data: files } = await adminSupabase.storage
    .from('client-logos').list(tenantId)

  if (files?.length) {
    const paths = files.map((f) => `${tenantId}/${f.name}`)
    await adminSupabase.storage.from('client-logos').remove(paths)
  }

  // Deleta tenant (cascata via FK deleta profiles, students, etc.)
  const { error } = await adminSupabase.from('tenants').delete().eq('id', tenantId)

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.TENANT_DELETED,
    category: 'tenant',
    description: `Cliente "${tenantName}" removido permanentemente`,
    targetType: 'tenant',
    targetId: tenantId,
    metadata: { usersRemoved: profiles?.length ?? 0 },
  })

  redirect('/admin/clientes')
}

// ── Reenviar e-mail de boas-vindas com nova senha temporária ──────
export async function resendWelcomeEmail(tenantId: string) {
  const adminSupabase = createAdminClient()
  const supabase      = await createClient()

  // Busca dados do tenant e personal
  const { data: tenant } = await adminSupabase
    .from('tenants')
    .select('business_name, primary_color, logo_url')
    .eq('id', tenantId)
    .single()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('tenant_id', tenantId)
    .eq('role', 'personal')
    .single()

  if (!tenant || !profile) return { error: 'Cliente não encontrado.' }

  const tempPassword = generateTempPassword()

  // Reseta senha
  const { error: pwError } = await adminSupabase.auth.admin.updateUserById(profile.id, {
    password: tempPassword,
  })

  if (pwError) return { error: `Erro ao resetar senha: ${pwError.message}` }

  // Marca must_change_password = true
  await adminSupabase
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', profile.id)

  // Reenvia e-mail
  const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
    body: {
      email: profile.email,
      fullName: profile.full_name ?? tenant.business_name,
      businessName: tenant.business_name,
      tempPassword,
      logoUrl: tenant.logo_url,
      primaryColor: tenant.primary_color,
    },
  })

  if (emailError) {
    console.error('Erro ao enviar e-mail de boas-vindas:', emailError)
    // Não falha o fluxo — e-mail é best-effort
  }

  return { success: true }
}
D_RESET,
    category: 'user',
    description: `Senha resetada e e-mail reenviado para "${tenant.business_name}" (${profile.email})`,
    targetType: 'tenant',
    targetId: tenantId,
  })

  return { success: true }
}
