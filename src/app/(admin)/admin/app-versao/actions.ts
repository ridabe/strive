'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateAppVersion(platform: 'android' | 'ios', formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'global_admin') return { error: 'Não autorizado' }

  const current_version      = (formData.get('current_version') as string).trim()
  const current_version_code = parseInt(formData.get('current_version_code') as string)
  const min_version_code     = parseInt(formData.get('min_version_code') as string)
  const force_update         = formData.get('force_update') === 'true'
  const show_install_prompt  = formData.get('show_install_prompt') === 'true'
  const store_url            = (formData.get('store_url') as string).trim() || null
  const release_notes        = (formData.get('release_notes') as string).trim() || null

  if (!current_version || isNaN(current_version_code) || isNaN(min_version_code)) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }
  if (min_version_code > current_version_code) {
    return { error: 'A versão mínima não pode ser maior que a versão atual.' }
  }

  const { error } = await supabase
    .from('app_versions')
    .update({
      current_version,
      current_version_code,
      min_version_code,
      force_update,
      show_install_prompt,
      store_url,
      release_notes,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('platform', platform)

  if (error) return { error: error.message }

  revalidatePath('/admin/app-versao')
  return { success: true }
}
