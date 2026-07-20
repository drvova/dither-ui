<script lang="ts" module>
  import { paintFaultyTerminal, type FaultyTerminalParams } from "../engine/faulty-terminal"
  export { paintFaultyTerminal }
  export type { FaultyTerminalParams }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"
  import { BAYER4, clamp01, fillOf, pixelMatrixFromSeed, type PixelColor } from "../engine/pixel"
  import type { RasterBuffer } from "../engine/raster"
  import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
  import { ditherBackground } from "../runtime/use-dither-background"

  type Props = {
    scale?: number
    gridMul?: [number, number]
    digitSize?: number
    timeScale?: number
    pause?: boolean
    scanlineIntensity?: number
    glitchAmount?: number
    flickerAmount?: number
    noiseAmp?: number
    chromaticAberration?: number
    dither?: number | boolean
    curvature?: number
    tint?: PixelColor
    mouseReact?: boolean
    mouseStrength?: number
    pageLoadAnimation?: boolean
    brightness?: number
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    mixBlendMode?: string
    class?: string
  }

  let {
    scale = 1.5,
    gridMul = [2, 1],
    digitSize = 1.2,
    timeScale = 1,
    pause = false,
    scanlineIntensity = 1,
    glitchAmount = 1,
    flickerAmount = 1,
    noiseAmp = 1,
    chromaticAberration = 0,
    dither = 0,
    curvature = 0,
    tint = "#ffffff",
    mouseReact = true,
    mouseStrength = 0.5,
    pageLoadAnimation = false,
    brightness = 1,
    seed,
    renderMode = "live",
    precompiled: precompiledProp,
    mixBlendMode,
    class: className,
  }: Props = $props()

  // A background cell of ~3px keeps the fbm affordable; low caps because the
  // wall is decorative and the pixelated upscale is part of the look.
  const CELL = 3
  const MAX_COLS = 220
  const MAX_ROWS = 140

  const precompiled = $derived(precompiledSrc(precompiledProp))
  const params = $derived<FaultyTerminalParams>({
    scale,
    gridMulX: gridMul[0],
    gridMulY: gridMul[1],
    digitSize,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    dither: dither === true ? 1 : dither === false ? 0 : clamp01(dither),
    curvature,
    tint: fillOf(tint),
    brightness,
    mouseStrength,
  })
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  let canvasEl = $state<HTMLCanvasElement | null>(null)
  const mouse = { x: 0.5, y: 0.5 }

  const bg = $derived({
    canvas: canvasEl,
    cell: CELL,
    maxCols: MAX_COLS,
    maxRows: MAX_ROWS,
    dpr: 1,
    paused: pause,
    renderMode,
    precompiled,
    timeScale,
    staticClock: 3,
    restartKey: JSON.stringify([seed, renderMode, precompiled, pageLoadAnimation]),
    render: (buffer: RasterBuffer, clock: number, _dt: number, elapsed: number) => {
      const fade = pageLoadAnimation ? clamp01(elapsed / 900) : 1
      paintFaultyTerminal(buffer, params, clock, matrix, mouseReact ? mouse : null, fade)
    },
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
