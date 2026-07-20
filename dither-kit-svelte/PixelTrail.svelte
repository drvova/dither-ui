<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    color?: string
    gap?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", gap = 24, class: className, children }: Props = $props()

  let wrap = $state<HTMLElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  const lit = new Map<string, number>()
  const LIFE = 650
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
  function onMove(e: PointerEvent) {
    if (pixelPrefersReducedMotion()) return
    const r = wrap?.getBoundingClientRect()
    if (!r) return
    const cx = Math.floor((e.clientX - r.left) / gap)
    const cy = Math.floor((e.clientY - r.top) / gap)
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
    ctx.fillStyle = color
    const s = gap * 0.7
    for (const [k, t] of lit) {
      const age = now - t
      if (age > LIFE) {
        lit.delete(k)
        continue
      }
      const [cx, cy] = k.split(",").map(Number)
      ctx.globalAlpha = 1 - age / LIFE
      ctx.fillRect(cx * gap + (gap - s) / 2, cy * gap + (gap - s) / 2, s, s)
    }
    ctx.globalAlpha = 1
    raf = lit.size ? requestAnimationFrame(frame) : 0
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
