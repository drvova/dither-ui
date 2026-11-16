import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type ClickSparkProps = {
  /** @docs string (hex) */
  color?: string
  count?: number
  /** @docs number (px) */
  size?: number
  /** @docs number (ms) */
  duration?: number
  class?: string
  /** @docs content */
  children?: JSX.Element
}

type Spark = { x: number; y: number; t0: number }

export default function ClickSpark(raw: ClickSparkProps) {
  const props = mergeProps({ color: "#7CFF67", count: 8, size: 16, duration: 420 }, raw)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let sparks: Spark[] = []
  let raf = 0
  let ro: ResizeObserver | null = null

  function resize() {
    const c = canvas
    const w = wrap
    if (!c || !w) return
    const r = w.getBoundingClientRect()
    c.width = Math.max(1, r.width)
    c.height = Math.max(1, r.height)
  }
  function onClick(e: MouseEvent) {
    if (pixelPrefersReducedMotion()) return
    const w = wrap
    if (!w) return
    const r = w.getBoundingClientRect()
    sparks.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now() })
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
    sparks = sparks.filter((s) => now - s.t0 < props.duration)
    ctx.strokeStyle = props.color
    ctx.lineWidth = 2
    for (const s of sparks) {
      const p = (now - s.t0) / props.duration
      const r0 = props.size * p
      const len = props.size * (1 - p) * 0.7
      ctx.globalAlpha = 1 - p
      for (let i = 0; i < props.count; i++) {
        const a = (i / props.count) * Math.PI * 2
        const x0 = s.x + Math.cos(a) * r0
        const y0 = s.y + Math.sin(a) * r0
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    raf = sparks.length ? requestAnimationFrame(frame) : 0
  }

  onMount(() => {
    resize()
    ro = new ResizeObserver(resize)
    if (wrap) ro.observe(wrap)
    onCleanup(() => {
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
    })
  })

  return (
    <div ref={(el) => (wrap = el)} class={cn("relative", props.class)} onClick={onClick}>
      {props.children}
      <canvas
        ref={(el) => (canvas = el)}
        class="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
    </div>
  )
}
