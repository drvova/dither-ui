import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type SplashCursorProps = {
  color?: string
  maxRadius?: number
  duration?: number
  class?: string
  children?: JSX.Element
}

type Ripple = { x: number; y: number; t0: number }

export default function SplashCursor(raw: SplashCursorProps) {
  const props = mergeProps({ color: "#3DA5FF", maxRadius: 60, duration: 700 }, raw)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let ripples: Ripple[] = []
  let raf = 0
  let last = { x: 0, y: 0 }

  function resize() {
    const c = canvas
    const w = wrap
    if (!c || !w) return
    const r = w.getBoundingClientRect()
    c.width = Math.max(1, r.width)
    c.height = Math.max(1, r.height)
  }
  function onMove(e: PointerEvent) {
    if (pixelPrefersReducedMotion()) return
    const r = wrap?.getBoundingClientRect()
    if (!r) return
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (Math.hypot(x - last.x, y - last.y) < 22) return
    last = { x, y }
    ripples.push({ x, y, t0: performance.now() })
    if (!raf) raf = requestAnimationFrame(frame)
  }
  function frame(now: number) {
    const c = canvas
    const ctx = c?.getContext("2d")
    if (!c || !ctx) {
      raf = 0
      return
    }
    ctx.clearRect(0, 0, c.width, c.height)
    ripples = ripples.filter((r) => now - r.t0 < props.duration)
    ctx.strokeStyle = props.color
    for (const r of ripples) {
      const p = (now - r.t0) / props.duration
      ctx.globalAlpha = (1 - p) * 0.7
      ctx.lineWidth = 2 * (1 - p)
      ctx.beginPath()
      ctx.arc(r.x, r.y, p * props.maxRadius, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    raf = ripples.length ? requestAnimationFrame(frame) : 0
  }

  onMount(() => {
    resize()
    const ro = new ResizeObserver(resize)
    if (wrap) ro.observe(wrap)
    onCleanup(() => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
    })
  })

  return (
    <div ref={(el) => (wrap = el)} class={cn("relative overflow-hidden", props.class)} onPointerMove={onMove}>
      {props.children}
      <canvas
        ref={(el) => (canvas = el)}
        class="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
    </div>
  )
}
