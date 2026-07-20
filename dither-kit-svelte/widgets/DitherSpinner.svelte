<script lang="ts" module>
  import { rgb } from "../engine/palette"
  import type { Rgb } from "../engine/palette"
  import {
    setOrBlendRasterPixel,
    clearRasterBuffer,
    createRasterBuffer,
    putRasterBuffer,
    type RasterBuffer,
  } from "../engine/raster"
  import { SPINNER_DEFAULT, spinnerFromSeed, type SpinnerParams } from "../engine/dither-paint"
  import {
    BAYER4,
    fillOf,
    type PixelColor,
    pixelMatrixFromSeed,
    pixelPrefersReducedMotion,
  } from "../engine/pixel"

  const CELL = 2
  const TAU = Math.PI * 2

  /** A spinner is a point in a continuous form space, not a preset. Three axes
   * are seeded independently:
   *   • SHAPE  — the silhouette the pattern lives on: a circle ring, a square
   *              box-ring, or a horizontal bar (each pixel gets a path coord t
   *              in 0..1 walking that outline).
   *   • FLOW   — how brightness animates along t: sweep (a comet head chasing
   *              the outline), pulse (the whole shape breathing), or wave (bright
   *              bands travelling the outline).
   *   • DETAIL — arc/taper/segments/spokes/innerRatio carving the lit pattern.
   * So one seed yields a rotating ring, a breathing square, dashes racing a bar,
   * a travelling-wave donut — and everything between. Ranges bounded so no seed
   * is unreadable. ONE render loop draws any point; widen params, never branch
   * per preset. */
  /** Perimeter coordinate 0..1 walking a unit-square outline, continuous across
   * corners — the square's answer to a circle's angle. */
  function squareT(sx: number, sy: number): number {
    const ax = Math.abs(sx)
    const ay = Math.abs(sy)
    if (sy < 0 && ay >= ax) return (sx + 1) / 8 // top L→R
    if (sx > 0 && ax >= ay) return 0.25 + (sy + 1) / 8 // right T→B
    if (sy > 0 && ay >= ax) return 0.5 + (1 - sx) / 8 // bottom R→L
    return 0.75 + (1 - sy) / 8 // left B→T
  }

  /** One frame — walk every cell, resolve its outline membership + path coord by
   * SHAPE, its brightness by FLOW, then carve detail and dither. `phase` (0..1)
   * advances over time. */
  function paintSpinner(
    ctx: CanvasRenderingContext2D | RasterBuffer,
    cells: number,
    fill: Rgb,
    phase: number,
    matrix: number[][] = BAYER4,
    p: SpinnerParams = SPINNER_DEFAULT
  ): void {
    if ("data" in ctx) clearRasterBuffer(ctx)
    else ctx.clearRect(0, 0, cells, cells)
    const c = cells / 2
    const half = c - 0.5
    const arc = Math.max(0.05, Math.min(1, p.arc))
    const ph = (((phase * p.dir) % 1) + 1) % 1
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const nx = (x + 0.5 - c) / half // -1..1
        const ny = (y + 0.5 - c) / half
        // SHAPE: membership on the outline + path coordinate t (0..1) + angle.
        let lit: boolean
        let t: number
        let ang: number
        if (p.shape === 1) {
          const d = Math.max(Math.abs(nx), Math.abs(ny))
          lit = d >= p.innerRatio && d <= 1
          t = squareT(nx / (d || 1), ny / (d || 1))
          ang = t * TAU
        } else if (p.shape === 2) {
          lit = Math.abs(ny) <= 0.4 && Math.abs(nx) <= 1
          t = (nx + 1) / 2
          ang = t * TAU
        } else {
          const r = Math.hypot(nx, ny)
          lit = r >= p.innerRatio && r <= 1
          ang = (Math.atan2(ny, nx) + TAU) % TAU
          t = ang / TAU
        }
        if (!lit) continue
        // FLOW: brightness along the outline.
        let bright: number
        if (p.flow === 1) {
          bright = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ph * TAU)) // breathe
        } else if (p.flow === 2) {
          bright = (0.5 + 0.5 * Math.sin((t * p.waveCount - ph) * TAU)) ** 1.6 // travelling
        } else {
          const rel = (((t - ph) % 1) + 1) % 1 // sweep head at ph
          bright = rel <= arc ? 1 - p.taper * (rel / arc) : 0
        }
        // DETAIL: dashes along the outline, radial petals on round shapes.
        if (p.segments > 0 && (t * p.segments) % 1 > 0.6) bright = 0
        if (p.spokes > 0 && p.shape !== 2)
          bright *= 0.35 + 0.65 * Math.abs(Math.cos((ang * p.spokes) / 2)) ** 2
        if (bright <= 0 || bright <= matrix[y & 3][x & 3]) continue
        const alpha = 0.4 + 0.6 * bright
        if ("data" in ctx) setOrBlendRasterPixel(ctx, x, y, fill, alpha)
        else {
          ctx.fillStyle = rgb(fill, 1, alpha)
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
  }
</script>

<script lang="ts">
  import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"

  type Props = {
    size?: number
    color?: PixelColor
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
  }

  let {
    size = 20,
    color = "blue",
    seed,
    renderMode = "live",
    precompiled: precompiledProp,
  }: Props = $props()

  const spin = $derived(seed !== undefined ? spinnerFromSeed(seed) : SPINNER_DEFAULT)
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)
  const precompiled = $derived(precompiledSrc(precompiledProp))

  type SpinnerRun = {
    size: number
    color: PixelColor
    renderMode: DitherRenderMode
    precompiled: string | undefined
    matrix: number[][]
    spin: SpinnerParams
    restartKey: string
  }

  /**
   * Local Svelte action attached to the <canvas>. It owns the spin loop and the
   * IntersectionObserver visibility gate that the Vue version got from
   * `useCanvasVisibility` — off-screen the rAF loop fully stops and re-entry
   * wakes the same closure, so no `$effect` is needed. First paint is deferred
   * through rAF, matching the Vue `nextTick` restart.
   */
  function spinnerCanvas(canvas: HTMLCanvasElement, initial: SpinnerRun) {
    let p = initial
    let teardown: (() => void) | undefined
    let token = 0
    let io: IntersectionObserver | null = null
    let visible = typeof IntersectionObserver === "undefined"
    let wake: (() => void) | undefined

    function init(): (() => void) | undefined {
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return undefined
      const fill = fillOf(p.color)
      const cells = Math.max(8, Math.round(p.size / CELL))
      canvas.width = cells
      canvas.height = cells

      let raf = 0
      let last = 0
      const buffer = createRasterBuffer(cells, cells)
      let imageData: ImageData | undefined

      paintSpinner(buffer, cells, fill, 0, p.matrix, p.spin)
      imageData = putRasterBuffer(ctx, buffer, imageData)

      wake = undefined
      if (p.renderMode !== "static" && !pixelPrefersReducedMotion()) {
        const frame = (now: number) => {
          raf = 0
          if (!visible) return // off-screen: pause the loop
          if (now - last < 33) {
            raf = requestAnimationFrame(frame)
            return
          }
          last = now
          paintSpinner(buffer, cells, fill, (now * p.spin.speed) % 1, p.matrix, p.spin)
          imageData = putRasterBuffer(ctx, buffer, imageData)
          raf = requestAnimationFrame(frame)
        }
        wake = () => {
          if (!raf) raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
      }

      return () => {
        if (raf) cancelAnimationFrame(raf)
      }
    }

    function restart() {
      const my = ++token
      teardown?.()
      teardown = undefined
      requestAnimationFrame(() => {
        if (my !== token) return
        teardown = init()
      })
    }

    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(([entry]) => {
        const v = entry?.isIntersecting ?? true
        visible = v
        if (v) wake?.() // now visible — resume the paused loop
      })
      io.observe(canvas)
    }

    restart()

    return {
      update(next: SpinnerRun) {
        const changed = next.restartKey !== p.restartKey
        p = next
        if (changed) restart()
      },
      destroy() {
        token += 1
        teardown?.()
        io?.disconnect()
        io = null
      },
    }
  }

  const params = $derived<SpinnerRun>({
    size,
    color,
    renderMode,
    precompiled,
    matrix,
    spin,
    restartKey: JSON.stringify([size, color, seed, renderMode, precompiled]),
  })
</script>

<span role="status" aria-label="Loading" class="inline-flex">
  {#if precompiled}
    <img
      src={precompiled}
      alt=""
      style:width={`${size}px`}
      style:height={`${size}px`}
      style:image-rendering="pixelated"
    />
  {:else}
    <canvas
      use:spinnerCanvas={params}
      style:width={`${size}px`}
      style:height={`${size}px`}
      style:image-rendering="pixelated"
    ></canvas>
  {/if}
</span>
