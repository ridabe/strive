import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase com service_role key.
 * APENAS para uso em Server Actions e Route Handlers — nunca expor no cliente.
 * Bypassa RLS — use com cautela.
 */
export function createAdminClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const roleKey = process.env.SUPABASE_API_KEY!   // service_role key

  if (!url || !roleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_API_KEY não configurados')
  }

  return createClient<Database>(url, roleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Gera uma senha temporária segura no formato:
 * 2 maiúsculas + 2 números + 4 minúsculas + 2 especiais
 * Ex: AB12abcd@#
 */
export function generateTempPassword(): string {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits  = '23456789'
  const lower   = 'abcdefghjkmnpqrstuvwxyz'
  const special = '@#$!&'

  const rand = (str: string) => str[Math.floor(Math.random() * str.length)]

  const parts = [
    rand(upper), rand(upper),
    rand(digits), rand(digits),
    rand(lower), rand(lower), rand(lower), rand(lower),
    rand(special), rand(special),
  ]

  // Embaralha
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[parts[i], parts[j]] = [parts[j], parts[i]]
  }

  return parts.join('')
}
