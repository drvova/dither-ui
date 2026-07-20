<script lang="ts" module>
  import { paintLineWaves, type LineWavesParams } from "../engine/line-waves"
  export { paintLineWaves }
  export type { LineWavesParams }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"
  import { BAYER4, clamp01, pixelMatrixFromSeed } from "../engine/pixel"
  import { hexToRgb } from "../engine/palette"
  import type { RasterBuffer } from "../engine/raster"
  import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
  import { ditherBackground } from "../runtime/use-dither-background"

  type Props = {
    colors?: string[]
    count?: number
    amplitude?: number
    frequency?: number
    speed?: number
    lineWidth?: number
    glow?: number
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
    colors = ["#3DA5FF", "#7CE0FF"],
    count = 16,
    amplitude = 0.5,
    frequency = 2,
    speed = 0.5,
    lineWidth = 0.16,
    glow = 1.5,
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
  const MAX_COLS = 260
  const MAX_ROWS = 160

  const precompiled = $derived(precompiledSrc(precompiledProp))
  const params = $derived<LineWavesParams>({
    colors: (colors.length ? colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    count: count,
    amplitude: amplitude,
    frequency: frequency,
    speed: speed,
    lineWidth: lineWidth,
    glow: glow,
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
    render: (buffer: RasterBuffer, clock: number) => paintLineWaves(buffer, params, clock, matrix),
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
