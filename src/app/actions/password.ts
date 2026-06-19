'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function changePassword(formData: FormData) {
  const newPassword     = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 8) {
    return { error: 'A senha deve ter pelo menos 8 caracteres.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Atualiza a senha via Supabase Auth
  const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })

  if (pwError) {
    return { error: `Erro ao atualizar senha: ${pwError.message}` }
  }

  // Marca must_change_password como false
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'Senha alterada, mas erro ao atualizar perfil. Tente novamente.' }
  }

  // Redireciona para a área correta
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'personal'
  if (role === 'global_admin') redirect('/admin')
  if (role === 'student')      redirect('/student')
  redirect('/dashboard')
}
