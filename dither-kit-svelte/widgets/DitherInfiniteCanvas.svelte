<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  /** Pannable, zoomable work surface — drag to pan, wheel to zoom toward the
   * cursor, the dotted field rides the same transform so space feels real.
   * Content lives in the children snippet at world coordinates. */
  type Props = {
    /** Zoom (bindable). */
    zoom?: number
    minZoom?: number
    maxZoom?: number
    pattern?: "dots" | "grid" | "plain"
    /** Pattern pitch at zoom 1, CSS px. */
    cell?: number
    label?: string
    class?: string
    children?: Snippet
  }

  let {
    zoom = $bindable(1),
    minZoom = 0.25,
    maxZoom = 3,
    pattern = "dots",
    cell = 16,
    label = "Infinite canvas",
    class: className,
    children,
  }: Props = $props()

  let el = $state<HTMLDivElement | null>(null)
  let tx = $state(0)
  let ty = $state(0)
  let panning = $state(false)
  let pointerId = -1
  let lastX = 0
  let lastY = 0

  function down(e: PointerEvent) {
    if (e.button !== 0) return
    panning = true
    pointerId = e.pointerId
    lastX = e.clientX
    lastY = e.clientY
    el?.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!panning || e.pointerId !== pointerId) return
    tx += e.clientX - lastX
    ty += e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
  }
  function up(e: PointerEvent) {
    if (e.pointerId === pointerId) panning = false
  }
  /** Wheel zoom anchored to the cursor: the world point under it stays put. */
  function wheel(e: WheelEvent) {
    e.preventDefault()
    const r = el?.getBoundingClientRect()
    if (!r) return
    const next = Math.min(maxZoom, Math.max(minZoom, zoom * Math.exp(-e.deltaY * 0.0015)))
    const k = next / zoom
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    tx = cx - (cx - tx) * k
    ty = cy - (cy - ty) * k
    zoom = next
  }

  const layerStyle = $derived.by(() => {
    const c = `${cell * zoom}px ${cell * zoom}px`
    if (pattern === "dots")
      return `background-image: radial-gradient(var(--border) 1px, transparent 1px); background-size: ${c};`
    if (pattern === "grid")
      return `background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: ${c};`
    return ""
  })
</script>

<div
  bind:this={el}
  role="group"
  aria-label={label}
  class={cn(
    "relative touch-none overflow-hidden bg-background/40 select-none",
    panning ? "cursor-grabbing" : "cursor-grab",
    className
  )}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  onwheel={wheel}
>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 opacity-40"
    style={`${layerStyle} background-position: ${tx}px ${ty}px;`}
  ></div>
  <div class="absolute top-0 left-0 origin-top-left" style:transform={`translate(${tx}px, ${ty}px) scale(${zoom})`}>
    {@render children?.()}
  </div>
</div>
