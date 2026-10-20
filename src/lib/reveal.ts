/**
 * Появление элементов при прокрутке (DESIGN.md, Do #12).
 * Чистая DOM-логика без React: наблюдает за всеми `.reveal` в поддереве,
 * включая добавленные позже (MutationObserver), и ставит `is-visible`,
 * когда элемент входит в вьюпорт. Без IntersectionObserver (старые браузеры,
 * jsdom) всё показывается сразу — анимация не должна прятать контент.
 */
export function installReveal(root: ParentNode = document.body): () => void {
  const all = () => Array.from(root.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'))

  if (typeof IntersectionObserver === 'undefined') {
    const showAll = () => all().forEach((el) => el.classList.add('is-visible'))
    showAll()
    const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(showAll)
    mo?.observe(root, { childList: true, subtree: true })
    return () => mo?.disconnect()
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('is-visible')
        io.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  )
  const observeNew = () => all().forEach((el) => io.observe(el))
  observeNew()
  const mo = new MutationObserver(observeNew)
  mo.observe(root, { childList: true, subtree: true })
  return () => {
    mo.disconnect()
    io.disconnect()
  }
}

/** Доля прокрученного документа 0…1 для полосы прогресса чтения */
export function scrollProgress(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const max = scrollHeight - clientHeight
  if (max <= 0) return 0
  return Math.min(1, Math.max(0, scrollTop / max))
}
