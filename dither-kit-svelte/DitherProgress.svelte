<script lang="ts" module>
  import { rgb, type Rgb } from "./palette"
  import { BAYER4, clamp01, fillOf, type PixelColor } from "./pixel"

  const CELL = 2
  const BAND_RATIO = 0.4

  /** Paint the progress track. `band` null → determinate fill up to `ratio`;
   * otherwise a 40%-wide dithered band starting at cell `band` (wrapping),
   * with the Bayer sampling shifted so the texture itself scrolls. */
  function paintProgress(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    fill: Rgb,
    muted: Rgb,
    ratio: number,
    band: number | null,
    matrix: number[][] = BAYER4
  ): void {
    ctx.clearRect(0, 0, cols, rows)
    const bandW = Math.max(2, Math.round(cols * BAND_RATIO))
    const span = cols + bandW
    const filled = Math.round(cols * clamp01(ratio))
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let density: number | null = null
        let bx = x
        if (band === null) {
          if (x < filled) density = 0.35 + 0.65 * ((x + 0.5) / Math.max(1, filled))
        } else {
          const p = (((x - band) % span) + span) % span
          if (p < bandW) {
            density = 0.35 + 0.65 * ((p + 0.5) / bandW)
            bx = x - band
          }
        }
        if (density !== null) {
          const lit = density > matrix[y & 3][((bx % 4) + 4) & 3]
          const k = 0.3 + density * 0.7
          ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
        } else {
          const lit = 0.25 > matrix[y & 3][x & 3]
          ctx.fillStyle = rgb(muted, 1, lit ? 0.2 : 0.06)
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
</script>

<script lang="ts">
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion, pixelMatrixFromSeed } from "./pixel"
  import { kitFromSeed } from "./dither-paint"

  type Props = {
    value?: number
    color?: PixelColor
    seed?: number
    indeterminate?: boolean
    class?: string
  }

  let {
    value = 0,
    color: colorProp,
    seed,
    indeterminate = false,
    class: className,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const color = $derived<PixelColor>(colorProp ?? s?.hue ?? "blue")
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  type ProgressParams = {
    value: number
    color: PixelColor
    indeterminate: boolean
    matrix: number[][]
  }

  /**
   * Owns the indeterminate band loop, the resize sizing and the visibility
   * pause. Ports the Vue component's `syncLoop`/`tick`/`resize` +
   * `useCanvasVisibility` into one action — Svelte's DOM-lifecycle seam, so no
   * `$effect`. An off-screen bar stops its rAF; re-entry wakes it.
   */
  function progressCanvas(canvas: HTMLCanvasElement, params: ProgressParams) {
    let p = params
    const host = canvas.parentElement as HTMLElement
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    let raf = 0
    let cols = 0
    const rows = 3 // h-1.5 track at CELL=2
    let visible = typeof IntersectionObserver === "undefined"
    let ro: ResizeObserver | null = null
    let io: IntersectionObserver | null = null

    function paint(band: number | null) {
      if (!ctx || cols <= 0) return
      paintProgress(
        ctx,
        cols,
        rows,
        fillOf(p.color),
        fillOf("grey"),
        clamp01(p.value / 100),
        band,
        p.matrix
      )
    }
    function repaint() {
      if (p.indeterminate && !raf) {
        // Reduced motion: a static 40% band, no animation loop.
        const bandW = Math.max(2, Math.round(cols * 0.4))
        paint(Math.round((cols - bandW) / 2))
      } else if (!p.indeterminate) {
        paint(null)
      }
    }
    function tick() {
      if (!visible) {
        raf = 0
        return // off-screen: pause the loop
      }
      const bandW = Math.max(2, Math.round(cols * 0.4))
      paint((Math.floor(performance.now() / 50) % (cols + bandW)) - bandW)
      raf = requestAnimationFrame(tick)
    }
    function syncLoop() {
      const animate = p.indeterminate && !pixelPrefersReducedMotion()
      if (animate && !raf) raf = requestAnimationFrame(tick)
      if (!animate && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      repaint()
    }
    function resize() {
      cols = Math.max(4, Math.round(host.getBoundingClientRect().width / CELL))
      canvas.width = cols
      canvas.height = rows
      repaint()
    }

    requestAnimationFrame(() => {
      resize()
      syncLoop()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(resize)
        ro.observe(host)
      }
      if (typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? true
          if (visible) syncLoop() // now visible — resume the paused loop
        })
        io.observe(canvas)
      } else {
        visible = true
      }
    })

    return {
      update(next: ProgressParams) {
        p = next
        syncLoop()
      },
      destroy() {
        if (raf) cancelAnimationFrame(raf)
        ro?.disconnect()
        io?.disconnect()
      },
    }
  }

  const params = $derived<ProgressParams>({ value, color, indeterminate, matrix })
</script>

<div
  role="progressbar"
  aria-valuemin={indeterminate ? undefined : 0}
  aria-valuemax={indeterminate ? undefined : 100}
  aria-valuenow={indeterminate ? undefined : value}
  class={cn("relative h-1.5 w-full overflow-hidden rounded-[2px]", className)}
>
  <canvas
    use:progressCanvas={params}
    aria-hidden="true"
    class="absolute inset-0 h-full w-full"
    style="image-rendering: pixelated"
  ></canvas>
</div>
