<script lang="ts">
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    color?: string
    gap?: number
    lineLength?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", gap = 28, lineLength = 14, class: className, children }: Props = $props()

  let wrap = $state<HTMLElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  let ro: ResizeObserver | null = null
  let W = 1
  let H = 1
  const m = { x: 0.5, y: 0.5 }

  function draw() {
    const c = canvas
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    const half = lineLength / 2
    for (let y = gap / 2; y < H; y += gap) {
      for (let x = gap / 2; x < W; x += gap) {
        const a = Math.atan2(m.y - y, m.x - x)
        const dx = Math.cos(a) * half
        const dy = Math.sin(a) * half
        ctx.beginPath()
        ctx.moveTo(x - dx, y - dy)
        ctx.lineTo(x + dx, y + dy)
        ctx.stroke()
      }
    }
  }
  function resize() {
    const c = canvas
    const w = wrap
    if (!c || !w) return
    const r = w.getBoundingClientRect()
    W = c.width = Math.max(1, r.width)
    H = c.height = Math.max(1, r.height)
    if (m.x <= 1) {
      m.x = W / 2
      m.y = H / 2
    }
    draw()
  }
  function onMove(e: PointerEvent) {
    const r = wrap?.getBoundingClientRect()
    if (!r) return
    m.x = e.clientX - r.left
    m.y = e.clientY - r.top
    draw()
  }

  onMount(() => {
    resize()
    ro = new ResizeObserver(() => resize())
    if (wrap) ro.observe(wrap)
    return () => ro?.disconnect()
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (pointer field is cosmetic, not a required interaction) -->
<div bind:this={wrap} class={cn("relative overflow-hidden", className)} onpointermove={onMove}>
  {@render children?.()}
  <canvas bind:this={canvas} class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</div>
