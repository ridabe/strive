import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { AppRole } from '@/types/database'

const PUBLIC_PATHS = [
  '/', '/login', '/register', '/forgot-password',
  '/reset-password', '/termos', '/privacidade',
]

// Rota de troca obrigatória — acessível para autenticados
const CHANGE_PASSWORD_PATH = '/alterar-senha'

const ROLE_ROUTES: Record<AppRole, string> = {
  global_admin: '/admin',
  personal:     '/dashboard',
  student:      '/student',
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(p))
  )
  const isChangePasswordPath = pathname === CHANGE_PASSWORD_PATH

  // ── 1. Não autenticado ─────────────────────────────────────────────────
  if (!user) {
    if (!isPublicPath && !isChangePasswordPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── 2. Busca perfil do usuário autenticado ─────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, must_change_password')
    .eq('id', user.id)
    .single()

  const role: AppRole               = profile?.role ?? 'personal'
  const mustChange: boolean         = profile?.must_change_password ?? false
  const allowedPrefix               = ROLE_ROUTES[role]

  // ── 3. Troca de senha obrigatória ──────────────────────────────────────
  if (mustChange && !isChangePasswordPath) {
    const url = request.nextUrl.clone()
    url.pathname = CHANGE_PASSWORD_PATH
    return NextResponse.redirect(url)
  }

  // Já trocou mas está tentando acessar /alterar-senha → redireciona para área
  if (!mustChange && isChangePasswordPath) {
    const url = request.nextUrl.clone()
    url.pathname = allowedPrefix
    return NextResponse.redirect(url)
  }

  // ── 4. Roteamento por role ──────────────────────────────────────────────
  if (isPublicPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = allowedPrefix
    return NextResponse.redirect(url)
  }

  // global_admin pode acessar qualquer rota protegida
  if (role === 'global_admin') return supabaseResponse

  // Verifica se está acessando área do role correto
  const isInCorrectArea = pathname.startsWith(allowedPrefix)
  if (!isInCorrectArea && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = allowedPrefix
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
