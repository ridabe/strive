'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, generateTempPassword } from '@/lib/supabase/admin'
import { getCtx } from '@/lib/supabase/context'
import { canCreateMemberRole, canManagePersonal, isBackofficeStaff } from '@/lib/permissions'

// ── Helper de acesso: só owner/admin de uma academia ─────────────────────────
async function requireOwnerOrAdminCtx() {
  const ctx = await getCtx()
  if (!ctx) return null
  if (!['owner', 'admin'].includes(ctx.role)) return null
  return ctx
}

// Staff de backoffice (owner/admin/gerente/operador): ver equipe e cadastrar
// personal. A restrição fina de qual papel pode ser criado fica em
// canCreateMemberRole; remover membros continua restrito a owner/admin.
async function requireBackofficeCtx() {
  const ctx = await getCtx()
  if (!ctx) return null
  if (!isBackofficeStaff(ctx.role)) return null
  return ctx
}

export type TenantMemberRow = {
  id: string
  role: 'owner' | 'admin' | 'gerente' | 'operador' | 'personal'
  status: 'active' | 'invited' | 'removed'
  user_id: string
  full_name: string | null
  email: string | null
  assigned_students_count: number
}

// ── Lista os vínculos ativos/convidados da academia (para a tela de Equipe) ──
export async function listTenantMembers(): Promise<TenantMemberRow[]> {
  const ctx = await requireBackofficeCtx()
  if (!ctx) return []
  const { supabase, tenantId } = ctx

  const { data: members } = await supabase
    .from('tenant_members')
    .select('id, role, status, user_id, profiles ( full_name, email )')
    .eq('tenant_id', tenantId)
    .neq('status', 'removed')
    .order('role')

  if (!members) return []

  const { data: assignmentCounts } = await supabase
    .from('students')
    .select('assigned_personal_id')
    .eq('tenant_id', tenantId)
    .not('assigned_personal_id', 'is', null)

  const countByMember = new Map<string, number>()
  for (const row of assignmentCounts ?? []) {
    if (!row.assigned_personal_id) continue
    countByMember.set(row.assigned_personal_id, (countByMember.get(row.assigned_personal_id) ?? 0) + 1)
  }

  return members.map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      id: m.id,
      role: m.role as TenantMemberRow['role'],
      status: m.status as TenantMemberRow['status'],
      user_id: m.user_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      assigned_students_count: countByMember.get(m.id) ?? 0,
    }
  })
}

// ── Convida um personal ou admin para a academia ─────────────────────────────
export async function createTenantMember(formData: FormData): Promise<{ error?: string }> {
  const ctx = await requireBackofficeCtx()
  if (!ctx) return { error: 'Acesso negado.' }
  const { supabase, tenantId } = ctx
  const adminSupabase = createAdminClient()

  const email    = (formData.get('email') as string)?.trim().toLowerCase()
  const fullName = (formData.get('full_name') as string)?.trim()
  const roleRaw = (formData.get('role') as string) ?? 'personal'
  const role = (['admin', 'gerente', 'operador', 'personal'].includes(roleRaw)
    ? roleRaw
    : 'personal') as 'admin' | 'gerente' | 'operador' | 'personal'

  // Operação só cria personal; owner/admin criam qualquer staff. Fonte: permissions.ts
  if (!canCreateMemberRole(ctx.role, role)) {
    return { error: 'Você não tem permissão para criar esse tipo de acesso.' }
  }

  if (!email)    return { error: 'E-mail é obrigatório.' }
  if (!fullName) return { error: 'Nome completo é obrigatório.' }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, logo_url, primary_color, max_personals, tenant_type')
    .eq('id', tenantId)
    .single()

  if (!tenant || tenant.tenant_type !== 'academia') {
    return { error: 'Gestão de equipe disponível apenas para tenants do tipo academia.' }
  }

  const { count: activeCount } = await supabase
    .from('tenant_members')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active')

  if ((activeCount ?? 0) >= tenant.max_personals) {
    return { error: `Limite de ${tenant.max_personals} personais/admins atingido para o seu plano.` }
  }

  // Já existe conta com esse e-mail (personal de outra academia, ou autônomo)?
  const { data: existingProfile } = await adminSupabase
    .from('profiles')
    .select('id, must_change_password')
    .eq('email', email)
    .maybeSingle()

  let userId: string
  let tempPassword: string | null = null

  if (existingProfile) {
    userId = existingProfile.id
    // Vínculo adicional em tenant_members — não altera o tenant_id atual do
    // profile (isso é resolvido pelo seletor de organização no login/dashboard).
    //
    // Se a conta nunca foi ativada (nunca definiu a própria senha), gera uma
    // nova senha provisória e reenvia o e-mail. Cobre o caso de um vínculo
    // criado numa tentativa anterior que falhou (ex.: constraint) e deixou o
    // perfil órfão — sem isso, o convite seria "silencioso" (sem e-mail).
    if (existingProfile.must_change_password) {
      tempPassword = generateTempPassword()
      const { error: pwErr } = await adminSupabase.auth.admin.updateUserById(userId, { password: tempPassword })
      if (pwErr) {
        console.error('[createTenantMember] Falha ao redefinir senha provisória:', pwErr.message)
        tempPassword = null
      }
    }
  } else {
    tempPassword = generateTempPassword()

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'personal' },
    })

    if (authError || !authData.user) {
      return { error: `Erro ao criar acesso: ${authError?.message ?? 'desconhecido'}` }
    }

    userId = authData.user.id

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: 'personal',
        tenant_id: tenantId,
        must_change_password: true,
      })

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(userId)
      return { error: `Erro ao configurar perfil: ${profileError.message}` }
    }
  }

  const { error: memberError } = await adminSupabase
    .from('tenant_members')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      role,
      status: 'active',
      joined_at: new Date().toISOString(),
    })

  if (memberError) {
    if (memberError.code === '23505') return { error: 'Essa pessoa já faz parte da sua equipe.' }
    return { error: `Erro ao vincular à equipe: ${memberError.message}` }
  }

  if (tempPassword) {
    const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email,
        fullName,
        businessName: tenant.business_name,
        tempPassword,
        logoUrl: tenant.logo_url,
        primaryColor: tenant.primary_color,
      },
    })
    if (emailError) console.error('[createTenantMember] Falha ao enviar e-mail:', emailError.message)
  }

  revalidatePath('/dashboard/equipe')
  return {}
}

// ── Reenvia a senha provisória de um membro (gera nova, redefine e e-mail) ──
// Útil quando o convite não chegou ou o membro perdeu a senha antes de ativar.
export async function resendMemberPassword(tenantMemberId: string): Promise<{ error?: string }> {
  const ctx = await requireOwnerOrAdminCtx()
  if (!ctx) return { error: 'Acesso negado.' }
  const { supabase, tenantId } = ctx
  const adminSupabase = createAdminClient()

  const { data: member } = await adminSupabase
    .from('tenant_members')
    .select('user_id, role, tenant_id')
    .eq('id', tenantMemberId)
    .eq('tenant_id', tenantId)
    .single()

  if (!member) return { error: 'Membro não encontrado nesta academia.' }
  if (member.role === 'owner') return { error: 'Não é possível redefinir a senha do dono por aqui.' }

  const { data: prof } = await adminSupabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', member.user_id)
    .single()

  if (!prof?.email) return { error: 'E-mail do membro não encontrado.' }

  const tempPassword = generateTempPassword()
  const { error: pwErr } = await adminSupabase.auth.admin.updateUserById(member.user_id, { password: tempPassword })
  if (pwErr) return { error: `Falha ao redefinir senha: ${pwErr.message}` }

  await adminSupabase.from('profiles').update({ must_change_password: true }).eq('id', member.user_id)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, logo_url, primary_color')
    .eq('id', tenantId)
    .single()

  const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
    body: {
      email: prof.email,
      fullName: prof.full_name,
      businessName: tenant?.business_name,
      tempPassword,
      logoUrl: tenant?.logo_url,
      primaryColor: tenant?.primary_color,
    },
  })
  if (emailError) return { error: `Senha redefinida, mas o e-mail falhou: ${emailError.message}` }

  return {}
}

// ── Remove um personal/admin — bloqueado se ainda houver aluno atribuído ─────
export async function removeTenantMember(tenantMemberId: string): Promise<{ error?: string }> {
  const ctx = await requireOwnerOrAdminCtx()
  if (!ctx) return { error: 'Acesso negado.' }
  const { supabase, tenantId } = ctx

  const { data: member } = await supabase
    .from('tenant_members')
    .select('role')
    .eq('id', tenantMemberId)
    .eq('tenant_id', tenantId)
    .single()

  if (!member) return { error: 'Vínculo não encontrado.' }
  if (member.role === 'owner') return { error: 'Não é possível remover o dono da academia.' }

  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_personal_id', tenantMemberId)

  if ((count ?? 0) > 0) {
    return { error: `Este personal ainda tem ${count} aluno(s) atribuído(s). Reatribua todos antes de remover.` }
  }

  const { error } = await supabase
    .from('tenant_members')
    .update({ status: 'removed' })
    .eq('id', tenantMemberId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/equipe')
  return {}
}

// ── Atribui/reatribui um aluno a um personal (owner/admin livre; personal só
//    autoatribuição quando self_assign_enabled e aluno ainda não atribuído) ──
export async function assignStudentToPersonal(
  studentId: string,
  tenantMemberId: string | null
): Promise<{ error?: string }> {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Acesso negado.' }
  const { tenantId, role } = ctx
  const adminSupabase = createAdminClient()

  const { data: tenant } = await adminSupabase
    .from('tenants')
    .select('tenant_type, self_assign_enabled')
    .eq('id', tenantId)
    .single()

  if (!tenant || tenant.tenant_type !== 'academia') {
    return { error: 'Atribuição de personal disponível apenas para tenants do tipo academia.' }
  }

  const { data: student } = await adminSupabase
    .from('students')
    .select('id, assigned_personal_id, tenant_id')
    .eq('id', studentId)
    .eq('tenant_id', tenantId)
    .single()

  if (!student) return { error: 'Aluno não encontrado nesta academia.' }

  if (!canManagePersonal(role)) {
    if (!tenant.self_assign_enabled) {
      return { error: 'Você não tem permissão para atribuir alunos. Peça a um admin.' }
    }
    if (student.assigned_personal_id) {
      return { error: 'Este aluno já está atribuído a outro personal.' }
    }

    const { data: { user } } = await (await createClient()).auth.getUser()
    const { data: myMembership } = await adminSupabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user?.id ?? '')
      .eq('status', 'active')
      .maybeSingle()

    if (!myMembership || tenantMemberId !== myMembership.id) {
      return { error: 'Você só pode se autoatribuir a alunos não atribuídos.' }
    }
  }

  if (tenantMemberId) {
    const { data: targetMember } = await adminSupabase
      .from('tenant_members')
      .select('id')
      .eq('id', tenantMemberId)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .maybeSingle()

    if (!targetMember) return { error: 'Personal de destino inválido.' }
  }

  const { error } = await adminSupabase
    .from('students')
    .update({ assigned_personal_id: tenantMemberId })
    .eq('id', studentId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/alunos')
  revalidatePath(`/dashboard/alunos/${studentId}`)
  revalidatePath('/dashboard/equipe')
  return {}
}
