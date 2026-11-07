<script lang="ts">
  import { cn } from "../runtime/lib"
  import { fillOf, pixelPrefersReducedMotion, type PixelColor } from "../engine/pixel"
  import { paintScope, SCOPE_DIVISIONS, type ScopeSignal } from "../engine/scope"
  import { useDitherMatrix } from "../runtime/screen"
  import { paintOnResize, type CanvasPaint } from "../runtime/canvas-mount"

  /** Scope: an oscilloscope screen tracing a signal (`role="img"`). A named
   * wave (`sine`, `square`, `triangle`, `saw`) drifts at `speed` cycles a
   * second with an afterglow of its earlier phases; samples (-1..1 across the
   * screen) trace as given, repainted when they change. The beam prints
   * through the threshold matrix, bright where it moves slowly and faint on
   * its edges, over a graticule of 10 by 8 divisions. Under reduced motion,
   * or off screen, the wave holds still. 5:4, as wide as its box. */
  type Props = {
    signal?: ScopeSignal
    /** Cycles of a named wave across the screen. */
    cycles?: number
    /** Cycles a second a named wave drifts; 0 holds it. */
    speed?: number
    /** The trace's height, 1 filling the screen. */
    gain?: number
    /** The trail of earlier phases, 0 (none) to 1. */
    afterglow?: number
    /** What it traces (also its accessible name). */
    label?: string
    color?: PixelColor
    seed?: number
    class?: string
  }

  let {
    signal = "sine",
    cycles = 2,
    speed = 0.5,
    gain = 0.8,
    afterglow = 0.6,
    label,
    color = "green",
    seed,
    class: className,
  }: Props = $props()

  const CELL = 2
  const FRAME_MS = 33
  const [ACROSS, UP] = SCOPE_DIVISIONS
  const matrixFor = useDitherMatrix()

  let phase = $state(0)

  /** The drift: a frame every FRAME_MS while the screen is seen, the wave
   * named, its speed not 0 and motion allowed (the action's update re-reads). */
  function drift(node: HTMLElement, rate: number) {
    let raf = 0
    let last = 0
    let seen = typeof IntersectionObserver === "undefined"
    const moving = () => typeof signal === "string" && rate !== 0 && !pixelPrefersReducedMotion()
    const frame = (now: number) => {
      raf = 0
      if (!seen || !moving()) return
      if (now - last >= FRAME_MS) {
        last = now
        phase = (now / 1000) * rate
      }
      raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      if (!raf && seen && moving()) raf = requestAnimationFrame(frame)
    }
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            seen = entry?.isIntersecting ?? true
            wake()
          })
    io?.observe(node)
    wake()
    return {
      update(next: number) {
        rate = next
        wake()
      },
      destroy() {
        io?.disconnect()
        if (raf) cancelAnimationFrame(raf)
      },
    }
  }

  const paint = $derived<CanvasPaint>((canvas, host) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const w = Math.max(20, Math.round(host.getBoundingClientRect().width / CELL))
    const h = Math.round((w * UP) / ACROSS)
    canvas.width = w
    canvas.height = h
    paintScope(ctx, w, h, fillOf(color), { signal, cycles, phase, gain, afterglow }, matrixFor(seed))
  })

  /** The graticule: a line on each division, the centre axes ticked in fifths. */
  const across = Array.from({ length: ACROSS - 1 }, (_, i) => (i + 1) * 10).filter((x) => x !== 50)
  const up = Array.from({ length: UP - 1 }, (_, i) => (i + 1) * 10).filter((y) => y !== 40)
  const ticksX = Array.from({ length: ACROSS * 5 - 1 }, (_, i) => (i + 1) * 2)
  const ticksY = Array.from({ length: UP * 5 - 1 }, (_, i) => (i + 1) * 2)
  const name = $derived(label ?? (typeof signal === "string" ? `${signal} wave` : "Signal"))
</script>

<div
  use:drift={speed}
  role="img"
  aria-label={name}
  class={cn("relative aspect-[5/4] w-full overflow-hidden text-foreground", className)}
>
  <canvas
    use:paintOnResize={paint}
    aria-hidden="true"
    class="absolute inset-0 h-full w-full"
    style="image-rendering: pixelated"
  ></canvas>
  <svg viewBox="0 0 100 80" aria-hidden="true" class="absolute inset-0 h-full w-full font-mono">
    <g stroke="currentColor" stroke-width="0.25" opacity="0.18">
      {#each across as x (x)}<line x1={x} y1="0" x2={x} y2="80" />{/each}
      {#each up as y (y)}<line x1="0" y1={y} x2="100" y2={y} />{/each}
    </g>
    <g stroke="currentColor" stroke-width="0.3" opacity="0.4">
      <line x1="50" y1="0" x2="50" y2="80" />
      <line x1="0" y1="40" x2="100" y2="40" />
      {#each ticksX as x (x)}<line x1={x} y1="39.2" x2={x} y2="40.8" />{/each}
      {#each ticksY as y (y)}<line x1="49.2" y1={y} x2="50.8" y2={y} />{/each}
    </g>
    {#if label}
      <text x="3" y="6" font-size="4" fill="currentColor" opacity="0.65">{label}</text>
    {/if}
  </svg>
</div>
