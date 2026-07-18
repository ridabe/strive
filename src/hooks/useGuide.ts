'use client'

// Hook do sistema de guia contextual por tela ("Guia do Max").
// Abre sozinho na primeira visita à tela (por guideKey + usuário), com opção de
// "não mostrar mais" (persistência 100% local, igual ao ModuleOnboardingPopup).

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GuideKey } from '@/lib/guides'

const dismissedKey = (guideKey: GuideKey, userId: string) =>
  `guide_dismissed_${guideKey}_${userId}`

export function useGuide(guideKey: GuideKey) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      setUserId(uid)

      let dismissed: string | null = null
      try {
        dismissed = localStorage.getItem(dismissedKey(guideKey, uid))
      } catch {
        return // localStorage indisponível — não exibe sozinho
      }
      if (!dismissed) setOpen(true)
    })
  }, [guideKey])

  const close = useCallback(() => setOpen(false), [])

  const openGuide = useCallback(() => setOpen(true), [])

  const dismissForever = useCallback(() => {
    if (userId) {
      try {
        localStorage.setItem(dismissedKey(guideKey, userId), '1')
      } catch {
        /* ignore */
      }
    }
    setOpen(false)
  }, [guideKey, userId])

  return { open, close, openGuide, dismissForever }
}
