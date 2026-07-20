<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    color?: string
    count?: number
    speed?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", count = 40, speed = 1, class: className, children }: Props = $props()

  let wrap = $state<HTMLElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  type Mote = { x: number; y: number; r: number; vx: number }
  let motes: Mote[] = []
  let raf = 0
  let ro: ResizeObserver | null = null
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
    motes = Array.from({ length: Math.max(1, Math.round(count)) }, () => ({
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
    ctx.fillStyle = color
    for (const m of motes) {
      m.y -= speed * (0.2 + m.r * 0.15)
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

  onMount(() => {
    resize()
    init()
    ro = new ResizeObserver(() => resize())
    if (wrap) ro.observe(wrap)
    if (!pixelPrefersReducedMotion()) raf = requestAnimationFrame(frame)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  })
</script>

<div bind:this={wrap} class={cn("relative overflow-hidden", className)}>
  {@render children?.()}
  <canvas bind:this={canvas} class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</div>
