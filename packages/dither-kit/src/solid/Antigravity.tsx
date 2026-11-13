import { createEffect, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { createInviewLoop } from "./runtime/in-view"

export type AntigravityProps = {
  color?: string
  count?: number
  speed?: number
  class?: string
  children?: JSX.Element
}

type Mote = { x: number; y: number; r: number; vx: number }

export default function Antigravity(raw: AntigravityProps) {
  const props = mergeProps({ color: "#7CFF67", count: 40, speed: 1 }, raw)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let motes: Mote[] = []
  let raf = 0
  let W = 1
  let H = 1

  function resize() {
    const c = canvas
    const w = wrap
    if (!c || !w) return
    const r = w.getBoundingClientRect()
    W = c.width = Math.max(1, r.width)
    H = c.height = Math.max(1, r.height)
  }
  function init() {
    motes = Array.from({ length: Math.max(1, Math.round(props.count)) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.3,
    }))
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const c = canvas
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = props.color
    for (const m of motes) {
      m.y -= props.speed * (0.2 + m.r * 0.15)
      m.x += m.vx + Math.sin(m.y * 0.03) * 0.3
      if (m.y < -m.r) {
        m.y = H + m.r
        m.x = Math.random() * W
      }
      ctx.globalAlpha = 0.3 + m.r * 0.2
      ctx.beginPath()
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  function start() {
    if (raf || pixelPrefersReducedMotion()) return
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    if (!raf) return
    cancelAnimationFrame(raf)
    raf = 0
  }

  onMount(() => {
    resize()
    createEffect(on(() => props.count, init))
    const ro = new ResizeObserver(() => resize())
    if (wrap) ro.observe(wrap)
    onCleanup(() => ro.disconnect())
  })
  createInviewLoop(() => wrap, start, stop)

  return (
    <div ref={(el) => (wrap = el)} class={cn("relative overflow-hidden", props.class)}>
      {props.children}
      <canvas
        ref={(el) => (canvas = el)}
        class="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
    </div>
  )
}
