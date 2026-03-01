import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─── Config ───────────────────────────────────────────────────────────────────

const PARTICLE_COUNT = 80
const COLORS         = ['#FFD700', '#52B788', '#95D5B2', '#FFD700', '#2D6A4F', '#ffffff']
const DURATION_MS    = 3000
const FADE_AFTER_MS  = DURATION_MS - 800   // fade starts at 2200ms

// ─── OakConfetti ─────────────────────────────────────────────────────────────

export default function OakConfetti({ onComplete }) {
  const canvasRef      = useRef(null)
  const onCompleteRef  = useRef(onComplete)

  // Keep ref current without re-triggering animation effect
  useEffect(() => { onCompleteRef.current = onComplete })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    // Build particles
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:           Math.random() * canvas.width,
      y:           -10 - Math.random() * 60,
      size:        4 + Math.random() * 6,
      speed:       2 + Math.random() * 4,
      rotation:    Math.random() * Math.PI * 2,
      rotSpeed:    (Math.random() - 0.5) * 0.15,
      wobble:      Math.random() * Math.PI * 2,
      wobbleSpeed: 0.04 + Math.random() * 0.03,
      wobbleAmp:   20 + Math.random() * 30,
      color:       COLORS[Math.floor(Math.random() * COLORS.length)],
      isRect:      Math.random() > 0.5,
    }))

    const startTime = performance.now()
    let rafId

    function draw(now) {
      const elapsed = now - startTime

      // Fade out over the last 800ms
      const opacity = elapsed > FADE_AFTER_MS
        ? Math.max(0, 1 - (elapsed - FADE_AFTER_MS) / 800)
        : 1
      canvas.style.opacity = String(opacity)

      if (elapsed >= DURATION_MS) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.y        += p.speed
        p.wobble   += p.wobbleSpeed
        p.rotation += p.rotSpeed

        // Wrap back to top when below screen
        if (p.y > canvas.height + 20) p.y = -10

        const px = p.x + Math.sin(p.wobble) * p.wobbleAmp

        ctx.save()
        ctx.translate(px, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color

        if (p.isRect) {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    const timer = setTimeout(() => onCompleteRef.current?.(), DURATION_MS)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timer)
    }
  }, []) // runs once on mount — onComplete kept fresh via ref above

  return createPortal(
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        9999,
      }}
    />,
    document.body
  )
}
