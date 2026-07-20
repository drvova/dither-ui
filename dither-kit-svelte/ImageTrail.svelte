<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    colors?: string[]
    size?: number
    duration?: number
    class?: string
    children?: Snippet
  }

  let {
    colors = ["#5227FF", "#7CFF67", "#3DA5FF", "#FF3D2E", "#FFD23D"],
    size = 40,
    duration = 650,
    class: className,
    children,
  }: Props = $props()

  let wrap = $state<HTMLElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  type Tile = { x: number; y: number; t0: number; color: string; rot: number }
  let tiles: Tile[] = []
  let raf = 0
  let ro: ResizeObserver | null = null
  let last = { x: 0, y: 0 }
  let ci = 0

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
    if (Math.hypot(x - last.x, y - last.y) < size * 0.6) return
    last = { x, y }
    const palette = colors.length ? colors : ["#7CFF67"]
    tiles.push({ x, y, t0: performance.now(), color: palette[ci % palette.length], rot: (Math.random() - 0.5) * 0.6 })
    ci++
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
    tiles = tiles.filter((t) => now - t.t0 < duration)
    for (const t of tiles) {
      const p = (now - t.t0) / duration
      const s = size * (1 - p * 0.4)
      ctx.save()
      ctx.translate(t.x, t.y)
      ctx.rotate(t.rot)
      ctx.globalAlpha = 1 - p
      ctx.fillStyle = t.color
      ctx.fillRect(-s / 2, -s / 2, s, s)
      ctx.restore()
    }
    ctx.globalAlpha = 1
    raf = tiles.length ? requestAnimationFrame(frame) : 0
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

<!-- svelte-ignore a11y_no_static_element_interactions (pointer trail is cosmetic, not a required interaction) -->
<div bind:this={wrap} class={cn("relative overflow-hidden", className)} onpointermove={onMove}>
  {@render children?.()}
  <canvas bind:this={canvas} class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</div>
