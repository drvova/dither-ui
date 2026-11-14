// Generated from @dither-ui/kit/solid/DitherPoster.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps, Show } from "solid-js"
import { fillOf, type PixelColor, type ScreenKind } from "@dither-ui/kit/engine/pixel.ts"
import {
  paintPoster,
  posterLayout,
  type PosterLayout,
  type PosterParams,
  type PosterTile,
} from "@dither-ui/kit/engine/poster.ts"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "@dither-ui/kit/engine/precompile.ts"
import { cn, type StyleProp } from "./lib"
import { useScreen } from "@dither-ui/kit/solid/runtime/screen.ts"
import { createDitherBackground } from "@dither-ui/kit/solid/runtime/surface.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  img: { position: "absolute", inset: "0px", height: "100%", width: "100%", objectFit: "fill" },
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
})

export type { PosterLayout, PosterParams, PosterTile }
export { paintPoster, posterLayout }

export type DitherPosterProps = {
  /** The inks the tiles are printed in.
   * @docs PixelColor[] (palette names, hues or hex)
   * @default ['blue', 'orange', 'grey'] */
  inks?: PixelColor[]
  /** What a tile's open screen cells show where it has no second ink: a colour, or the page beneath.
   * @docs PixelColor | 'transparent'
   * @default 'transparent' */
  ground?: PixelColor | "transparent"
  /** The screen every tone prints through; default the screen of a `DitherScreen` around it, else Bayer.
   * @docs 'bayer' | 'line' | 'diagonal' | 'dot' | 'cross'
   * @default a DitherScreen's, else 'bayer' */
  screen?: ScreenKind
  /** @docs number (the composition) */
  seed?: number
  /** How fast the screen slides inside the mark, in cells per second.
   * @docs number (cells per second the screen slides inside the mark) */
  speed?: number
  /** Cell size in CSS px.
   * @docs number (px) */
  cell?: number
  paused?: boolean
  /** @docs number (fps, stop-motion)
   * @default 0 (smooth) */
  frameRate?: number
  /** @default devicePixelRatio */
  dpr?: number
  renderMode?: DitherRenderMode
  /** @docs string | { src: string; width?: number; height?: number } */
  precompiled?: PrecompiledDither
  class?: string
  xstyle?: StyleProp
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
    <div ref={(el) => (wrap = el)} aria-hidden="true" class={cn(styles.frame, props.xstyle, props.class)}>
      <Show
        when={precompiled()}
        fallback={
          <canvas
            ref={(el) => (canvas = el)}
            {...stylex.props(styles.canvas)}
            style={{ "image-rendering": "pixelated" }}
          />
        }
      >
        {(src) => <img src={src()} alt="" {...stylex.props(styles.img)} style={{ "image-rendering": "pixelated" }} />}
      </Show>
    </div>
  )
}
