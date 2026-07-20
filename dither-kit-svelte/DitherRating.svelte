<script lang="ts" module>
  import { rgb } from "./palette"
  import type { Rgb } from "./palette"
  import { BAYER4, fillOf, type PixelColor, pixelMatrixFromSeed, xorshift32 } from "./pixel"

  const CELL = 2

  type Pt = [number, number]

  /** 10 alternating outer/inner vertices of a 5-point star centred in a cell box,
   * `rot` tilts it (seeded for a little per-rating character). */
  function starPoly(c: number, rot: number): Pt[] {
    const outer = c - 0.5
    const inner = outer * 0.42
    const pts: Pt[] = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = rot - Math.PI / 2 + (i * Math.PI) / 5
      pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r])
    }
    return pts
  }

  function inPoly(px: number, py: number, poly: Pt[]): boolean {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]
      const [xj, yj] = poly[j]
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }

  /** Paint `max` dithered stars. Each star fills left-to-right up to its fraction
   * of `value` (so 3.5 lights three-and-a-half); the lit body is dense, the empty
   * remainder a faint dithered ghost, the boundary dissolving through the matrix. */
  function paintRating(
    ctx: CanvasRenderingContext2D,
    cells: number,
    max: number,
    value: number,
    fill: Rgb,
    matrix: number[][],
    rot: number
  ): void {
    ctx.clearRect(0, 0, cells * max, cells)
    const poly = starPoly(cells / 2, rot)
    for (let s = 0; s < max; s++) {
      const level = Math.min(Math.max(value - s, 0), 1)
      const ox = s * cells
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          if (!inPoly(x + 0.5, y + 0.5, poly)) continue
          const frac = x / cells
          const on = frac <= level
          const density = on ? 0.92 : 0.16
          if (density <= matrix[y & 3][x & 3]) continue
          ctx.fillStyle = on ? rgb(fill, 1, 1) : rgb(fill, 0.55, 0.5)
          ctx.fillRect(ox + x, y, 1, 1)
        }
      }
    }
  }
</script>

<script lang="ts">
  import { cn } from "./lib"
  import { paintOnResize, type CanvasPaint } from "./canvas-mount"

  type Props = {
    value?: number
    max?: number
    color?: PixelColor
    size?: number
    readonly?: boolean
    label?: string
    seed?: number
  }

  let {
    value = $bindable(0),
    max = 5,
    color = "orange",
    size = 22,
    readonly = false,
    label = "Rating",
    seed,
  }: Props = $props()

  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)
  const rot = $derived(
    seed !== undefined ? (xorshift32(Math.round(seed) ^ 0x51ed)() - 0.5) * 0.5 : 0
  )

  let hover = $state<number | null>(null)
  const display = $derived(hover ?? value)

  const paint = $derived<CanvasPaint>((canvas) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const cells = Math.max(6, Math.round(size / CELL))
    canvas.width = cells * max
    canvas.height = cells
    paintRating(ctx, cells, max, display, fillOf(color), matrix, rot)
  })

  function starAt(e: PointerEvent): number {
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const f = (e.clientX - rect.left) / rect.width
    return Math.min(Math.max(Math.ceil(f * max), 1), max)
  }
  const onMove = (e: PointerEvent) => {
    if (!readonly) hover = starAt(e)
  }
  const onLeave = () => (hover = null)
  const commit = (e: PointerEvent) => {
    if (readonly) return
    const v = starAt(e)
    value = value === v ? v - 1 : v // click same star to clear one
  }
  function onKey(e: KeyboardEvent) {
    if (readonly) return
    let v = value
    if (e.key === "ArrowRight" || e.key === "ArrowUp") v = Math.min(v + 1, max)
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") v = Math.max(v - 1, 0)
    else if (e.key === "Home") v = 0
    else if (e.key === "End") v = max
    else return
    e.preventDefault()
    if (v !== value) value = v
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (role=slider when interactive) -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex (tabindex only set when role=slider) -->
<span
  role={readonly ? "img" : "slider"}
  tabindex={readonly ? undefined : 0}
  aria-label={label}
  aria-readonly={readonly || undefined}
  aria-valuemin={readonly ? undefined : 0}
  aria-valuemax={readonly ? undefined : max}
  aria-valuenow={readonly ? undefined : value}
  aria-valuetext={`${value} out of ${max}`}
  class={cn(
    "inline-flex rounded-sm outline-none",
    !readonly && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
  )}
  onpointermove={onMove}
  onpointerleave={onLeave}
  onpointerdown={commit}
  onkeydown={onKey}
>
  <canvas
    use:paintOnResize={paint}
    aria-hidden="true"
    style:width={`${size * max}px`}
    style:height={`${size}px`}
    style:image-rendering="pixelated"
  ></canvas>
</span>
