import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type PixelTrailProps = {
  /** @docs string (hex) */
  color?: string
  /** @docs number (px) */
  gap?: number
  class?: string
  /** @docs content */
  children?: JSX.Element
}

const LIFE = 650

export default function PixelTrail(raw: PixelTrailProps) {
  const props = mergeProps({ color: "#7CFF67", gap: 24 }, raw)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const lit = new Map<string, number>()
  let raf = 0

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
    const cx = Math.floor((e.clientX - r.left) / props.gap)
    const cy = Math.floor((e.clientY - r.top) / props.gap)
    lit.set(`${cx},${cy}`, performance.now())
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
    ctx.fillStyle = props.color
    const s = props.gap * 0.7
    for (const [k, t] of lit) {
      const age = now - t
      if (age > LIFE) {
        lit.delete(k)
        continue
      }
      const [cx, cy] = k.split(",").map(Number)
      ctx.globalAlpha = 1 - age / LIFE
      ctx.fillRect(cx * props.gap + (props.gap - s) / 2, cy * props.gap + (props.gap - s) / 2, s, s)
    }
    ctx.globalAlpha = 1
    raf = lit.size ? requestAnimationFrame(frame) : 0
  }

  onMount(() => {
    resize()
    const ro = new ResizeObserver(resize)
    if (wrap) ro.observe(wrap)
    onCleanup(() => ro.disconnect())
  })
  onCleanup(() => {
    if (raf) cancelAnimationFrame(raf)
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
