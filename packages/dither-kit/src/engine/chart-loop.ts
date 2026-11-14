// What every chart's paint loop shares, framework-free: the canvases sized to
// the backing, the timed entrance, the frames it is driven on (rAF while
// visible, the kit clock's moment while directed), and for the bar, pie and
// radar charts the whole draw around a family's own `paint`. The cartesian
// loop (`cartesian-loop.ts`) takes the parts and draws its own frame.

import type { ChartContextValue, PolarChartContextValue, Box } from "./chart-types"
import { directedTime, isDirected, onSeek } from "./clock"
import { prefersReducedMotion } from "./dither-paint"
import { clearRasterBuffer, createRasterBuffer, putRasterBuffer, type RasterBuffer } from "./raster"

/** A started chart loop, as its binding holds it. */
export type ChartLoop = { stop: () => void; wake: () => void }

/** What a chart loop reads off any chart family's live state. */
export type LoopedChart = Pick<
  ChartContextValue & PolarChartContextValue,
  | "ready"
  | "revision"
  | "animate"
  | "animationDuration"
  | "animationDelay"
  | "selectedDataKey"
  | "focusDataKey"
  | "hoverIndex"
  | "hoverLift"
  | "hoverStrength"
  | "bloom"
  | "bloomOnHover"
>

/** A chart's canvases at its backing size: the raster painted into, its
 * upload to the dither canvas and the bloom layer's copy of it. */
export type ChartCanvases = {
  c: CanvasRenderingContext2D
  frame: RasterBuffer
  /** Clear the dither canvas and put the raster on it. */
  put: () => void
  /** Copy the dither canvas onto the bloom layer, when it shows. */
  bloom: (s: LoopedChart, hover: boolean) => void
}

export function openChartCanvases(
  canvas: HTMLCanvasElement,
  bloomCanvas: HTMLCanvasElement | null,
  cols: number,
  rows: number,
): ChartCanvases | undefined {
  const c = canvas.getContext("2d", { willReadFrequently: true })
  if (!c || cols <= 0 || rows <= 0) return undefined
  canvas.width = cols
  canvas.height = rows
  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  if (bloomCanvas) {
    bloomCanvas.width = cols
    bloomCanvas.height = rows
  }
  const frame = createRasterBuffer(cols, rows)
  let imageData: ImageData | undefined
  return {
    c,
    frame,
    put: () => {
      c.clearRect(0, 0, cols, rows)
      imageData = putRasterBuffer(c, frame, imageData)
    },
    bloom: (s, hover) => {
      if (bloomCtx && s.bloom !== "off" && (!s.bloomOnHover || hover)) {
        bloomCtx.clearRect(0, 0, cols, rows)
        bloomCtx.drawImage(canvas, 0, 0)
      }
    },
  }
}

/** A chart's timed entrance: its progress at a moment, run again from the
 * start when what times it (the data's revision, `animate`, the duration or
 * the delay) changes. Directed, it runs from composition time 0. */
export function chartEntrance(state: Box<LoopedChart>, reduce: boolean) {
  let animStart = 0
  let lastProg = -1
  let lastRevision = state.current.revision
  let lastAnimate = state.current.animate && !reduce
  let lastDuration = state.current.animationDuration
  let lastDelay = state.current.animationDelay
  return (now: number) => {
    const s = state.current
    const animate = s.animate && !reduce
    const duration = Math.max(1, s.animationDuration)
    const restarted =
      s.revision !== lastRevision ||
      animate !== lastAnimate ||
      duration !== lastDuration ||
      s.animationDelay !== lastDelay
    if (restarted) {
      lastRevision = s.revision
      lastAnimate = animate
      lastDuration = duration
      lastDelay = s.animationDelay
      animStart = 0
      lastProg = -1
    }
    if (!animStart) animStart = now
    const origin = isDirected() ? 0 : animStart
    const prog = animate ? Math.min(1, Math.max(0, (now - origin - s.animationDelay) / duration)) : 1
    const progChanged = prog !== lastProg
    lastProg = prog
    return { animate, prog, progChanged, restarted }
  }
}

/** Drive a chart's `draw(now)`: on animation frames while it is visible and
 * time runs free; at the kit clock's moment, with no frames requested, while
 * time is directed (`clock.ts`). `makeDraw` is handed the `schedule` that
 * asks for the next frame. */
export function driveChartLoop(
  visible: () => boolean,
  makeDraw: (schedule: () => void) => (now: number) => void,
): ChartLoop {
  let raf = 0
  const frame = (now: number) => {
    raf = 0
    // Off-screen: pause until the visibility gate wakes it.
    if (!visible() && !isDirected()) return
    draw(now)
  }
  const schedule = () => {
    if (!raf && visible() && !isDirected()) raf = requestAnimationFrame(frame)
  }
  const draw = makeDraw(schedule)
  const paintDirected = (ms: number) => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    frame(ms)
  }
  const unseek = onSeek((ms) => (ms === null ? schedule() : paintDirected(ms)))
  if (isDirected()) paintDirected(directedTime() ?? 0)
  else if (visible()) schedule()
  return {
    stop: () => {
      cancelAnimationFrame(raf)
      unseek()
    },
    // A wake under direction (ready flipped, data changed) repaints the moment.
    wake: () => (isDirected() ? paintDirected(directedTime() ?? 0) : schedule()),
  }
}

type ChartLoopArgs<S extends LoopedChart> = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
  visible: () => boolean
  cols: number
  rows: number
  state: Box<S>
  /** Whether the chart has what its paint reads (`ready` is checked first). */
  drawable?: (s: S) => boolean
  /** Whether the pointer lifts the chart: its hover intensity and bloom. */
  hover: (s: S) => boolean
  /** The family's fill (`chart-fill.ts`): a change reprints it. */
  fill: (s: S) => string
  /** Called as the hovered index changes. */
  onHover?: () => void
  /** A family's own easing toward the pointer: true while it still moves. */
  settle?: (reduce: boolean) => boolean
  /** Paint the frame at entrance progress `prog` into the cleared raster. */
  paint: (frame: RasterBuffer, prog: number, intensity: number, reduce: boolean) => void
}

/** The bar, pie and radar charts' paint loop: it repaints a frame only when
 * the entrance, the emphasis, the hover, its easing or the fill moved, and
 * asks for the next while something still settles. */
export function startChartLoop<S extends LoopedChart>(args: ChartLoopArgs<S>): ChartLoop | undefined {
  const canvases = openChartCanvases(args.canvas, args.bloomCanvas, args.cols, args.rows)
  if (!canvases) return undefined
  const { state } = args
  const reduce = prefersReducedMotion()
  const entrance = chartEntrance(state, reduce)
  let intensity = 0
  let needsFill = true
  let lastFill = ""
  let lastSelected: string | null | undefined = Symbol() as never
  let lastHover: number | null | undefined = Symbol() as never

  return driveChartLoop(args.visible, (schedule) => (now) => {
    const s = state.current
    if (!s.ready || (args.drawable && !args.drawable(s))) return
    const { animate, prog, progChanged, restarted } = entrance(now)
    if (restarted || progChanged) needsFill = true
    const emphasisNow = s.selectedDataKey ?? s.focusDataKey
    if (emphasisNow !== lastSelected) {
      lastSelected = emphasisNow
      needsFill = true
    }
    if (s.hoverIndex !== lastHover) {
      lastHover = s.hoverIndex
      args.onHover?.()
      needsFill = true
    }
    const hover = args.hover(s)
    const itTarget = s.hoverLift && hover ? s.hoverStrength : 0
    let settling = false
    if (Math.abs(intensity - itTarget) > 0.001) {
      intensity += (itTarget - intensity) * (reduce ? 1 : 0.16)
      settling = true
      needsFill = true
    } else intensity = itTarget
    if (args.settle?.(reduce)) {
      settling = true
      needsFill = true
    }
    const fill = args.fill(s)
    if (fill !== lastFill) {
      lastFill = fill
      needsFill = true
    }

    if (!(needsFill || settling || (animate && prog < 1))) return
    clearRasterBuffer(canvases.frame)
    args.paint(canvases.frame, prog, intensity, reduce)
    canvases.put()
    canvases.bloom(s, hover)
    needsFill = false
    if (settling || (animate && prog < 1)) schedule()
  })
}
