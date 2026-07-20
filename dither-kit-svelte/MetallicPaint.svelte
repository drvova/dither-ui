<script lang="ts" module>
  import { paintMetallicPaint, type MetallicPaintParams } from "./metallic-paint"
  export { paintMetallicPaint }
  export type { MetallicPaintParams }
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
    scale?: number
    speed?: number
    distortion?: number
    opacity?: number
    dither?: number | boolean
    paused?: boolean
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }

  let {
    colors = ["#1A1A22", "#8890A0", "#E8ECF4"],
    scale = 3,
    speed = 0.4,
    distortion = 0.6,
    opacity = 1,
    dither = 1,
    paused = false,
    dpr,
    mixBlendMode,
    seed,
    renderMode = "live",
    precompiled: precompiledProp,
    class: className,
  }: Props = $props()

  const CELL = 4
  const MAX_COLS = 240
  const MAX_ROWS = 150

  const precompiled = $derived(precompiledSrc(precompiledProp))
  const params = $derived<MetallicPaintParams>({
    colors: (colors.length ? colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    scale: scale,
    speed: speed,
    distortion: distortion,
    opacity: clamp01(opacity),
    dither: dither === true ? 1 : dither === false ? 0 : clamp01(dither),
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
    render: (buffer: RasterBuffer, clock: number) => paintMetallicPaint(buffer, params, clock, matrix),
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
