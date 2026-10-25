'use client'

import { useEffect } from 'react'

/** Adds a gentle reveal when content enters the viewport while scrolling. */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const selector = [
      '[data-scroll-reveal]',
      'main > section',
      'main > div > section',
      'main article',
      'main [data-scroll-animate]',
    ].join(',')

    const seen = new WeakSet<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -35px 0px' },
    )

    const scan = (root: ParentNode = document) => {
      root.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return
        seen.add(element)
        element.classList.add('scroll-reveal')
        observer.observe(element)
      })
    }

    scan()
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scan(node)
        })
      })
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return null
}
