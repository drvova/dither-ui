<script lang="ts" module>
  import { paintNoiseField, type NoiseParams } from "./noise-field"
  export { paintNoiseField }
  export type { NoiseParams }
</script>

<script lang="ts">
  import { cn } from "./lib"
  import { BAYER4, clamp01, pixelMatrixFromSeed } from "./pixel"
  import { hexToRgb } from "./palette"
  import type { RasterBuffer } from "./raster"
  import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "./precompile"
  import { ditherBackground } from "./use-dither-background"

  type Props = {
    colors?: string[]
    speed?: number
    density?: number
    opacity?: number
    paused?: boolean
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }

  let {
    colors = ["#3DA5FF", "#7CE0FF", "#FFFFFF"],
    speed = 1,
    density = 0.5,
    opacity = 1,
    paused = false,
    dpr,
    mixBlendMode,
    seed,
    renderMode = "live",
    precompiled: precompiledProp,
    class: className,
  }: Props = $props()

  const CELL = 3
  const MAX_COLS = 300
  const MAX_ROWS = 190

  const precompiled = $derived(precompiledSrc(precompiledProp))
  const params = $derived<NoiseParams>({
    colors: (colors.length ? colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    speed: speed,
    density: clamp01(density),
    opacity: clamp01(opacity),
  })
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  let canvasEl = $state<HTMLCanvasElement | null>(null)

  const bg = $derived({
    canvas: canvasEl,
    cell: CELL,
    maxCols: MAX_COLS,
    maxRows: MAX_ROWS,
    dpr,
    paused,
    renderMode,
    precompiled,
    restartKey: JSON.stringify([seed, renderMode, precompiled, dpr]),
    render: (buffer: RasterBuffer, clock: number) => paintNoiseField(buffer, params, clock, matrix),
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
