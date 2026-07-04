import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Converte erros comuns do Supabase em mensagens amigáveis para a tela de reset.
 */
function buildResetErrorMessage(errorCode?: string | null): string {
  if (errorCode === 'otp_expired') {
    return 'Este link de recuperação expirou, já foi usado ou foi invalidado. Solicite um novo e-mail para continuar.'
  }

  return 'Não foi possível validar o link de recuperação. Solicite um novo e-mail para continuar.'
}

/**
 * Confirma links de e-mail do Supabase e cria a sessão SSR antes do redirecionamento final.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next')
  const nextPath = nextParam?.startsWith('/') ? nextParam : '/alterar-senha'

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/reset-password?error=' + encodeURIComponent('Link de recuperação inválido.'), request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    return NextResponse.redirect(
      new URL(
        '/reset-password?error=' + encodeURIComponent(buildResetErrorMessage(error.code)) +
        '&error_code=' + encodeURIComponent(error.code ?? 'unknown'),
        request.url
      )
    )
  }

  return NextResponse.redirect(new URL(nextPath, request.url))
}
