<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    color?: string
    maxRadius?: number
    duration?: number
    class?: string
    children?: Snippet
  }

  let { color = "#3DA5FF", maxRadius = 60, duration = 700, class: className, children }: Props = $props()

  let wrap = $state<HTMLElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  type Ripple = { x: number; y: number; t0: number }
  let ripples: Ripple[] = []
  let raf = 0
  let ro: ResizeObserver | null = null
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
    ripples = ripples.filter((r) => now - r.t0 < duration)
    ctx.strokeStyle = color
    for (const r of ripples) {
      const p = (now - r.t0) / duration
      ctx.globalAlpha = (1 - p) * 0.7
      ctx.lineWidth = 2 * (1 - p)
      ctx.beginPath()
      ctx.arc(r.x, r.y, p * maxRadius, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    raf = ripples.length ? requestAnimationFrame(frame) : 0
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

<!-- svelte-ignore a11y_no_static_element_interactions (ripple splash is cosmetic, not a required interaction) -->
<div bind:this={wrap} class={cn("relative overflow-hidden", className)} onpointermove={onMove}>
  {@render children?.()}
  <canvas bind:this={canvas} class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</div>
