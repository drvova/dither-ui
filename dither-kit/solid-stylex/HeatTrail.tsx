// Generated from ../solid/HeatTrail.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { prefersReducedMotion } from "../engine/dither-paint"
import {
  coolTrail,
  createTrail,
  fitTrail,
  paintTrail,
  scrollTrail,
  trailLift,
  trailTo,
  type TrailParams,
} from "../engine/heat-trail"
import { fillOf, type PixelColor } from "../engine/pixel"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "../solid/runtime/screen"
import { createDitherBackground } from "../solid/runtime/surface"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  frame: {
    pointerEvents: "none",
    position: "relative",
    display: "block",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
})

export type { TrailParams }
export { paintTrail }

export type HeatTrailProps = {
  /** The ramp, coolest first, hottest last: a fresh cell takes the last. */
  inks?: PixelColor[]
  /** Seconds a cell takes to cool from fresh to nothing. */
  cool?: number
  /** The diamond's radius in cells. */
  size?: number
  /** Device pixels per cell. */
  cell?: number
  paused?: boolean
  /** Fixed to the viewport over a scrolling page: the print moves with it. */
  pinned?: boolean
  dpr?: number
  mixBlendMode?: JSX.CSSProperties["mix-blend-mode"]
  seed?: number
  class?: string
  xstyle?: StyleProp
}

const MAX_COLS = 480
const MAX_ROWS = 300

/** HeatTrail: the pointer prints. Over its box a mouse or a pen lays down the
 * kit's diamond in cells, hot; each cell cools down the ramp and thins out
 * through the thresholds until the ground is still again. It listens on
 * the window, so content over it (a heading, a key) never blocks the hand;
 * a finger scrolls instead, and under reduced motion nothing prints. It
 * paints only while something is cooling. `pinned`: the box is fixed to
 * the viewport over a page that scrolls, and the print scrolls with the
 * page, staying where it was laid. */
export default function HeatTrail(raw: HeatTrailProps) {
  const props = mergeProps(
    {
      inks: ["#2f6fd0", "#a6abb1", "#e4e1d8", "#ff9632"] as PixelColor[],
      cool: 1.6,
      size: 3,
      cell: 4,
      paused: false,
      pinned: false,
    },
    raw,
  )
  const params = createMemo<TrailParams>(() => ({
    inks: props.inks.map(fillOf),
    cool: props.cool,
    size: props.size,
  }))
  const matrix = useDitherMatrix(() => props.seed)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined

  let trail = createTrail(1, 1)
  /** Where the pointer went since the last paint, as fractions of the box;
   * null where a stroke ended. */
  let pending: ([number, number] | null)[] = []
  /** Whether anything is cooling: the surface paints only then. */
  const [live, setLive] = createSignal(false)

  function move(e: PointerEvent) {
    if (e.pointerType === "touch" || props.paused || prefersReducedMotion()) return
    const box = wrap?.getBoundingClientRect()
    if (!box?.width || !box.height) return
    const u = (e.clientX - box.left) / box.width
    const v = (e.clientY - box.top) / box.height
    if (u < 0 || v < 0 || u > 1 || v > 1) {
      if (pending.at(-1) !== null) pending.push(null)
      return
    }
    pending.push([u, v])
    setLive(true)
  }
  const lift = () => pending.push(null)
  /** Pinned: how far the page scrolled under the print since the last paint, px. */
  let scrolled = 0
  // The scroll's baseline is the first scroll event's own reading: read at
  // mount, `scrollY` forced a layout of the whole page mid-mount.
  let lastY: number | null = null
  function scroll() {
    if (props.pinned && live() && lastY !== null) scrolled += scrollY - lastY
    lastY = scrollY
  }
  onMount(() => {
    addEventListener("pointermove", move, { passive: true })
    addEventListener("scroll", scroll, { passive: true })
    document.documentElement.addEventListener("pointerleave", lift)
    onCleanup(() => {
      removeEventListener("pointermove", move)
      removeEventListener("scroll", scroll)
      document.documentElement.removeEventListener("pointerleave", lift)
    })
  })

  createDitherBackground({
    wrap: () => wrap ?? null,
    canvas: () => canvas ?? null,
    cell: () => props.cell,
    maxCols: MAX_COLS,
    maxRows: MAX_ROWS,
    dpr: () => props.dpr,
    paused: () => props.paused || !live(),
    renderMode: () => "live",
    precompiled: () => undefined,
    restart: () => [props.seed, props.dpr, props.cell],
    frameRate: () => 0,
    render: (buffer, _clock, dt) => {
      // the field at the raster's size (a resize lets the old heat go)
      trail = fitTrail(trail, buffer.width, buffer.height)
      // pinned: the print rides the page, whole cells at a time
      const rowPx = (wrap?.clientHeight ?? 0) / buffer.height
      if (rowPx > 0) {
        const rows = Math.trunc(scrolled / rowPx)
        scrollTrail(trail, rows)
        scrolled -= rows * rowPx
      }
      const p = params()
      for (const at of pending)
        if (at) trailTo(trail, at[0], at[1], p.size)
        else trailLift(trail)
      pending = []
      setLive(coolTrail(trail, dt, p.cool))
      paintTrail(buffer, trail, p, matrix())
    },
  })

  return (
    <div ref={(el) => (wrap = el)} aria-hidden="true" class={cn(styles.frame, props.xstyle, props.class)}>
      <canvas
        ref={(el) => (canvas = el)}
        {...stylex.props(styles.canvas)}
        style={{ "image-rendering": "pixelated", "mix-blend-mode": props.mixBlendMode }}
      />
    </div>
  )
}
