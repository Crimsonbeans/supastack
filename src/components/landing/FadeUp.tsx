'use client'

import { useEffect, useRef } from 'react'

export function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        })
      },
      { threshold: 0.1 }
    )

    const container = ref.current
    if (container) {
      container.querySelectorAll('.fade-up').forEach((el) => observer.observe(el))
    }

    return () => observer.disconnect()
  }, [])

  return ref
}

export function useHeroFadeUp() {
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('#hero .fade-up').forEach((el) => el.classList.add('visible'))
    }, 50)
    return () => clearTimeout(timer)
  }, [])
}
