import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  title: string
  subtitle: string
  children?: ReactNode
}

/**
 * Заголовок страницы: крупный сериф и 2px линейка под ним (Broadsheet).
 * При прокрутке «прилипает» к верху и сжимается; IntersectionObserver следит за
 * сентинелом над заголовком — без обработчика scroll.
 */
export function PageHeader({ title, subtitle, children }: Props) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { threshold: 1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="-mb-px h-px" />
      <header
        data-stuck={stuck || undefined}
        className={`sticky top-0 z-10 -mx-4 bg-paper px-4 lg:-mx-8 lg:px-8 ${
          stuck ? 'border-b border-rule py-2' : 'pt-0'
        }`}
      >
        <div
          className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-2 ${stuck ? '' : 'border-b-2 border-ink pb-4'}`}
        >
          <div className="min-w-0">
            <h1 className={stuck ? 'text-xl' : 'h1'}>{title}</h1>
            {!stuck && <p className="mt-1 text-meta">{subtitle}</p>}
          </div>
          {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
        </div>
      </header>
    </>
  )
}
