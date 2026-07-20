<script lang="ts" module>
  import { paintFerrofluid, type FerrofluidParams } from "./ferrofluid"
  export { paintFerrofluid }
  export type { FerrofluidParams }

  export type FlowDirection = "up" | "down" | "left" | "right"

  // Sampling drift is the negative of the on-screen direction: to make blobs
  // travel down the screen, the field is read from the row above.
  const FLOW_VEC: Record<FlowDirection, [number, number]> = {
    up: [0, 1],
    down: [0, -1],
    left: [1, 0],
    right: [-1, 0],
  }
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
    scale?: number
    turbulence?: number
    fluidity?: number
    rimWidth?: number
    sharpness?: number
    shimmer?: number
    glow?: number
    flowDirection?: FlowDirection
    opacity?: number
    dither?: number | boolean
    mouseInteraction?: boolean
    mouseStrength?: number
    mouseRadius?: number
    mouseDampening?: number
    mixBlendMode?: string
    paused?: boolean
    dpr?: number
    seed?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }

  let {
    colors = ["#27FF64", "#7CFF67", "#A8FFB6"],
    speed = 0.5,
    scale = 1.6,
    turbulence = 1,
    fluidity = 0.1,
    rimWidth = 0.2,
    sharpness = 2.5,
    shimmer = 1.5,
    glow = 2,
    flowDirection = "down",
    opacity = 1,
    dither = 1,
    mouseInteraction = true,
    mouseStrength = 1,
    mouseRadius = 0.35,
    mouseDampening = 0.15,
    mixBlendMode,
    paused = false,
    dpr,
    seed,
    renderMode = "live",
    precompiled: precompiledProp,
    class: className,
  }: Props = $props()

  // A ~4px backing cell keeps the fbm affordable; dpr scales it for sharpness.
  const CELL = 4
  const MAX_COLS = 240
  const MAX_ROWS = 150

  const precompiled = $derived(precompiledSrc(precompiledProp))
  const params = $derived.by<FerrofluidParams>(() => {
    const flow = FLOW_VEC[flowDirection]
    return {
      colors: (colors.length ? colors : ["#ffffff"]).slice(0, 8).map(hexToRgb),
      speed,
      scale,
      turbulence,
      fluidity,
      rimWidth,
      sharpness,
      shimmer,
      glow,
      flowX: flow[0],
      flowY: flow[1],
      opacity: clamp01(opacity),
      dither: dither === true ? 1 : dither === false ? 0 : clamp01(dither),
      mouseStrength,
      mouseRadius,
    }
  })
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  let canvasEl = $state<HTMLCanvasElement | null>(null)
  const target = { x: 0.5, y: 0.5 }
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
    render: (buffer: RasterBuffer, clock: number, dt: number) => {
      // Eased pointer follow — mouseDampening is the time constant in seconds.
      const tau = mouseDampening
      if (tau <= 0 || dt <= 0) {
        mouse.x = target.x
        mouse.y = target.y
      } else {
        const k = 1 - Math.exp(-dt / tau)
        mouse.x += (target.x - mouse.x) * k
        mouse.y += (target.y - mouse.y) * k
      }
      paintFerrofluid(buffer, params, clock, matrix, mouseInteraction ? mouse : null)
    },
  })

  function onPointerMove(e: PointerEvent) {
    const c = canvasEl
    if (!c) return
    const r = c.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    target.x = (e.clientX - r.left) / r.width
    target.y = (e.clientY - r.top) / r.height
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
