'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'
import type { AppRole } from '@/types/database'

// Redireciona para a área correta por role
function redirectByRole(role: AppRole): never {
  if (role === 'global_admin') redirect('/admin')
  if (role === 'student') redirect('/student')
  redirect('/dashboard')
}

// Extrai IP do request
async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ??
    headersList.get('x-real-ip') ??
    'unknown'
  )
}

// ── Login ────────────────────────────────────────────────────────
export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .single()

  const role: AppRole = profile?.role ?? 'personal'

  // Registra login do admin global no audit log
  if (role === 'global_admin') {
    const ip = await getClientIp()
    await logAdminAction({
      action: AuditActions.LOGIN,
      category: 'auth',
      description: `Login realizado por ${profile?.full_name ?? email}`,
      metadata: { email },
      ipAddress: ip,
    })
  }

  redirectByRole(role)
}

// ── Registro de Personal Trainer ─────────────────────────────────
export async function signUpPersonal(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const businessName = (formData.get('business_name') as string) || fullName

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'personal' },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Erro ao criar conta. Tente novamente.' }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ business_name: businessName, plan: 'free', max_students: 5 })
    .select('id')
    .single()

  if (tenantError) return { error: 'Conta criada, mas erro ao configurar tenant.' }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ tenant_id: tenant.id })
    .eq('id', authData.user.id)

  if (profileError) return { error: 'Conta criada, mas erro ao vincular tenant.' }

  redirect('/dashboard')
}

// ── Logout ───────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'global_admin') {
      await logAdminAction({
        action: AuditActions.LOGOUT,
        category: 'auth',
        description: `Logout realizado por ${profile?.full_name ?? user.email}`,
      })
    }
  }

  await supabase.auth.signOut()
  redirect('/login')
}
