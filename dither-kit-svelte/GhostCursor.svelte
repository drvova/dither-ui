<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    color?: string
    count?: number
    size?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", count = 18, size = 10, class: className, children }: Props = $props()

  let wrap = $state<HTMLElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  const pts: { x: number; y: number }[] = []
  let raf = 0
  let ro: ResizeObserver | null = null
  const m = { x: 0, y: 0, active: false }

  function resize() {
    const c = canvas
    const w = wrap
    if (!c || !w) return
    const r = w.getBoundingClientRect()
    c.width = Math.max(1, r.width)
    c.height = Math.max(1, r.height)
  }
  function onMove(e: PointerEvent) {
    const r = wrap?.getBoundingClientRect()
    if (!r) return
    m.x = e.clientX - r.left
    m.y = e.clientY - r.top
    m.active = true
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const c = canvas
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    const head = pts[0] || { x: m.x, y: m.y }
    pts.unshift({ x: head.x + (m.x - head.x) * 0.5, y: head.y + (m.y - head.y) * 0.5 })
    if (pts.length > count) pts.pop()
    ctx.clearRect(0, 0, c.width, c.height)
    if (!m.active) return
    ctx.fillStyle = color
    for (let i = 0; i < pts.length; i++) {
      const a = 1 - i / pts.length
      ctx.globalAlpha = a * 0.8
      ctx.beginPath()
      ctx.arc(pts[i].x, pts[i].y, size * a, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  onMount(() => {
    resize()
    ro = new ResizeObserver(resize)
    if (wrap) ro.observe(wrap)
    if (!pixelPrefersReducedMotion()) raf = requestAnimationFrame(frame)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (pointer trail is cosmetic, not a required interaction) -->
<div
  bind:this={wrap}
  class={cn("relative overflow-hidden", className)}
  onpointermove={onMove}
  onpointerleave={() => (m.active = false)}
>
  {@render children?.()}
  <canvas bind:this={canvas} class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</div>
