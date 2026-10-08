<script lang="ts" module>
  import { paintFlowField, fadeRasterAlpha, type FlowFieldParams } from "../engine/flow-field"
  export { paintFlowField, fadeRasterAlpha }
  export type { FlowFieldParams }
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
    speed?: number
    scale?: number
    fade?: number
    glow?: number
    opacity?: number
    dither?: number | boolean
    mask?: "radial" | "linear" | "none"
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
    colors = ["#f4f8ff", "#c9dbff", "#7ba3ee"],
    count = 2400,
    speed = 0.7,
    scale = 1.4,
    fade = 0.96,
    glow = 1,
    opacity = 1,
    dither = 1,
    mask = "radial",
    paused = false,
    frameRate = 60,
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
  const params = $derived<FlowFieldParams>({
    colors: (colors.length ? colors : ["#f4f8ff"]).slice(0, 8).map(hexToRgb),
    count,
    speed,
    scale,
    fade: clamp01(fade),
    glow,
    opacity: clamp01(opacity),
    dither: dither === true ? 1 : dither === false ? 0 : clamp01(dither),
    seed: seed ?? 1,
  })
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  let canvasEl = $state<HTMLCanvasElement | null>(null)

  const MASKS: Record<string, string | undefined> = {
    radial: "radial-gradient(120% 120% at 50% 40%, black 45%, transparent 100%)",
    linear: "linear-gradient(to bottom, black 60%, transparent 100%)",
  }

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
    restartKey: JSON.stringify([seed, renderMode, precompiled, dpr, count]),
    render: (buffer: RasterBuffer, clock: number, dt: number, elapsed: number) =>
      paintFlowField(buffer, params, clock, dt, matrix, elapsed),
  })
</script>

<div
  use:ditherBackground={bg}
  aria-hidden="true"
  class={cn("relative block h-full w-full overflow-hidden", className)}
  style:mask-image={MASKS[mask]}
  style:-webkit-mask-image={MASKS[mask]}
  style:mix-blend-mode={mixBlendMode}
>
  {#if precompiled}
    <img src={precompiled} alt="" class="absolute inset-0 h-full w-full object-fill" style:image-rendering="pixelated" />
  {:else}
    <canvas
      bind:this={canvasEl}
      class="absolute inset-0 h-full w-full"
      style:image-rendering="pixelated"
    ></canvas>
  {/if}
</div>
