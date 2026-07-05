'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'

interface TenantInviteContext {
  business_name: string
  logo_url: string | null
  primary_color: string | null
  personal_name: string | null
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/**
 * Busca o contexto do tenant usado em convites e reenvio de acesso.
 */
async function getTenantInviteContext(tenantId: string): Promise<TenantInviteContext | null> {
  const adminClient = createAdminClient()

  const [{ data: tenant }, { data: personalProfile }] = await Promise.all([
    adminClient
      .from('tenants')
      .select('business_name, logo_url, primary_color')
      .eq('id', tenantId)
      .single(),
    adminClient
      .from('profiles')
      .select('full_name')
      .eq('tenant_id', tenantId)
      .eq('role', 'personal')
      .maybeSingle(),
  ])

  if (!tenant) return null

  return {
    business_name: tenant.business_name,
    logo_url: tenant.logo_url,
    primary_color: tenant.primary_color,
    personal_name: personalProfile?.full_name ?? null,
  }
}

/**
 * Garante que a server action está sendo executada por um admin autenticado.
 */
async function requireAuthenticatedAdmin(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user: admin } } = await supabase.auth.getUser()
  if (!admin) return { error: 'Não autenticado.' }
  return {}
}

/**
 * Sincroniza o status de um aluno no cadastro auxiliar e no perfil principal quando existir.
 */
export async function updateStudentRecordStatus(
  studentId: string,
  status: 'active' | 'inactive'
): Promise<{ error?: string }> {
  try {
    const authCheck = await requireAuthenticatedAdmin()
    if (authCheck.error) return authCheck

    const adminClient = createAdminClient()

    const { data: student, error: studentError } = await adminClient
      .from('students')
      .select('id, user_id, full_name')
      .eq('id', studentId)
      .single()

    if (studentError || !student) return { error: studentError?.message ?? 'Aluno não encontrado.' }

    const { error: updateStudentError } = await adminClient
      .from('students')
      .update({ status })
      .eq('id', studentId)

    if (updateStudentError) return { error: updateStudentError.message }

    if (student.user_id) {
      const { error: updateProfileError } = await adminClient
        .from('profiles')
        .update({ status })
        .eq('id', student.user_id)

      if (updateProfileError) return { error: updateProfileError.message }
    }

    await logAdminAction({
      action: 'STUDENT_STATUS_UPDATED',
      category: 'user',
      description: `Status do aluno ${student.full_name} alterado para ${status}`,
      targetId: studentId,
      metadata: { status },
    })

    revalidatePath('/admin/usuarios')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

/**
 * Vincula um aluno a outro personal/tenant. Nunca move o cadastro original —
 * cria (ou reativa) um cadastro no tenant de destino e preserva o cadastro de
 * origem intacto (o aluno continua aparecendo, inativo, para o personal antigo).
 */
export async function reassignStudentTenant(
  studentId: string,
  tenantId: string
): Promise<{ error?: string }> {
  try {
    const authCheck = await requireAuthenticatedAdmin()
    if (authCheck.error) return authCheck

    const adminClient = createAdminClient()

    const [{ data: student, error: studentError }, { data: tenant, error: tenantError }] = await Promise.all([
      adminClient
        .from('students')
        .select('id, user_id, full_name, email, phone, birth_date, goal, notes, avatar_url, tenant_id')
        .eq('id', studentId)
        .single(),
      adminClient
        .from('tenants')
        .select('id, business_name')
        .eq('id', tenantId)
        .single(),
    ])

    if (studentError || !student) return { error: studentError?.message ?? 'Aluno não encontrado.' }
    if (tenantError || !tenant) return { error: tenantError?.message ?? 'Tenant não encontrado.' }

    if (student.tenant_id === tenantId) {
      return { error: 'O aluno já está vinculado a este estúdio.' }
    }

    // Já existe um cadastro deste aluno no tenant de destino (ex: ele já foi aluno lá antes)?
    let targetStudentId: string | null = null
    if (student.email) {
      const { data: existingAtTarget } = await adminClient
        .from('students')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', student.email)
        .maybeSingle()

      if (existingAtTarget) {
        const { error: reactivateError } = await adminClient
          .from('students')
          .update({ status: 'active' })
          .eq('id', existingAtTarget.id)
        if (reactivateError) return { error: reactivateError.message }
        targetStudentId = existingAtTarget.id
      }
    }

    if (!targetStudentId) {
      // Sem cadastro anterior no destino — cria um novo, preservando o cadastro
      // original (que permanece como estava) no estúdio de origem para histórico.
      const { data: created, error: insertError } = await adminClient
        .from('students')
        .insert({
          tenant_id: tenantId,
          user_id: student.user_id,
          full_name: student.full_name,
          email: student.email,
          phone: student.phone,
          birth_date: student.birth_date,
          goal: student.goal,
          notes: student.notes,
          avatar_url: student.avatar_url,
          status: 'active',
        })
        .select('id')
        .single()

      if (insertError || !created) return { error: insertError?.message ?? 'Erro ao vincular aluno ao novo estúdio.' }
      targetStudentId = created.id
    }

    if (student.user_id) {
      const { error: updateProfileError } = await adminClient
        .from('profiles')
        .update({ tenant_id: tenantId, status: 'active' })
        .eq('id', student.user_id)

      if (updateProfileError) return { error: updateProfileError.message }
    }

    await logAdminAction({
      action: 'STUDENT_TENANT_REASSIGNED',
      category: 'user',
      description: `Aluno ${student.full_name} vinculado ao tenant ${tenant.business_name}`,
      targetId: targetStudentId,
      metadata: { fromTenantId: student.tenant_id, toTenantId: tenantId, originalStudentId: studentId },
    })

    revalidatePath('/admin/usuarios')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

/**
 * Regulariza a conta de acesso de um aluno que existe no cadastro, mas não possui auth/perfil válidos.
 */
export async function regularizeStudentAccess(input: {
  studentId: string
  tenantId: string
  sendInvite: boolean
}): Promise<{ error?: string; tempPassword?: string }> {
  try {
    const authCheck = await requireAuthenticatedAdmin()
    if (authCheck.error) return authCheck

    const adminClient = createAdminClient()

    const { data: student, error: studentError } = await adminClient
      .from('students')
      .select('id, user_id, full_name, email, status, tenant_id')
      .eq('id', input.studentId)
      .single()

    if (studentError || !student) return { error: studentError?.message ?? 'Aluno não encontrado.' }

    const email = student.email?.trim().toLowerCase()
    if (!email) return { error: 'O aluno precisa ter e-mail para criar ou reenviar acesso.' }

    const inviteContext = await getTenantInviteContext(input.tenantId)
    if (!inviteContext) return { error: 'Tenant de destino não encontrado.' }

    let userId = student.user_id
    let tempPassword: string | undefined
    let createdNewUser = false

    if (userId) {
      const { error: syncAuthError } = await adminClient.auth.admin.updateUserById(userId, {
        email,
        user_metadata: {
          full_name: student.full_name,
          role: 'student',
        },
      })

      if (syncAuthError) {
        userId = null
      }
    }

    if (!userId) {
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .maybeSingle()

      if (existingProfile?.role && existingProfile.role !== 'student') {
        return { error: 'Já existe uma conta com esse e-mail usando outro papel no sistema.' }
      }

      if (existingProfile?.id) {
        userId = existingProfile.id
      } else {
        const { data: existingStudentAccount } = await adminClient
          .from('students')
          .select('user_id')
          .eq('email', email)
          .not('user_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingStudentAccount?.user_id) {
          userId = existingStudentAccount.user_id
        }
      }
    }

    if (!userId) {
      tempPassword = generateTempPassword()
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: student.full_name,
          role: 'student',
        },
      })

      if (authError || !authData.user) {
        return { error: authError?.message ?? 'Falha ao criar conta de acesso.' }
      }

      userId = authData.user.id
      createdNewUser = true
    } else if (input.sendInvite) {
      tempPassword = generateTempPassword()
      const { error: passwordError } = await adminClient.auth.admin.updateUserById(userId, {
        password: tempPassword,
        user_metadata: {
          full_name: student.full_name,
          role: 'student',
        },
      })

      if (passwordError) return { error: passwordError.message }
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        full_name: student.full_name,
        email,
        role: 'student',
        status: student.status === 'inactive' ? 'inactive' : 'active',
        tenant_id: input.tenantId,
        must_change_password: !!tempPassword,
      })

    if (profileError) {
      if (createdNewUser && userId) await adminClient.auth.admin.deleteUser(userId)
      return { error: profileError.message }
    }

    const { error: studentUpdateError } = await adminClient
      .from('students')
      .update({
        user_id: userId,
        tenant_id: input.tenantId,
        email,
      })
      .eq('id', input.studentId)

    if (studentUpdateError) return { error: studentUpdateError.message }

    if (input.sendInvite && tempPassword) {
      const supabase = await createClient()
      const { error: inviteError } = await supabase.functions.invoke('send-student-welcome', {
        body: {
          email,
          studentName: student.full_name,
          personalName: inviteContext.personal_name ?? inviteContext.business_name,
          businessName: inviteContext.business_name,
          tempPassword,
          logoUrl: inviteContext.logo_url,
          primaryColor: inviteContext.primary_color,
          reusingAccount: !createdNewUser,
        },
      })

      if (inviteError) {
        return { error: `Conta regularizada, mas houve falha ao enviar convite: ${inviteError.message}` }
      }
    }

    await logAdminAction({
      action: 'STUDENT_ACCESS_REGULARIZED',
      category: 'user',
      description: `Acesso regularizado para ${student.full_name}`,
      targetId: input.studentId,
      metadata: { tenantId: input.tenantId, userId },
    })

    revalidatePath('/admin/usuarios')
    return { tempPassword }
  } catch (e) {
    return { error: String(e) }
  }
}

/**
 * Reenvia o acesso de um aluno já regularizado gerando uma nova senha temporária.
 */
export async function resendStudentAccess(studentId: string): Promise<{ error?: string; tempPassword?: string }> {
  try {
    const authCheck = await requireAuthenticatedAdmin()
    if (authCheck.error) return authCheck

    const adminClient = createAdminClient()

    const { data: student, error: studentError } = await adminClient
      .from('students')
      .select('id, user_id, full_name, email, tenant_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) return { error: studentError?.message ?? 'Aluno não encontrado.' }
    if (!student.user_id || !student.email) return { error: 'O aluno ainda não possui acesso regularizado.' }

    const inviteContext = await getTenantInviteContext(student.tenant_id)
    if (!inviteContext) return { error: 'Tenant do aluno não encontrado.' }

    const tempPassword = generateTempPassword()

    const { error: passwordError } = await adminClient.auth.admin.updateUserById(student.user_id, {
      password: tempPassword,
      user_metadata: {
        full_name: student.full_name,
        role: 'student',
      },
    })
    if (passwordError) return { error: passwordError.message }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', student.user_id)

    if (profileError) return { error: profileError.message }

    const supabase = await createClient()
    const { error: inviteError } = await supabase.functions.invoke('send-student-welcome', {
      body: {
        email: student.email,
        studentName: student.full_name,
        personalName: inviteContext.personal_name ?? inviteContext.business_name,
        businessName: inviteContext.business_name,
        tempPassword,
        logoUrl: inviteContext.logo_url,
        primaryColor: inviteContext.primary_color,
      },
    })

    if (inviteError) return { error: inviteError.message }

    await logAdminAction({
      action: 'STUDENT_ACCESS_RESENT',
      category: 'user',
      description: `Acesso reenviado para ${student.full_name}`,
      targetId: studentId,
      metadata: { userId: student.user_id },
    })

    revalidatePath('/admin/usuarios')
    return { tempPassword }
  } catch (e) {
    return { error: String(e) }
  }
}

// ── Suspend user ─────────────────────────────────────────────────
export async function suspendUser(userId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) return { error: 'Não autenticado.' }

    const adminClient = createAdminClient()

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: '87600h', // 10 anos = suspenso indefinidamente
    })
    if (authError) return { error: authError.message }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', userId)
    if (profileError) return { error: profileError.message }

    await adminClient
      .from('students')
      .update({ status: 'inactive' })
      .eq('user_id', userId)

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', userId)
      .single()

    await logAdminAction({
      action: AuditActions.USER_SUSPENDED,
      category: 'user',
      description: `Usuário ${profile?.full_name ?? userId} suspenso`,
      targetId: userId,
      metadata: { role: profile?.role },
    })

    revalidatePath('/admin/usuarios')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

// ── Activate user ─────────────────────────────────────────────────
export async function activateUser(userId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) return { error: 'Não autenticado.' }

    const adminClient = createAdminClient()

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    })
    if (authError) return { error: authError.message }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', userId)
    if (profileError) return { error: profileError.message }

    await adminClient
      .from('students')
      .update({ status: 'active' })
      .eq('user_id', userId)

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    await logAdminAction({
      action: AuditActions.USER_ACTIVATED,
      category: 'user',
      description: `Usuário ${profile?.full_name ?? userId} reativado`,
      targetId: userId,
      metadata: { role: profile?.role },
    })

    revalidatePath('/admin/usuarios')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

// ── Reset password ────────────────────────────────────────────────
export async function resetUserPassword(userId: string): Promise<{ error?: string; tempPassword?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) return { error: 'Não autenticado.' }

    const adminClient = createAdminClient()
    const tempPassword = generateTempPassword()

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      password: tempPassword,
    })
    if (authError) return { error: authError.message }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId)
    if (profileError) return { error: profileError.message }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    await logAdminAction({
      action: AuditActions.PASSWORD_RESET,
      category: 'user',
      description: `Senha resetada para ${profile?.full_name ?? userId}`,
      targetId: userId,
      metadata: { role: profile?.role },
    })

    revalidatePath('/admin/usuarios')
    return { tempPassword }
  } catch (e) {
    return { error: String(e) }
  }
}

// ── Delete user ───────────────────────────────────────────────────
export async function deleteUser(userId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) return { error: 'Não autenticado.' }

    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return { error: error.message }

    await logAdminAction({
      action: AuditActions.USER_DELETED,
      category: 'user',
      description: `Usuário ${profile?.full_name ?? userId} deletado`,
      targetId: userId,
      metadata: { role: profile?.role },
    })

    revalidatePath('/admin/usuarios')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

// ── Create global admin ───────────────────────────────────────────
export async function createGlobalAdmin(formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) return { error: 'Não autenticado.' }

    const email    = formData.get('email') as string
    const fullName = formData.get('full_name') as string

    if (!email || !fullName) return { error: 'E-mail e nome são obrigatórios.' }

    const adminClient = createAdminClient()
    const tempPassword = generateTempPassword()

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'global_admin' },
    })
    if (createError) return { error: createError.message }
    if (!userData.user) return { error: 'Falha ao criar usuário.' }

    // Upsert profile with global_admin role
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userData.user.id,
        full_name: fullName,
        email,
        role: 'global_admin',
        must_change_password: true,
      })
    if (profileError) return { error: profileError.message }

    await logAdminAction({
      action: AuditActions.CLIENT_CREATED,
      category: 'user',
      description: `Admin global criado: ${fullName} (${email})`,
      targetId: userData.user.id,
    })

    revalidatePath('/admin/usuarios')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}
