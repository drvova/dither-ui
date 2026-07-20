<script lang="ts" module>
  import { rgb } from "./palette"
  import { BAYER4, fillOf, pixelMatrixFromSeed, pixelPrefersReducedMotion, xorshift32 } from "./pixel"

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

  /** One frame of the muted field — density breathes around a baseline so pixels
   * flip on and off through their Bayer thresholds as the sine sweeps. */
  function paintSkeleton(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    phase: number,
    matrix: number[][] = BAYER4,
    shimmer: Shimmer = SHIMMER_DEFAULT
  ): void {
    ctx.clearRect(0, 0, cols, rows)
    const density = shimmer.base + shimmer.amp * Math.sin(phase)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const lit = density > matrix[y & 3][x & 3]
        ctx.fillStyle = rgb(GREY, 0.8, lit ? 0.5 : 0.18)
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
</script>

<script lang="ts">
  import { untrack } from "svelte"
  import { cn } from "./lib"

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

    const draw = () => {
      if (ctx) paintSkeleton(ctx, cols, rows, phase, matrix, shimmer)
    }
    const resize = () => {
      const box = host.getBoundingClientRect()
      cols = Math.max(4, Math.round(box.width / CELL))
      rows = Math.max(2, Math.round(box.height / CELL))
      canvas.width = cols
      canvas.height = rows
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
