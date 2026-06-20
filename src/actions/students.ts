'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, generateTempPassword } from '@/lib/supabase/admin'

// ── Criar aluno + auth user + e-mail de boas-vindas ──────────────────────────
export async function createStudent(formData: FormData) {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  // ── 1. Perfil do personal logado ────────────────────────────────────────
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) redirect('/login')

  const { data: personalProfile } = await supabase
    .from('profiles')
    .select('tenant_id, full_name')
    .eq('id', currentUser.id)
    .single()

  if (!personalProfile?.tenant_id) {
    redirect('/dashboard/alunos/novo?error=' + encodeURIComponent('Perfil do personal não encontrado.'))
  }

  const tenantId = personalProfile.tenant_id

  // ── 2. Dados do tenant (branding + limite) ──────────────────────────────
  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, logo_url, primary_color, max_students')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    redirect('/dashboard/alunos/novo?error=' + encodeURIComponent('Studio não encontrado.'))
  }

  // ── 3. Campos do formulário ─────────────────────────────────────────────
  const fullName  = (formData.get('full_name') as string)?.trim()
  const email     = (formData.get('email') as string)?.trim().toLowerCase() || null
  const phone     = (formData.get('phone') as string)?.trim() || null
  const birthDate = (formData.get('birth_date') as string) || null
  const goal      = (formData.get('goal') as string)?.trim() || null
  const notes     = (formData.get('notes') as string)?.trim() || null
  const sendInvite = formData.get('send_invite') === 'on' && !!email

  if (!fullName) {
    redirect('/dashboard/alunos/novo?error=' + encodeURIComponent('Nome completo é obrigatório.'))
  }

  // ── 4. Verificar limite de alunos ───────────────────────────────────────
  const { count: currentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if ((currentCount ?? 0) >= tenant.max_students) {
    redirect('/dashboard/alunos/novo?error=' + encodeURIComponent(
      `Limite de ${tenant.max_students} alunos atingido para o seu plano. Faça upgrade para continuar.`
    ))
  }

  // ── 5. Criar auth user (apenas se e-mail fornecido) ─────────────────────
  let userId: string | null = null
  let tempPassword: string | null = null

  if (email) {
    tempPassword = generateTempPassword()

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'student',
      },
    })

    if (authError || !authData.user) {
      redirect('/dashboard/alunos/novo?error=' + encodeURIComponent(
        `Erro ao criar acesso: ${authError?.message ?? 'desconhecido'}`
      ))
    }

    userId = authData.user.id

    // ── 6. Vincular perfil ao tenant + forçar troca de senha ────────────
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        tenant_id: tenantId,
        must_change_password: true,
      })
      .eq('id', userId)

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(userId)
      redirect('/dashboard/alunos/novo?error=' + encodeURIComponent(
        `Erro ao configurar perfil: ${profileError.message}`
      ))
    }
  }

  // ── 7. Inserir registro na tabela students ──────────────────────────────
  const { data: student, error: studentError } = await adminSupabase
    .from('students')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      full_name: fullName,
      email,
      phone,
      birth_date: birthDate || null,
      goal,
      notes,
      status: 'active',
    })
    .select('id')
    .single()

  if (studentError || !student) {
    if (userId) await adminSupabase.auth.admin.deleteUser(userId)
    redirect('/dashboard/alunos/novo?error=' + encodeURIComponent(
      `Erro ao cadastrar aluno: ${studentError?.message ?? 'desconhecido'}`
    ))
  }

  // ── 8. Enviar e-mail de boas-vindas (best-effort) ───────────────────────
  if (sendInvite && email && tempPassword) {
    const { error: emailError } = await supabase.functions.invoke('send-student-welcome', {
      body: {
        email,
        studentName: fullName,
        personalName: personalProfile.full_name ?? tenant.business_name,
        businessName: tenant.business_name,
        tempPassword,
        logoUrl: tenant.logo_url,
        primaryColor: tenant.primary_color,
      },
    })

    if (emailError) {
      console.error('[createStudent] Falha ao enviar e-mail:', emailError.message)
    }
  }

  redirect(`/dashboard/alunos/${student.id}`)
}

// ── Atualizar dados básicos do aluno ─────────────────────────────────────────
export async function updateStudent(
  studentId: string,
  fields: {
    full_name?: string
    phone?: string | null
    birth_date?: string | null
    goal?: string | null
    notes?: string | null
    status?: 'active' | 'inactive'
  }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .update(fields)
    .eq('id', studentId)

  if (error) return { error: error.message }
  return {}
}

// ── Reenviar e-mail de convite com nova senha ─────────────────────────────────
export async function resendStudentInvite(studentId: string): Promise<{ error?: string }> {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  // Busca dados do aluno
  const { data: student } = await supabase
    .from('students')
    .select('full_name, email, user_id')
    .eq('id', studentId)
    .single()

  if (!student?.email || !student.user_id) {
    return { error: 'Aluno sem e-mail ou conta de acesso cadastrada.' }
  }

  // Busca dados do personal + tenant
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: 'Não autenticado' }

  const { data: personalProfile } = await supabase
    .from('profiles')
    .select('full_name, tenant_id')
    .eq('id', currentUser.id)
    .single()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, logo_url, primary_color')
    .eq('id', personalProfile?.tenant_id ?? '')
    .single()

  if (!tenant) return { error: 'Tenant não encontrado.' }

  // Gera nova senha
  const tempPassword = generateTempPassword()

  const { error: pwError } = await adminSupabase.auth.admin.updateUserById(student.user_id, {
    password: tempPassword,
  })
  if (pwError) return { error: `Erro ao resetar senha: ${pwError.message}` }

  await adminSupabase
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', student.user_id)

  const { error: emailError } = await supabase.functions.invoke('send-student-welcome', {
    body: {
      email: student.email,
      studentName: student.full_name,
      personalName: personalProfile?.full_name ?? tenant.business_name,
      businessName: tenant.business_name,
      tempPassword,
      logoUrl: tenant.logo_url,
      primaryColor: tenant.primary_color,
    },
  })

  if (emailError) {
    console.error('[resendStudentInvite] Falha ao enviar e-mail:', emailError.message)
  }

  return {}
}
