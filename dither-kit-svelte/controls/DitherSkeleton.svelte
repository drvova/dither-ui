<script lang="ts" module>
  import { cellCanvas } from "../engine/raster"
  import { BAYER4, fillOf, pixelMatrixFromSeed, pixelPrefersReducedMotion, xorshift32 } from "../engine/pixel"

  const CELL = 2
  const GREY = fillOf("grey")

  type Shimmer = { base: number; amp: number; rate: number }

  /** Shimmer character — seed varies the breathe rate, amplitude and baseline
   * so each seeded skeleton pulses uniquely; the default stays calm and steady. */
  function shimmerFromSeed(seed: number): Shimmer {
    const rand = xorshift32(Math.round(seed) ^ 0x3c6ef372)
    return { base: 0.4 + rand() * 0.1, amp: 0.06 + rand() * 0.12, rate: 0.001 + rand() * 0.0015 }
  }
  const SHIMMER_DEFAULT: Shimmer = { base: 0.45, amp: 0.1, rate: 0.0015 }

  /** The muted field's density at a phase: it breathes around a baseline so
   * pixels flip on and off through their Bayer thresholds as the sine sweeps. */
  const densityAt = (shimmer: Shimmer, phase: number) => shimmer.base + shimmer.amp * Math.sin(phase)

  /** How many of the matrix's thresholds a density clears: the frame depends
   * on nothing else, so a shimmer has at most 17 distinct frames. */
  const levelOf = (thresholds: number[], density: number) => {
    let n = 0
    for (const t of thresholds) if (density > t) n++
    return n
  }

  /** One frame of the muted field at a density. */
  function paintSkeleton(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    density: number,
    matrix: number[][] = BAYER4
  ): void {
    const px = cellCanvas(ctx, cols, rows)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const lit = density > matrix[y & 3][x & 3]
        px.cell(x, y, GREY, lit ? 0.5 : 0.18, 0.8)
      }
    }
    px.flush()
  }
</script>

<script lang="ts">
  import { untrack } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = { seed?: number; class?: string }

  let { seed, class: className }: Props = $props()

  // Seeded once, like the Vue setup — not reactive to later `seed` changes.
  const shimmer = untrack(() =>
    seed !== undefined ? shimmerFromSeed(seed) : SHIMMER_DEFAULT
  )
  const matrix = untrack(() =>
    seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4
  )

  /**
   * Owns the shimmer rAF loop, the resize sizing and the visibility pause.
   * Ports the Vue `init()` + `useCanvasVisibility` into one action — Svelte's
   * DOM-lifecycle seam, so no `$effect`. Off-screen the loop stops; re-entry
   * wakes the same closure, so timing is preserved with no entrance replay.
   */
  function skeletonCanvas(canvas: HTMLCanvasElement) {
    const host = canvas.parentElement as HTMLElement
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    const reduce = pixelPrefersReducedMotion()
    let cols = 0
    let rows = 0
    let phase = 0
    let raf = 0
    let visible = typeof IntersectionObserver === "undefined"
    let ro: ResizeObserver | null = null
    let io: IntersectionObserver | null = null

    // A frame is painted only when the count of thresholds the density
    // clears changes (at most 17 frames); between crossings the canvas
    // already holds it, so the loop costs a sine and a count.
    const thresholds = matrix.flat()
    let painted = -1
    const draw = () => {
      const density = densityAt(shimmer, phase)
      const level = levelOf(thresholds, density)
      if (!ctx || level === painted) return
      painted = level
      paintSkeleton(ctx, cols, rows, density, matrix)
    }
    const resize = () => {
      const box = host.getBoundingClientRect()
      cols = Math.max(4, Math.round(box.width / CELL))
      rows = Math.max(2, Math.round(box.height / CELL))
      canvas.width = cols
      canvas.height = rows
      painted = -1
      draw()
    }
    const tick = (now: number) => {
      if (!visible) {
        raf = 0
        return // off-screen: pause the loop
      }
      phase = now * shimmer.rate
      draw()
      raf = requestAnimationFrame(tick)
    }
    const wake = () => {
      if (!raf && !reduce) raf = requestAnimationFrame(tick)
    }

    requestAnimationFrame(() => {
      resize()
      if (!reduce) raf = requestAnimationFrame(tick)
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(resize)
        ro.observe(host)
      }
      if (typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? true
          if (visible) wake() // now visible — resume the paused loop
        })
        io.observe(canvas)
      } else {
        visible = true
      }
    })

    return {
      destroy() {
        if (raf) cancelAnimationFrame(raf)
        ro?.disconnect()
        io?.disconnect()
      },
    }
  }
</script>

<div aria-hidden="true" class={cn("relative overflow-hidden", className)}>
  <canvas
    use:skeletonCanvas
    class="absolute inset-0 h-full w-full"
    style="image-rendering: pixelated"
  ></canvas>
</div>
