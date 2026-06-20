'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES: Record<string, 'pdf' | 'image'> = {
  'application/pdf':  'pdf',
  'image/jpeg':       'image',
  'image/jpg':        'image',
  'image/png':        'image',
  'image/webp':       'image',
  'image/gif':        'image',
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

export async function uploadSharedFile(formData: FormData) {
  const ctx = await getPersonalCtx()
  if (!ctx) return { error: 'Não autorizado' }

  const adminSupabase = createAdminClient()

  const file       = formData.get('file') as File | null
  const title      = (formData.get('title') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const studentId  = (formData.get('student_id') as string | null) || null

  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado' }
  if (!title)                   return { error: 'Título obrigatório' }
  if (file.size > 20 * 1024 * 1024) return { error: 'Arquivo deve ter no máximo 20 MB' }

  const fileType = ALLOWED_TYPES[file.type]
  if (!fileType) return { error: 'Tipo de arquivo não suportado. Use PDF ou imagem (JPG, PNG, WEBP).' }

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${ctx.tenant_id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await adminSupabase.storage
    .from('shared-files')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (uploadError) return { error: `Erro no upload: ${uploadError.message}` }

  const { data: { publicUrl } } = adminSupabase.storage
    .from('shared-files')
    .getPublicUrl(path)

  const { error } = await ctx.supabase.from('shared_files').insert({
    tenant_id:   ctx.tenant_id,
    student_id:  studentId || null,
    title,
    description,
    file_url:    publicUrl,
    file_type:   fileType,
    file_name:   file.name,
    file_size:   file.size,
  })

  if (error) {
    await adminSupabase.storage.from('shared-files').remove([path])
    return { error: error.message }
  }

  revalidatePath('/dashboard/arquivos')
  return { success: true }
}

export async function deleteSharedFile(id: string) {
  const ctx = await getPersonalCtx()
  if (!ctx) return { error: 'Não autorizado' }

  const adminSupabase = createAdminClient()

  const { data: file } = await ctx.supabase
    .from('shared_files')
    .select('file_url, tenant_id')
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

  // Remove do storage
  const match = file.file_url.match(/shared-files\/(.+?)(\?|$)/)
  if (match?.[1]) {
    await adminSupabase.storage.from('shared-files').remove([match[1]])
  }

  revalidatePath('/dashboard/arquivos')
  return { success: true }
}
