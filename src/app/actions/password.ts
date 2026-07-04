'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { buildPasswordRecoveryEmail } from '@/lib/email/password-recovery'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Resolve a URL base da aplicação a partir da requisição atual, com fallback para a env.
 */
async function resolveAppUrl(): Promise<string> {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol =
    requestHeaders.get('x-forwarded-proto') ??
    (host?.includes('localhost') ? 'http' : 'https')

  if (host) {
    return `${protocol}://${host}`.replace(/\/$/, '')
  }

  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

/**
 * Inicia o fluxo de recuperação de senha gerando um link do Supabase e enviando via Resend.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Informe um e-mail válido para continuar.'))
  }

  const appUrl = await resolveAppUrl()
  const adminClient = createAdminClient()
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM ?? 'noreply@strivepersonal.com.br'

  if (!resendApiKey) {
    redirect('/forgot-password?error=' + encodeURIComponent(
      'O envio de recuperação não está configurado no ambiente.'
    ))
  }

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${appUrl}/reset-password`,
    },
  })

  if (error) {
    if (error.code === 'user_not_found') {
      redirect('/forgot-password?message=' + encodeURIComponent(
        'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'
      ) + '&sent=1')
    }

    redirect('/forgot-password?error=' + encodeURIComponent(
      'Não foi possível gerar o link de recuperação agora. Tente novamente em instantes.'
    ))
  }

  const tokenHash = data.properties?.hashed_token
  const verificationType = data.properties?.verification_type ?? 'recovery'
  const recipientName =
    typeof data.user?.user_metadata?.full_name === 'string' && data.user.user_metadata.full_name.trim()
      ? data.user.user_metadata.full_name.trim()
      : email

  if (!tokenHash) {
    redirect('/forgot-password?error=' + encodeURIComponent(
      'Não foi possível montar o link de recuperação agora. Tente novamente em instantes.'
    ))
  }

  // Usa uma etapa intermediária no próprio app para evitar que scanners de e-mail
  // consumam o token imediatamente ao abrir o link.
  const recoveryLink =
    `${appUrl}/reset-password?token_hash=${encodeURIComponent(tokenHash)}` +
    `&type=${encodeURIComponent(verificationType)}` +
    `&next=${encodeURIComponent('/alterar-senha')}`

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Strive Personal <${emailFrom}>`,
      to: [email],
      subject: 'Redefina sua senha no Strive Personal',
      html: buildPasswordRecoveryEmail({
        recipientName,
        recipientEmail: email,
        recoveryLink,
        appUrl,
      }),
    }),
  })

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text()
    console.error('[requestPasswordReset] Resend error:', resendError)
    redirect('/forgot-password?error=' + encodeURIComponent(
      'Não foi possível enviar o e-mail de recuperação agora. Tente novamente em instantes.'
    ))
  }

  redirect('/forgot-password?message=' + encodeURIComponent(
    'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'
  ) + '&sent=1')
}

/**
 * Atualiza a senha do usuário autenticado após primeiro acesso ou recuperação.
 */
export async function changePassword(formData: FormData) {
  const newPassword     = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 8) {
    redirect('/alterar-senha?error=' + encodeURIComponent('A senha deve ter pelo menos 8 caracteres.'))
  }

  if (newPassword !== confirmPassword) {
    redirect('/alterar-senha?error=' + encodeURIComponent('As senhas não coincidem.'))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })

  if (pwError) {
    redirect('/alterar-senha?error=' + encodeURIComponent(`Erro ao atualizar senha: ${pwError.message}`))
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id)

  if (profileError) {
    redirect('/alterar-senha?error=' + encodeURIComponent('Senha alterada, mas erro ao atualizar perfil. Tente novamente.'))
  }

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
