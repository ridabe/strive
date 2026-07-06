'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction, AuditActions } from '@/lib/admin/audit'

/** Extrai o ID do vídeo de qualquer formato de URL do YouTube. */
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function updateHomeVideo(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'global_admin') return { error: 'Não autorizado' }

  const rawUrl = (formData.get('youtube_url') as string ?? '').trim()
  const title  = (formData.get('title') as string ?? '').trim() || null

  let youtube_url: string | null = null

  if (rawUrl) {
    const videoId = extractYoutubeId(rawUrl)
    if (!videoId) {
      return { error: 'URL do YouTube inválida. Use um link como https://www.youtube.com/watch?v=XXXXXXXXXXX ou https://youtu.be/XXXXXXXXXXX' }
    }
    youtube_url = rawUrl
  }

  const { error } = await supabase
    .from('home_video_config')
    .update({
      youtube_url,
      title,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', true)

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.SYSTEM_CONFIG_UPDATED,
    category: 'system',
    description: youtube_url
      ? 'Vídeo da home atualizado'
      : 'Vídeo da home removido',
    targetType: 'home_video_config',
    metadata: { youtube_url, title },
  })

  revalidatePath('/admin/video-home')
  revalidatePath('/')
  return { success: true }
}

export async function clearHomeVideo() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'global_admin') return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('home_video_config')
    .update({
      youtube_url: null,
      title: null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', true)

  if (error) return { error: error.message }

  await logAdminAction({
    action: AuditActions.SYSTEM_CONFIG_UPDATED,
    category: 'system',
    description: 'Vídeo da home removido',
    targetType: 'home_video_config',
  })

  revalidatePath('/admin/video-home')
  revalidatePath('/')
  return { success: true }
}
