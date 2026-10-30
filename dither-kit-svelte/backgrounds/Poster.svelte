<script lang="ts" module>
  import { paintPoster, posterLayout, type PosterLayout, type PosterParams, type PosterTile } from "../engine/poster"
  export { paintPoster, posterLayout }
  export type { PosterLayout, PosterParams, PosterTile }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"
  import { fillOf, type PixelColor, type ScreenKind } from "../engine/pixel"
  import type { RasterBuffer } from "../engine/raster"
  import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
  import { ditherBackground } from "../runtime/use-dither-background"
  import { useScreen } from "../runtime/screen"

  type Props = {
    /** The inks the tiles are printed in. */
    inks?: PixelColor[]
    /** What a tile's open screen cells show where it has no second ink: a colour, or the page beneath. */
    ground?: PixelColor | "transparent"
    /** The screen every tone prints through; default the screen of a `DitherScreen` around it, else Bayer. */
    screen?: ScreenKind
    seed?: number
    /** How fast the screen slides inside the mark, in cells per second. */
    speed?: number
    /** Cell size in CSS px. */
    cell?: number
    paused?: boolean
    frameRate?: number
    dpr?: number
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    class?: string
  }

  let {
    inks = ["blue", "orange", "grey"],
    ground = "transparent",
    screen,
    seed = 7,
    speed = 2,
    cell = 2,
    paused = false,
    frameRate = 0,
    dpr,
    renderMode = "live",
    precompiled: precompiledProp,
    class: className,
  }: Props = $props()

  const around = useScreen()
  const precompiled = $derived(precompiledSrc(precompiledProp))
  const layout = $derived(posterLayout(seed, Math.max(1, inks.length)))
  const params = $derived<PosterParams>({
    inks: (inks.length ? inks : ["grey"]).map(fillOf),
    ground: ground === "transparent" ? null : fillOf(ground),
    screen: screen ?? around() ?? "bayer",
    speed,
  })

  let canvasEl = $state<HTMLCanvasElement | null>(null)

  const bg = $derived({
    canvas: canvasEl,
    cell,
    maxCols: 480,
    maxRows: 360,
    dpr,
    paused,
    frameRate,
    renderMode,
    precompiled,
    restartKey: JSON.stringify([seed, renderMode, precompiled, dpr, cell, params]),
    render: (buffer: RasterBuffer, clock: number) => paintPoster(buffer, layout, params, clock),
  })
</script>

<div use:ditherBackground={bg} aria-hidden="true" class={cn("relative block h-full w-full overflow-hidden", className)}>
  {#if precompiled}
    <img src={precompiled} alt="" class="absolute inset-0 h-full w-full object-fill" style="image-rendering: pixelated" />
  {:else}
    <canvas bind:this={canvasEl} class="absolute inset-0 h-full w-full" style="image-rendering: pixelated"></canvas>
  {/if}
</div>
