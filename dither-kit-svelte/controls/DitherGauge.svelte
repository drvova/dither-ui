<script lang="ts">
  import { cn } from "../runtime/lib"
  import { gaugeAngle, gaugePoint, gaugeTicks, paintGauge } from "../engine/gauge"
  import { clamp01, fillOf, pixelPrefersReducedMotion, type PixelColor } from "../engine/pixel"
  import { spring } from "../engine/spring"
  import { useDitherMatrix } from "../runtime/screen"
  import { paintOnResize, type CanvasPaint } from "../runtime/canvas-mount"

  /** Gauge: an instrument dial reading a value, read-only (`role="meter"`).
   * A 240-degree band printed cell by cell through the threshold matrix,
   * filled to the needle, the zone past `warn` (a share of the scale; null
   * for none) in the warning ink; ticks and numerals on the scale, the
   * reading under the hub. The needle settles on the kit's spring when the
   * value changes; under reduced motion it stands on the reading. Square, as
   * wide as its box. */
  type Props = {
    value: number
    min?: number
    max?: number
    /** Intervals between the major ticks. */
    ticks?: number
    /** Where the warning zone starts, as a share of the scale; null: none. */
    warn?: number | null
    /** What it reads, under the reading (also its accessible name). */
    label?: string
    decimals?: number
    color?: PixelColor
    warnColor?: PixelColor
    seed?: number
    class?: string
  }

  let {
    value,
    min = 0,
    max = 100,
    ticks = 10,
    warn = 0.8,
    label,
    decimals = 0,
    color = "grey",
    warnColor = "orange",
    seed,
    class: className,
  }: Props = $props()

  const CELL = 2
  const SETTLE_MS = 600
  const matrixFor = useDitherMatrix()

  const target = $derived(clamp01((value - min) / (max - min || 1)))
  let shown = $state(0)

  /** The needle: from where it stands to the reading on the spring, each time
   * the reading changes (the action's update), at once under reduced motion. */
  function needle(_node: HTMLElement, to: number) {
    let raf = 0
    shown = to
    const settle = (next: number) => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      const from = shown
      if (from === next) return
      if (pixelPrefersReducedMotion()) {
        shown = next
        return
      }
      const t0 = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / SETTLE_MS)
        shown = from + (next - from) * spring(p)
        raf = p < 1 ? requestAnimationFrame(step) : 0
      }
      raf = requestAnimationFrame(step)
    }
    return {
      update: settle,
      destroy: () => raf && cancelAnimationFrame(raf),
    }
  }

  const paint = $derived<CanvasPaint>((canvas, host) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const cells = Math.max(16, Math.round(host.getBoundingClientRect().width / CELL))
    canvas.width = cells
    canvas.height = cells
    paintGauge(ctx, cells, fillOf(color), fillOf("grey"), fillOf(warnColor), shown, warn, matrixFor(seed))
  })

  const reading = $derived(value.toFixed(decimals))
  /** Past six intervals a numeral goes on every other major, the ends always. */
  const named = (i: number) => Math.round(ticks) <= 6 || i % 2 === 0
  const scale = $derived(
    gaugeTicks(ticks).map((t, i) => {
      const a = gaugeAngle(t)
      const [x1, y1] = gaugePoint(a, 0.6)
      const [x2, y2] = gaugePoint(a, 0.69)
      const [nx, ny] = gaugePoint(a, 0.47)
      const n = min + (max - min) * t
      return { t, x1, y1, x2, y2, nx, ny, text: Number.isInteger(n) ? String(n) : n.toFixed(1), named: named(i) }
    })
  )
  /** A minor tick halfway between each pair of majors. */
  const minor = $derived.by(() => {
    const n = Math.max(1, Math.round(ticks))
    return Array.from({ length: n }, (_, i) => {
      const a = gaugeAngle((i + 0.5) / n)
      const [x1, y1] = gaugePoint(a, 0.64)
      const [x2, y2] = gaugePoint(a, 0.69)
      return { x1, y1, x2, y2 }
    })
  })
  const hand = $derived.by(() => {
    const a = gaugeAngle(shown)
    const [x1, y1] = gaugePoint(a + 180, 0.12)
    const [x2, y2] = gaugePoint(a, 0.84)
    return { x1, y1, x2, y2 }
  })
  const hub = $derived(`rgb(${fillOf(warnColor).join(" ")})`)
  const numerals = $derived(Math.round(ticks) <= 12)
</script>

<div
  use:needle={target}
  role="meter"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-valuetext={label ? `${reading} ${label}` : reading}
  aria-label={label}
  class={cn("relative aspect-square w-full text-foreground", className)}
>
  <canvas
    use:paintOnResize={paint}
    aria-hidden="true"
    class="absolute inset-0 h-full w-full"
    style="image-rendering: pixelated"
  ></canvas>
  <svg viewBox="0 0 100 100" aria-hidden="true" class="absolute inset-0 h-full w-full font-mono">
    {#each minor as m (m.x1)}
      <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="currentColor" stroke-width="0.6" opacity="0.45" />
    {/each}
    {#each scale as s (s.t)}
      <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="currentColor" stroke-width="1.2" />
      {#if numerals && s.named}
        <text
          x={s.nx}
          y={s.ny}
          font-size="5.5"
          text-anchor="middle"
          dominant-baseline="central"
          fill="currentColor"
          opacity="0.7">{s.text}</text
        >
      {/if}
    {/each}
    <line
      x1={hand.x1}
      y1={hand.y1}
      x2={hand.x2}
      y2={hand.y2}
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    />
    <circle cx="50" cy="50" r="3.6" fill={hub} />
    <text
      x="50"
      y="73"
      font-size="10"
      text-anchor="middle"
      dominant-baseline="central"
      fill="currentColor"
      style="font-variant-numeric: tabular-nums">{reading}</text
    >
    {#if label}
      <text
        x="50"
        y="83"
        font-size="5"
        text-anchor="middle"
        dominant-baseline="central"
        fill="currentColor"
        opacity="0.6">{label}</text
      >
    {/if}
  </svg>
</div>
