import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Rotas de API cuidam da própria autenticação (secret de cron, assinatura de
  // webhook, etc.) — não têm cookie de sessão, então o redirect de "não
  // autenticado" pra /login nunca deveria se aplicar aqui.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
