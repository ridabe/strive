'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'
import type { AppRole } from '@/types/database'

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

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ business_name: businessName, slug: email.split('@')[0], plan: 'free', max_students: 5 })
    .select('id')
    .single()

  if (tenantError) redirect('/register?error=' + encodeURIComponent('Conta criada, mas erro ao configurar tenant.'))

  const { error: profileError } = await supabase    .from('profiles')
    .update({ tenant_id: tenant!.id })
    .eq('id', authData.user!.id)

  if (profileError) redirect('/register?error=' + encodeURIComponent('Conta criada, mas erro ao vincular tenant.'))

  // Vínculo em tenant_members (role owner) — mantém o tenant sempre representado
  // em tenant_members desde a criação, para o seletor de organização (Fase 4)
  // não depender de um backfill único. Best-effort: se falhar, não bloqueia o
  // cadastro (o tenant autônomo continua funcionando 100% via profiles.tenant_id,
  // como sempre funcionou).
  const { error: memberError } = await supabase
    .from('tenant_members')
    .insert({
      tenant_id: tenant!.id,
      user_id: authData.user!.id,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    })

  if (memberError) console.error('[signUpPersonal] Falha ao criar tenant_members:', memberError.message)

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
