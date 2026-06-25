'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Busca o contexto do aluno autenticado ────────────────────────────────────
async function getStudentCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!student) return null
  return { supabase, student }
}

// ─── Criar registro de progresso ──────────────────────────────────────────────
export async function createProgressEntry(formData: FormData) {
  const ctx = await getStudentCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { supabase, student } = ctx
  const adminSupabase = createAdminClient()

  const recorded_at =
    String(formData.get('recorded_at') || '').trim() ||
    new Date().toISOString().split('T')[0]

  const weightRaw = formData.get('weight')
  const weight =
    weightRaw !== null && weightRaw !== ''
      ? parseFloat(String(weightRaw))
      : null

  const notes = String(formData.get('notes') || '').trim() || null
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter((f) => f instanceof File && f.size > 0)

  if (weight === null && !notes && validPhotos.length === 0) {
    return { error: 'Adicione pelo menos o peso, uma nota ou uma foto.' }
  }

  // Upload de fotos
  const photoUrls: string[] = []
  for (const photo of validPhotos.slice(0, 5)) {
    if (photo.size > 5 * 1024 * 1024) {
      return { error: 'Cada foto deve ter no máximo 5 MB.' }
    }
    const ext = photo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) continue

    const path = `${student.tenant_id}/${student.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await adminSupabase.storage
      .from('progress-photos')
      .upload(path, await photo.arrayBuffer(), { contentType: photo.type })

    if (uploadError) return { error: `Erro no upload: ${uploadError.message}` }

    const { data: { publicUrl } } = adminSupabase.storage
      .from('progress-photos')
      .getPublicUrl(path)

    photoUrls.push(publicUrl)
  }

  const { error } = await supabase.from('student_progress').insert({
    student_id:  student.id,
    tenant_id:   student.tenant_id,
    recorded_at,
    weight:      weight !== null && !isNaN(weight) ? weight : null,
    notes,
    photo_urls:  photoUrls,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/progresso')
  return { success: true }
}

// ─── Excluir registro de progresso ───────────────────────────────────────────
export async function deleteProgressEntry(entryId: string) {
  const ctx = await getStudentCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { supabase, student } = ctx
  const adminSupabase = createAdminClient()

  // Pega URLs das fotos antes de deletar para limpeza do storage
  const { data: entry } = await supabase
    .from('student_progress')
    .select('photo_urls')
    .eq('id', entryId)
    .eq('student_id', student.id)
    .single()

  const { error } = await supabase
    .from('student_progress')
    .delete()
    .eq('id', entryId)
    .eq('student_id', student.id)

  if (error) return { error: error.message }

  // Remove fotos do storage
  const urls = entry?.photo_urls ?? []
  if (urls.length > 0) {
    const paths = urls
      .map((url: string) => {
        const match = url.match(/progress-photos\/(.+?)(\?|$)/)
        return match ? match[1] : null
      })
      .filter((p: string | null): p is string => p !== null)

    if (paths.length > 0) {
      await adminSupabase.storage.from('progress-photos').remove(paths)
    }
  }

  revalidatePath('/student/progresso')
  return { success: true }
}
