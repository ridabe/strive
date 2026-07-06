'use client'

import { useEffect } from 'react'

// ScrollReveal — monta uma vez na página e observa todos os elementos marcados
// com `data-reveal`, adicionando `.reveal-in` quando entram na viewport
// (fade + slide-up sutil, uma única vez). Sem JS/observer, os elementos
// permanecem visíveis — o estado oculto só é aplicado sob `.reveal-ready`,
// garantindo conteúdo acessível a crawlers e a quem tem JS desligado.
export function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    )
    if (els.length === 0) return

    root.classList.add('reveal-ready')

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) {
      els.forEach((el) => el.classList.add('reveal-in'))
      return
    }

    // Itens já visíveis no carregamento entram imediatamente (sem flash).
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return null
}
