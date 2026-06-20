'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Tenant exercise (personal trainer) ──────────────────────────────────────

export async function createExercise(formData: FormData) {
  const supabase      = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role !== 'personal') return { error: 'Não autorizado' }

  const secondaryRaw = formData.get('secondary_muscles') as string | null
  const secondary    = secondaryRaw
    ? secondaryRaw.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const { data, error } = await supabase.from('exercises').insert({
    name:                 (formData.get('name')          as string).trim(),
    muscle_group:          formData.get('muscle_group')  as string,
    secondary_muscles:     secondary,
    instructions:         (formData.get('instructions')  as string | null) || null,
    video_url:            (formData.get('video_url')     as string | null) || null,
    video_path:           (formData.get('video_path')    as string | null) || null,
    load_type:             formData.get('load_type')     as string ?? 'bodyweight',
    count_type:            formData.get('count_type')    as string ?? 'reps',
    default_sets:          formData.get('default_sets')  ? Number(formData.get('default_sets'))  : null,
    default_reps:         (formData.get('default_reps')  as string | null) || null,
    default_duration_secs: formData.get('default_duration_secs')
      ? Number(formData.get('default_duration_secs'))
      : null,
    is_global:   false,
    tenant_id:   profile.tenant_id,
    created_by:  user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/banco-de-exercicios')
  return { success: true, id: data.id }
}

export async function updateExercise(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const secondaryRaw = formData.get('secondary_muscles') as string | null
  const secondary    = secondaryRaw
    ? secondaryRaw.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const { error } = await supabase
    .from('exercises')
    .update({
      name:                 (formData.get('name')          as string).trim(),
      muscle_group:          formData.get('muscle_group')  as string,
      secondary_muscles:     secondary,
      instructions:         (formData.get('instructions')  as string | null) || null,
      video_url:            (formData.get('video_url')     as string | null) || null,
      video_path:           (formData.get('video_path')    as string | null) || null,
      load_type:             formData.get('load_type')     as string,
      count_type:            formData.get('count_type')    as string,
      default_sets:          formData.get('default_sets')  ? Number(formData.get('default_sets'))  : null,
      default_reps:         (formData.get('default_reps')  as string | null) || null,
      default_duration_secs: formData.get('default_duration_secs')
        ? Number(formData.get('default_duration_secs'))
        : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/banco-de-exercicios')
  revalidatePath(`/dashboard/banco-de-exercicios/${id}`)
  return { success: true }
}

export async function deleteExercise(id: string, videoPath?: string | null) {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) return { error: error.message }

  if (videoPath) {
    await adminSupabase.storage.from('exercise-videos').remove([videoPath])
  }

  revalidatePath('/dashboard/banco-de-exercicios')
  return { success: true }
}

// ─── Global exercise (admin only) ────────────────────────────────────────────

export async function createGlobalExercise(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'global_admin') return { error: 'Não autorizado' }

  const secondaryRaw = formData.get('secondary_muscles') as string | null
  const secondary    = secondaryRaw
    ? secondaryRaw.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const { data, error } = await supabase.from('exercises').insert({
    name:                 (formData.get('name')          as string).trim(),
    muscle_group:          formData.get('muscle_group')  as string,
    secondary_muscles:     secondary,
    instructions:         (formData.get('instructions')  as string | null) || null,
    video_url:            (formData.get('video_url')     as string | null) || null,
    video_path:           (formData.get('video_path')    as string | null) || null,
    load_type:             formData.get('load_type')     as string ?? 'bodyweight',
    count_type:            formData.get('count_type')    as string ?? 'reps',
    default_sets:          formData.get('default_sets')  ? Number(formData.get('default_sets'))  : null,
    default_reps:         (formData.get('default_reps')  as string | null) || null,
    default_duration_secs: formData.get('default_duration_secs')
      ? Number(formData.get('default_duration_secs'))
      : null,
    is_global:  true,
    tenant_id:  null,
    created_by: user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/admin/banco-de-exercicios')
  revalidatePath('/dashboard/banco-de-exercicios')
  return { success: true, id: data.id }
}

export async function updateGlobalExercise(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'global_admin') return { error: 'Não autorizado' }

  const secondaryRaw = formData.get('secondary_muscles') as string | null
  const secondary    = secondaryRaw
    ? secondaryRaw.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const { error } = await supabase
    .from('exercises')
    .update({
      name:                 (formData.get('name')          as string).trim(),
      muscle_group:          formData.get('muscle_group')  as string,
      secondary_muscles:     secondary,
      instructions:         (formData.get('instructions')  as string | null) || null,
      video_url:            (formData.get('video_url')     as string | null) || null,
      video_path:           (formData.get('video_path')    as string | null) || null,
      load_type:             formData.get('load_type')     as string,
      count_type:            formData.get('count_type')    as string,
      default_sets:          formData.get('default_sets')  ? Number(formData.get('default_sets'))  : null,
      default_reps:         (formData.get('default_reps')  as string | null) || null,
      default_duration_secs: formData.get('default_duration_secs')
        ? Number(formData.get('default_duration_secs'))
        : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/banco-de-exercicios')
  revalidatePath('/dashboard/banco-de-exercicios')
  return { success: true }
}

export async function deleteGlobalExercise(id: string, videoPath?: string | null) {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .single()

  if (profile?.role !== 'global_admin') return { error: 'Não autorizado' }

  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) return { error: error.message }

  if (videoPath) {
    await adminSupabase.storage.from('exercise-videos').remove([videoPath])
  }

  revalidatePath('/admin/banco-de-exercicios')
  revalidatePath('/dashboard/banco-de-exercicios')
  return { success: true }
}
