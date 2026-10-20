import { afterEach, describe, expect, it, vi } from 'vitest'
import { installReveal, scrollProgress } from './reveal'

describe('scrollProgress', () => {
  it('0 в начале, 1 в конце, 0 если прокручивать нечего', () => {
    expect(scrollProgress(0, 2000, 800)).toBe(0)
    expect(scrollProgress(1200, 2000, 800)).toBe(1)
    expect(scrollProgress(600, 2000, 800)).toBeCloseTo(0.5)
    expect(scrollProgress(0, 500, 800)).toBe(0)
    expect(scrollProgress(99999, 2000, 800)).toBe(1) // перескролл (bounce) не выходит за 1
  })
})

describe('installReveal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('без IntersectionObserver показывает всё сразу, в том числе добавленное позже', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    document.body.innerHTML = '<ul><li class="reveal">a</li></ul>'
    const stop = installReveal(document.body)
    expect(document.querySelector('li')!.classList.contains('is-visible')).toBe(true)

    const li = document.createElement('li')
    li.className = 'reveal'
    document.querySelector('ul')!.append(li)
    await Promise.resolve() // MutationObserver срабатывает микрозадачей
    expect(li.classList.contains('is-visible')).toBe(true)
    stop()
  })

  it('с IntersectionObserver показывает элемент только при входе во вьюпорт', () => {
    let callback: IntersectionObserverCallback = () => {}
    const observed: Element[] = []
    const unobserve = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb
        }
        observe(el: Element) {
          observed.push(el)
        }
        unobserve = unobserve
        disconnect = vi.fn()
      },
    )
    document.body.innerHTML = '<div class="reveal" id="x">a</div>'
    const stop = installReveal(document.body)
    const el = document.getElementById('x')!
    expect(observed).toContain(el)
    expect(el.classList.contains('is-visible')).toBe(false)

    const entry = (isIntersecting: boolean) => [
      { target: el, isIntersecting } as unknown as IntersectionObserverEntry,
    ]
    callback(entry(false), {} as IntersectionObserver)
    expect(el.classList.contains('is-visible')).toBe(false)
    callback(entry(true), {} as IntersectionObserver)
    expect(el.classList.contains('is-visible')).toBe(true)
    expect(unobserve).toHaveBeenCalledWith(el) // один раз показали — больше не следим
    stop()
  })
})
