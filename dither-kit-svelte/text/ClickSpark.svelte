<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    color?: string
    count?: number
    size?: number
    duration?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", count = 8, size = 16, duration = 420, class: className, children }: Props = $props()

  let wrap = $state<HTMLElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  type Spark = { x: number; y: number; t0: number }
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
    sparks = sparks.filter((s) => now - s.t0 < duration)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    for (const s of sparks) {
      const p = (now - s.t0) / duration
      const r0 = size * p
      const len = size * (1 - p) * 0.7
      ctx.globalAlpha = 1 - p
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2
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
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (spark burst is cosmetic, not a required interaction) -->
<!-- svelte-ignore a11y_click_events_have_key_events (decorative spark overlay; content stays keyboard-usable) -->
<div bind:this={wrap} class={cn("relative", className)} onclick={onClick}>
  {@render children?.()}
  <canvas bind:this={canvas} class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</div>
