<script lang="ts" module>
  import { rgb, type Rgb } from "./palette"
  import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"

  export type SliderVariant = "gradient" | "dotted" | "hatched" | "solid"

  const CELL = 2

  /** Paint the track: the span between lo..hi dithers in the chosen texture,
   * the rest reads as a muted rail; optional tick columns mark divisions. */
  function paintTrack(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    fill: Rgb,
    muted: Rgb,
    lo: number,
    hi: number,
    variant: SliderVariant,
    ticks: number[],
    matrix: number[][] = BAYER4
  ): void {
    ctx.clearRect(0, 0, cols, rows)
    const a = Math.round(cols * clamp01(lo))
    const b = Math.round(cols * clamp01(hi))
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (x >= a && x < b) {
          const t = (x - a + 0.5) / Math.max(1, b - a)
          const density =
            variant === "gradient" ? 0.35 + 0.65 * t : variant === "dotted" ? 0.5 : 0.75
          if (variant === "hatched" && ((x + y) & 3) >= 2) {
            ctx.fillStyle = rgb(fill, 1, 0.12)
          } else {
            const lit = variant === "solid" || density > matrix[y & 3][x & 3] - (variant === "dotted" ? 0.12 : 0)
            if (variant === "dotted" && !lit) {
              ctx.fillStyle = rgb(fill, 1, 0.1)
            } else {
              const k = 0.3 + density * 0.7
              ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
            }
          }
        } else {
          const lit = 0.25 > matrix[y & 3][x & 3]
          ctx.fillStyle = rgb(muted, 1, lit ? 0.2 : 0.06)
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
    for (const t of ticks) {
      const x = Math.min(cols - 1, Math.round(cols * t))
      const inFill = x >= a && x < b
      ctx.fillStyle = rgb(muted, 2, inFill ? 0.9 : 0.45)
      ctx.fillRect(x, 0, 1, rows)
    }
  }
</script>

<script lang="ts">
  import { cn } from "./lib"
  import { pixelMatrixFromSeed } from "./pixel"
  import { kitFromSeed } from "./dither-paint"
  import { paintOnResize, type CanvasPaint } from "./canvas-mount"

  type Props = {
    /** A number, or a [lo, hi] pair for a range slider. */
    value?: number | [number, number]
    /** Accessible name for the thumb(s). */
    label?: string
    min?: number
    max?: number
    step?: number
    color?: PixelColor
    /** Fill texture — same vocabulary as the charts. */
    variant?: SliderVariant
    /** Paint tick columns at each step (or 10 divisions when steps are dense). */
    ticks?: boolean
    /** Show a value bubble above the thumb while dragging or focused. */
    showValue?: boolean
    disabled?: boolean
    seed?: number
    class?: string
  }

  let {
    value = $bindable<number | [number, number]>(0),
    label,
    min = 0,
    max = 100,
    step = 1,
    color: colorProp,
    variant: variantProp,
    ticks = false,
    showValue = false,
    disabled = false,
    seed,
    class: className,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const color = $derived<PixelColor>(colorProp ?? s?.hue ?? "blue")
  const variant = $derived<SliderVariant>(variantProp ?? s?.variant ?? "gradient")
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  let rootEl = $state<HTMLDivElement | null>(null)
  let active = $state<-1 | 0 | 1>(-1)
  let focused = $state<-1 | 0 | 1>(-1)

  const isRange = $derived(Array.isArray(value))
  const lo = $derived(isRange ? (value as [number, number])[0] : min)
  const hi = $derived(isRange ? (value as [number, number])[1] : (value as number))
  const span = $derived(Math.max(1e-9, max - min))
  const toRatio = (v: number) => clamp01((v - min) / span)

  const tickRatios = $derived.by(() => {
    if (!ticks) return []
    const steps = span / step
    const count = steps <= 25 ? Math.round(steps) : 10
    return Array.from({ length: count + 1 }, (_, i) => i / count)
  })

  const thumbs = $derived.by(() => {
    const list: { which: 0 | 1; value: number; min: number; max: number; name: string }[] = []
    if (isRange) {
      list.push({ which: 0, value: lo, min, max: hi, name: label ? `${label} minimum` : "Minimum" })
      list.push({ which: 1, value: hi, min: lo, max, name: label ? `${label} maximum` : "Maximum" })
    } else {
      list.push({ which: 1, value: hi, min, max, name: label ?? "" })
    }
    return list
  })

  const paint = $derived<CanvasPaint>((canvas, host) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const box = host.getBoundingClientRect()
    const cols = Math.max(4, Math.round(box.width / CELL))
    const rows = 3
    canvas.width = cols
    canvas.height = rows
    paintTrack(
      ctx,
      cols,
      rows,
      fillOf(color),
      fillOf("grey"),
      isRange ? toRatio(lo) : 0,
      toRatio(hi),
      variant,
      tickRatios,
      matrix
    )
  })

  function clampStep(raw: number): number {
    const stepped = min + Math.round((raw - min) / step) * step
    return Math.min(max, Math.max(min, stepped))
  }

  function setThumb(which: 0 | 1, raw: number) {
    if (!isRange) {
      value = clampStep(raw)
      return
    }
    const [a, b] = value as [number, number]
    const v = clampStep(raw)
    // Thumbs may meet but never cross.
    value = which === 0 ? [Math.min(v, b), b] : [a, Math.max(v, a)]
  }

  function valueFromClientX(clientX: number): number {
    const rect = rootEl!.getBoundingClientRect()
    const t = clamp01((clientX - rect.left) / Math.max(1, rect.width))
    return min + t * span
  }

  function nearestThumb(v: number): 0 | 1 {
    if (!isRange) return 1
    return Math.abs(v - lo) <= Math.abs(v - hi) ? 0 : 1
  }

  function onPointerDown(event: PointerEvent) {
    if (disabled) return
    rootEl?.setPointerCapture(event.pointerId)
    const v = valueFromClientX(event.clientX)
    const which = nearestThumb(v)
    active = which
    setThumb(which, v)
  }

  function onPointerMove(event: PointerEvent) {
    if (disabled || active === -1) return
    if (!rootEl?.hasPointerCapture(event.pointerId)) return
    setThumb(active as 0 | 1, valueFromClientX(event.clientX))
  }

  function onPointerUp() {
    active = -1
  }

  function onKeydown(which: 0 | 1, event: KeyboardEvent) {
    if (disabled) return
    const current = which === 0 ? lo : hi
    let next: number
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = current - step
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") next = current + step
    else if (event.key === "Home") next = min
    else if (event.key === "End") next = max
    else return
    event.preventDefault()
    setThumb(which, next)
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={rootEl}
  class={cn(
    "relative h-4 w-full touch-none select-none",
    disabled ? "pointer-events-none opacity-40" : "cursor-pointer",
    className
  )}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <div class="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-[2px]">
    <canvas
      use:paintOnResize={paint}
      aria-hidden="true"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    ></canvas>
  </div>
  {#each thumbs as t (t.which)}
    <div
      role="slider"
      aria-label={t.name || undefined}
      tabindex={disabled ? -1 : 0}
      aria-valuemin={t.min}
      aria-valuemax={t.max}
      aria-valuenow={t.value}
      aria-disabled={disabled || undefined}
      class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-foreground"
      style:left={`${toRatio(t.value) * 100}%`}
      onkeydown={(e) => onKeydown(t.which, e)}
      onfocus={() => (focused = t.which)}
      onblur={() => (focused = -1)}
    ></div>
    {#if showValue && (active === t.which || focused === t.which)}
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-6 -translate-x-1/2 rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px] text-foreground tabular-nums"
        style:left={`${toRatio(t.value) * 100}%`}
      >
        {t.value}
      </div>
    {/if}
  {/each}
</div>
