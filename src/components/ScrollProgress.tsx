import { useEffect, useState } from 'react'
import { scrollProgress } from '../lib/reveal'

/** Полоса прогресса чтения страницы — 2px чёрная линейка вверху (DESIGN.md, Do #12) */
export function ScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const d = document.documentElement
      setP(scrollProgress(window.scrollY, d.scrollHeight, d.clientHeight))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-ink transition-transform duration-150 ease-out"
      style={{ transform: `scaleX(${p})` }}
    />
  )
}
