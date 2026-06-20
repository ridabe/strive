'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES: Record<string, 'pdf' | 'image'> = {
  'application/pdf': 'pdf',
  'image/jpeg':      'image',
  'image/jpg':       'image',
  'image/png':       'image',
  'image/webp':      'image',
  'image/gif':       'image',
}

async function getPersonalCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role !== 'personal') return null
  return { supabase, tenant_id: profile.tenant_id }
}

// ─── Passo 1: gera URL assinada de upload ────────────────────────────────────
// O arquivo é enviado DIRETO do browser ao Supabase Storage — não passa pelo Vercel.
export async function createSignedUploadUrl(fileName: string, contentType: string) {
  const ctx = await getPersonalCtx()
  if (!ctx) return { error: 'Não autorizado' }

  const fileType = ALLOWED_TYPES[contentType]
  if (!fileType) return { error: 'Tipo não suportado. Use PDF ou imagem (JPG, PNG, WEBP).' }

  const ext  = fileName.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${ctx.tenant_id}/${crypto.randomUUID()}.${ext}`

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase.storage
    .from('shared-files')
    .createSignedUploadUrl(path)

  if (error) return { error: error.message }

  return { signedUrl: data.signedUrl, path, fileType }
}

// ─── Passo 2: salva metadados após upload concluído ──────────────────────────
export async function saveSharedFile(input: {
  path:        string
  title:       string
  description: string | null
  student_id:  string | null
  file_type:   'pdf' | 'image'
  file_name:   string
  file_size:   number
}) {
  const ctx = await getPersonalCtx()
  if (!ctx) return { error: 'Não autorizado' }

  const adminSupabase = createAdminClient()
  const { data: { publicUrl } } = adminSupabase.storage
    .from('shared-files')
    .getPublicUrl(input.path)

  const { error } = await ctx.supabase.from('shared_files').insert({
    tenant_id:   ctx.tenant_id,
    student_id:  input.student_id || null,
    title:       input.title,
    description: input.description || null,
    file_url:    publicUrl,
    file_type:   input.file_type,
    file_name:   input.file_name,
    file_size:   input.file_size,
  })

  if (error) {
    await adminSupabase.storage.from('shared-files').remove([input.path])
    return { error: error.message }
  }

  revalidatePath('/dashboard/arquivos')
  return { success: true, publicUrl }
}

// ─── Excluir arquivo ─────────────────────────────────────────────────────────
export async function deleteSharedFile(id: string) {
  const ctx = await getPersonalCtx()
  if (!ctx) return { error: 'Não autorizado' }

  const adminSupabase = createAdminClient()

  const { data: file } = await ctx.supabase
    .from('shared_files')
    .select('file_url')
    .eq('id', id)
    .eq('tenant_id', ctx.tenant_id)
    .single()

  if (!file) return { error: 'Arquivo não encontrado' }

  const { error } = await ctx.supabase
    .from('shared_files')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenant_id)

  if (error) return { error: error.message }

  const match = file.file_url.match(/shared-files\/(.+?)(\?|$)/)
  if (match?.[1]) {
    await adminSupabase.storage.from('shared-files').remove([match[1]])
  }

  revalidatePath('/dashboard/arquivos')
  return { success: true }
}
