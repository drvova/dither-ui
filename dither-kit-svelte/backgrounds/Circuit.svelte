<script lang="ts" module>
  import { paintCircuit, type CircuitParams } from "../engine/circuit"
  export { paintCircuit }
  export type { CircuitParams }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"
  import { fillOf, type PixelColor } from "../engine/pixel"
  import type { RasterBuffer } from "../engine/raster"
  import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
  import { ditherBackground } from "../runtime/use-dither-background"
  import { useDitherMatrix } from "../runtime/screen"

  /** Circuit: a board printed through the dither. Chips on a lattice, traces
   * leaving their pins in straight runs with 45 degree jogs to a via or a
   * pad, and signals running every trace in the pulse ink, their tails
   * fading through the thresholds. The seed lays the board out; the signals
   * are a pure function of time. */
  type Props = {
    /** The traces, chips and vias. */
    ink?: PixelColor
    /** The signals. */
    pulse?: PixelColor
    /** How much of the board carries traces, 0-1. */
    density?: number
    /** Cells a second a signal travels. */
    speed?: number
    /** Cells between lattice nodes. */
    pitch?: number
    paused?: boolean
    frameRate?: number
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }

  let {
    ink = "#a6abb1",
    pulse = "#ff9632",
    density = 0.6,
    speed = 14,
    pitch = 4,
    paused = false,
    frameRate = 0,
    dpr,
    mixBlendMode,
    seed,
    renderMode = "live",
    precompiled: precompiledProp,
    class: className,
  }: Props = $props()

  const CELL = 3
  const MAX_COLS = 320
  const MAX_ROWS = 200

  const precompiled = $derived(precompiledSrc(precompiledProp))
  const params = $derived<CircuitParams>({
    ink: fillOf(ink),
    pulse: fillOf(pulse),
    density,
    speed,
    pitch,
    seed: seed ?? 0,
  })
  const ditherMatrix = useDitherMatrix()
  const matrix = $derived(ditherMatrix(seed))

  let canvasEl = $state<HTMLCanvasElement | null>(null)

  const bg = $derived({
    canvas: canvasEl,
    cell: CELL,
    maxCols: MAX_COLS,
    maxRows: MAX_ROWS,
    dpr,
    paused,
    frameRate,
    renderMode,
    precompiled,
    restartKey: JSON.stringify([seed, renderMode, precompiled, dpr, density, pitch]),
    render: (buffer: RasterBuffer, clock: number) => paintCircuit(buffer, params, clock, matrix),
  })
</script>

<div
  use:ditherBackground={bg}
  aria-hidden="true"
  class={cn("relative block h-full w-full overflow-hidden", className)}
>
  {#if precompiled}
    <img
      src={precompiled}
      alt=""
      class="absolute inset-0 h-full w-full object-fill"
      style:image-rendering="pixelated"
      style:mix-blend-mode={mixBlendMode}
    />
  {:else}
    <canvas
      bind:this={canvasEl}
      class="absolute inset-0 h-full w-full"
      style:image-rendering="pixelated"
      style:mix-blend-mode={mixBlendMode}
    ></canvas>
  {/if}
</div>
