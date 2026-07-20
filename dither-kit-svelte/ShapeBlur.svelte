<script lang="ts" module>
  import { paintShapeBlur, type ShapeBlurParams } from "./shape-blur"
  export { paintShapeBlur }
  export type { ShapeBlurParams }
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
    size?: number
    speed?: number
    softness?: number
    opacity?: number
    dither?: number | boolean
    mouseInteraction?: boolean
    mouseStrength?: number
    paused?: boolean
    dpr?: number
    mixBlendMode?: string
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }

  let {
    colors = ["#5227FF", "#7CFF67"],
    size = 0.4,
    speed = 0.6,
    softness = 0.3,
    opacity = 1,
    dither = 0.6,
    mouseInteraction = true,
    mouseStrength = 0.5,
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
  const params = $derived<ShapeBlurParams>({
    colors: (colors.length ? colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
    size: size,
    speed: speed,
    softness: softness,
    opacity: clamp01(opacity),
    dither: dither === true ? 1 : dither === false ? 0 : clamp01(dither),
    mouseStrength: mouseStrength,
  })
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  let canvasEl = $state<HTMLCanvasElement | null>(null)

  const mouse = { x: 0.5, y: 0.5 }

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
    render: (buffer: RasterBuffer, clock: number) => paintShapeBlur(buffer, params, clock, matrix, mouseInteraction ? mouse : null),
  })

  function onPointerMove(e: PointerEvent) {
    const c = canvasEl
    if (!c) return
    const r = c.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    mouse.x = (e.clientX - r.left) / r.width
    mouse.y = (e.clientY - r.top) / r.height
  }
</script>

<svelte:window onpointermove={onPointerMove} />

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
