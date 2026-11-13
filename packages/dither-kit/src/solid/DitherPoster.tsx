import { createMemo, mergeProps, Show } from "solid-js"
import { fillOf, type PixelColor, type ScreenKind } from "../engine/pixel"
import { paintPoster, posterLayout, type PosterLayout, type PosterParams, type PosterTile } from "../engine/poster"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { cn } from "../tailwind/lib"
import { useScreen } from "./runtime/screen"
import { createDitherBackground } from "./runtime/surface"

export type { PosterLayout, PosterParams, PosterTile }
export { paintPoster, posterLayout }

export type DitherPosterProps = {
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

export default function DitherPoster(raw: DitherPosterProps) {
  const props = mergeProps(
    {
      inks: ["blue", "orange", "grey"] as PixelColor[],
      ground: "transparent" as PixelColor | "transparent",
      seed: 7,
      speed: 2,
      cell: 2,
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )
  const around = useScreen()
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const layout = createMemo(() => posterLayout(props.seed, Math.max(1, props.inks.length)))
  const params = createMemo<PosterParams>(() => ({
    inks: (props.inks.length ? props.inks : ["grey"]).map(fillOf),
    ground: props.ground === "transparent" ? null : fillOf(props.ground),
    screen: props.screen ?? around?.() ?? "bayer",
    speed: props.speed,
  }))

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined

  createDitherBackground({
    wrap: () => wrap ?? null,
    canvas: () => canvas ?? null,
    cell: () => props.cell,
    maxCols: 480,
    maxRows: 360,
    dpr: () => props.dpr,
    paused: () => props.paused,
    frameRate: () => props.frameRate,
    renderMode: () => props.renderMode,
    precompiled,
    restart: () => [props.seed, props.renderMode, precompiled(), props.dpr, props.cell, params()],
    render: (buffer, clock) => paintPoster(buffer, layout(), params(), clock),
  })

  return (
    <div
      ref={(el) => (wrap = el)}
      aria-hidden="true"
      class={cn("relative block h-full w-full overflow-hidden", props.class)}
    >
      <Show
        when={precompiled()}
        fallback={
          <canvas
            ref={(el) => (canvas = el)}
            class="absolute inset-0 h-full w-full"
            style={{ "image-rendering": "pixelated" }}
          />
        }
      >
        {(src) => (
          <img
            src={src()}
            alt=""
            class="absolute inset-0 h-full w-full object-fill"
            style={{ "image-rendering": "pixelated" }}
          />
        )}
      </Show>
    </div>
  )
}
