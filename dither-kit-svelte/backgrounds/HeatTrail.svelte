<script lang="ts" module>
  import { paintTrail, type TrailParams } from "../engine/heat-trail"
  export { paintTrail }
  export type { TrailParams }
</script>

<script lang="ts">
  import { onMount } from "svelte"
  import { cn } from "../runtime/lib"
  import { coolTrail, createTrail, fitTrail, trailLift, trailTo } from "../engine/heat-trail"
  import { fillOf, type PixelColor } from "../engine/pixel"
  import type { RasterBuffer } from "../engine/raster"
  import { prefersReducedMotion } from "../engine/dither-paint"
  import { ditherBackground } from "../runtime/use-dither-background"
  import { useDitherMatrix } from "../runtime/screen"

  /** HeatTrail: the pointer prints. Over its box a mouse or a pen lays down
   * the kit's diamond in cells, hot; each cell cools down the ramp and thins
   * out through the thresholds until the ground is still again. It listens
   * on the window, so content over it (a heading, a key) never blocks the
   * hand; a finger scrolls instead, and under reduced motion nothing prints.
   * It paints only while something is cooling. */
  type Props = {
    /** The ramp, coolest first, hottest last: a fresh cell takes the last. */
    inks?: PixelColor[]
    /** Seconds a cell takes to cool from fresh to nothing. */
    cool?: number
    /** The diamond's radius in cells. */
    size?: number
    /** Device pixels per cell. */
    cell?: number
    paused?: boolean
    dpr?: number
    mixBlendMode?: string
    seed?: number
    class?: string
  }

  let {
    inks = ["#2f6fd0", "#a6abb1", "#e4e1d8", "#ff9632"],
    cool = 1.6,
    size = 3,
    cell = 4,
    paused = false,
    dpr,
    mixBlendMode,
    seed,
    class: className,
  }: Props = $props()

  const MAX_COLS = 480
  const MAX_ROWS = 300

  const params = $derived<TrailParams>({ inks: inks.map(fillOf), cool, size })
  const ditherMatrix = useDitherMatrix()
  const matrix = $derived(ditherMatrix(seed))

  let wrapEl = $state<HTMLDivElement | null>(null)
  let canvasEl = $state<HTMLCanvasElement | null>(null)

  let trail = createTrail(1, 1)
  /** Where the pointer went since the last paint, as fractions of the box;
   * null where a stroke ended. */
  let pending: ([number, number] | null)[] = []
  /** Whether anything is cooling: the surface paints only then. */
  let live = $state(false)

  function move(e: PointerEvent) {
    if (e.pointerType === "touch" || paused || prefersReducedMotion()) return
    const box = wrapEl?.getBoundingClientRect()
    if (!box?.width || !box.height) return
    const u = (e.clientX - box.left) / box.width
    const v = (e.clientY - box.top) / box.height
    if (u < 0 || v < 0 || u > 1 || v > 1) {
      if (pending.at(-1) !== null) pending.push(null)
      return
    }
    pending.push([u, v])
    live = true
  }
  const lift = () => pending.push(null)
  onMount(() => {
    addEventListener("pointermove", move, { passive: true })
    document.documentElement.addEventListener("pointerleave", lift)
    return () => {
      removeEventListener("pointermove", move)
      document.documentElement.removeEventListener("pointerleave", lift)
    }
  })

  const bg = $derived({
    canvas: canvasEl,
    cell,
    maxCols: MAX_COLS,
    maxRows: MAX_ROWS,
    dpr,
    paused: paused || !live,
    restartKey: JSON.stringify([seed, dpr, cell]),
    render: (buffer: RasterBuffer, _clock: number, dt: number) => {
      // the field at the raster's size (a resize lets the old heat go)
      trail = fitTrail(trail, buffer.width, buffer.height)
      for (const at of pending)
        if (at) trailTo(trail, at[0], at[1], params.size)
        else trailLift(trail)
      pending = []
      live = coolTrail(trail, dt, params.cool)
      paintTrail(buffer, trail, params, matrix)
    },
  })
</script>

<div
  bind:this={wrapEl}
  use:ditherBackground={bg}
  aria-hidden="true"
  class={cn("pointer-events-none relative block h-full w-full overflow-hidden", className)}
>
  <canvas
    bind:this={canvasEl}
    class="absolute inset-0 h-full w-full"
    style:image-rendering="pixelated"
    style:mix-blend-mode={mixBlendMode}
  ></canvas>
</div>
