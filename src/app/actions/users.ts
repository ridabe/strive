'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
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

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', userId)
      .single()

    await logAdminAction({
      action: AuditActions.USER_SUSPENDED,
      category: 'users',
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

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    await logAdminAction({
      action: AuditActions.USER_ACTIVATED,
      category: 'users',
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
      category: 'users',
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
      category: 'users',
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
      category: 'users',
      description: `Admin global criado: ${fullName} (${email})`,
      targetId: userData.user.id,
    })

    revalidatePath('/admin/usuarios')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}
