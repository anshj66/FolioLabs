'use client'

import { useEffect, useRef } from 'react'

/** Minimal circular cursor with a soft scroll pulse. No page-wide background effect. */
export function DotGridCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const finePointer = window.matchMedia('(pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reducedMotion.matches) return

    document.documentElement.classList.add('has-circular-cursor')

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = window.innerWidth
    let height = window.innerHeight
    let raf = 0
    let active = false
    let visible = !document.hidden
    let targetX = -100
    let targetY = -100
    let currentX = targetX
    let currentY = targetY
    let lastMove = 0
    let scrollPulse = 0
    let pointerDown = false
    let overInteractive = false

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      schedule()
    }

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(draw)
    }

    const draw = (now: number) => {
      raf = 0
      if (!visible) return
      ctx.clearRect(0, 0, width, height)
      currentX += (targetX - currentX) * 0.36
      currentY += (targetY - currentY) * 0.36
      scrollPulse *= 0.9

      if (active) {
        const baseRadius = overInteractive ? 15 : 11
        const radius = baseRadius + (pointerDown ? -2 : 0)
        const pulseRadius = radius + 8 + (1 - scrollPulse) * 3

        // A restrained pulse is emitted around the cursor while scrolling.
        if (scrollPulse > 0.025) {
          ctx.beginPath()
          ctx.arc(currentX, currentY, pulseRadius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(165, 243, 207, ${scrollPulse * 0.22})`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Main circular outline.
        ctx.beginPath()
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = overInteractive ? 'rgba(196, 255, 224, 0.98)' : 'rgba(165, 243, 207, 0.92)'
        ctx.lineWidth = 1.35
        ctx.stroke()

        // Tiny center point keeps the cursor precise without a bulky shape.
        ctx.beginPath()
        ctx.arc(currentX, currentY, pointerDown ? 1.5 : 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(196, 255, 224, 0.98)'
        ctx.fill()
      }

      if (active && (now - lastMove < 900 || scrollPulse > 0.025)) schedule()
    }

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      lastMove = performance.now()
      active = true
      const target = event.target
      overInteractive = target instanceof Element && Boolean(target.closest('a,button,[role="button"],input,textarea,select,label'))
      canvas.style.opacity = '1'
      schedule()
    }

    const onLeave = () => {
      active = false
      canvas.style.opacity = '0'
      if (raf) window.cancelAnimationFrame(raf)
      raf = 0
      ctx.clearRect(0, 0, width, height)
    }

    const onDown = () => { pointerDown = true; schedule() }
    const onUp = () => { pointerDown = false; schedule() }
    const onScroll = () => {
      scrollPulse = 1
      if (active) schedule()
    }
    const onVisibility = () => {
      visible = !document.hidden
      if (visible && active) schedule()
      else if (raf) {
        window.cancelAnimationFrame(raf)
        raf = 0
      }
    }

    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    resize()

    return () => {
      document.documentElement.classList.remove('has-circular-cursor')
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={canvasRef} className="circular-cursor" aria-hidden="true" />
}
