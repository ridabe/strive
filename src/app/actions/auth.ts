'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'
import type { AppRole } from '@/types/db-enums'

function redirectByRole(role: AppRole): never {
  if (role === 'global_admin') redirect('/admin')
  if (role === 'student') redirect('/student')
  redirect('/dashboard')
}

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
  const email    = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .single()

  const role: AppRole = profile?.role ?? 'personal'

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
  const email        = formData.get('email') as string
  const password     = formData.get('password') as string
  const fullName     = formData.get('full_name') as string
  const businessName = (formData.get('business_name') as string) || fullName

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'personal' } },
  })

  if (authError) redirect('/register?error=' + encodeURIComponent(authError.message))
  if (!authData.user) redirect('/register?error=' + encodeURIComponent('Erro ao criar conta. Tente novamente.'))

  // Tenant + vínculo em profiles.tenant_id + tenant_members são criados de forma
  // atômica via RPC SECURITY DEFINER, pois public.tenants não tem policy de RLS
  // de INSERT para o usuário comum (só global_admin) — um insert direto aqui
  // sempre falhava silenciosamente e deixava a conta órfã (profile 'personal'
  // sem tenant, sem aparecer em Clientes).
  const { error: tenantError } = await supabase.rpc('create_own_tenant', {
    p_business_name: businessName,
    p_slug: email.split('@')[0],
  })

  if (tenantError) redirect('/register?error=' + encodeURIComponent('Conta criada, mas erro ao configurar tenant.'))

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
