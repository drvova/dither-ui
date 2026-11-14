// The loop behind every generative canvas surface (aurora, faulty-terminal,
// ferrofluid, ...), for any framework's runtime. It owns the throttled rAF
// loop, the backing buffer + upload, the visibility gate, resize, dpr
// scaling, the static / reduced-motion single frame, and the
// start/restart/teardown steps. A component supplies only its per-frame
// `render`; a framework's runtime supplies the elements and calls `mount`,
// `start`, `pausedChanged` and `dispose` from its own lifecycle
// (`solid/runtime/surface.ts`). Making a loop touches nothing, so it is safe while rendering on a
// server; everything that listens starts at `mount`.

import { directedTime, isDirected, onSeek } from "./clock"
import { pixelPrefersReducedMotion } from "./pixel"
import { createRasterBuffer, putRasterBuffer, type RasterBuffer } from "./raster"
import type { DitherRenderMode } from "./precompile"
import { mayPaint, spend } from "./frame-budget"
import { frameIndex } from "./timing"
import { type SizeWatch, watchSize } from "./size-watch"
import { watchVisibility } from "./visibility"

export type SurfaceLoopOptions = {
  /** The element whose box the raster fills, null until it exists. */
  wrap: () => HTMLElement | null
  /** The canvas the raster is uploaded to, null until it exists. */
  canvas: () => HTMLCanvasElement | null
  /** Run `fn` once the framework has put its pending changes in the DOM;
   * a microtask by default. */
  defer?: (fn: () => void) => void
  /** Backing cell size in CSS px before dpr scaling — bigger = chunkier
   * (a getter when it is a prop). */
  cell: number | (() => number)
  maxCols: number
  maxRows: number
  /** Getters into reactive props (the composable never reads props directly). */
  dpr: () => number | undefined
  paused: () => boolean
  renderMode: () => DitherRenderMode
  precompiled: () => string | undefined
  /** dt multiplier for the clock — e.g. a `timeScale` prop. Default 1. */
  timeScale?: () => number
  /**
   * Stop-motion cadence: when > 0, paint only on wall-time frame boundaries at
   * this fps (`timing.frameIndex`) — between boundaries the previous raster is
   * held, so the surface steps like film AND skips the buffer upload entirely.
   * 0/undefined keeps the smooth ~30fps paint throttle.
   */
  frameRate?: () => number | undefined
  /** Clock value used for the single static / reduced-motion frame. Default 4. */
  staticClock?: number
  /**
   * Fill `buffer` for one frame.
   * @param clock   seconds elapsed, scaled by timeScale.
   * @param dt      seconds since the previous painted frame (0 on the first).
   * @param elapsed ms since this run started (drives page-load fades).
   */
  render: (buffer: RasterBuffer, clock: number, dt: number, elapsed: number) => void
  /** After the raster is on the canvas — e.g. copy it onto a bloom layer. */
  afterPaint?: (canvas: HTMLCanvasElement) => void
}

/**
 * A painted surface as other surfaces see it — the render graph's edge. A
 * consumer (a shader channel, a world material) reads a source through this
 * handle: `pull(ms)` paints the directed moment on demand when the source
 * has not painted it yet, so a consumer always reads a source at its own
 * time stamp whatever order the clock reaches them in.
 */
export type DitherSurface = {
  /** The raster as of the last paint, null before the first. */
  raster: () => RasterBuffer | null
  /** Paints `ms` now when directed and not yet painted; free-running or null, the latest raster. */
  pull: (ms: number | null) => RasterBuffer | null
  /** Bumps on every paint — consumers skip re-uploads while it is unchanged. */
  version: () => number
  /** The canvas the raster is uploaded to (null before mount). */
  canvas: () => HTMLCanvasElement | null
}

/** The moment a paused surface paints under direction: its held first frame. */
const HELD = -2

const surfaces = new WeakMap<HTMLCanvasElement, DitherSurface>()

/** The surface behind a kit canvas, when the canvas is one of this runtime's. */
export const surfaceOf = (canvas: HTMLCanvasElement | null | undefined): DitherSurface | null =>
  canvas ? (surfaces.get(canvas) ?? null) : null

/** What a framework's runtime drives a surface with. */
export type SurfaceLoop = {
  surface: DitherSurface
  /** The elements exist: start watching and painting. */
  mount: () => void
  /** (Re)start from the first frame: a restart source changed. */
  start: () => void
  /** `paused` changed: stand down once a frame is up, or wake. */
  pausedChanged: (paused: boolean) => void
  /** The frame a paint now leaves is one the surface holds (static mode,
   * reduced motion, paused, or a moment the kit clock directs): what its
   * `render` reads decides the print until it is told otherwise, so a
   * runtime watches those reads. */
  holds: () => boolean
  /** What `render` reads changed under a held frame: paint the same moment
   * again, the clock and the run kept, so the print is what a surface
   * mounted with the new inputs paints at that moment. Nothing while the
   * loop runs free (it reads its inputs every frame), before the mount or
   * for a precompiled surface. */
  repaint: () => void
  dispose: () => void
}

export function createSurfaceLoop(opts: SurfaceLoopOptions): SurfaceLoop {
  const defer = opts.defer ?? ((fn: () => void) => queueMicrotask(fn))
  let raf = 0
  let size: SizeWatch | null = null
  let restartToken = 0
  let clock = 0
  let lastPaint = 0
  let lastFrame = -1
  let startNow = 0
  let lastSeek = -1
  let paintedSeek = -1
  let version = 0
  let buffer: RasterBuffer | null = null
  let imageData: ImageData | undefined
  // The element's box, read once and then only as the ResizeObserver reports
  // a change (after layout, so the read is free): a read per painted frame
  // forced a layout per surface per frame while the page scrolled.
  let box: { width: number; height: number } | null = null
  // Waited a frame for the shared paint budget: paints next frame regardless.
  let owed = false
  // The canvas's context, asked for once per element, not once per frame.
  let ctx2d: CanvasRenderingContext2D | null = null
  // A held frame's repaint, asked for and not yet painted.
  let repaintAsked = false
  const visibility = watchVisibility(opts.wrap, () => wake())
  const isVisible = visibility.visible
  const surface: DitherSurface = {
    raster: () => buffer,
    pull(ms) {
      if (ms !== null && isDirected()) seekTo(ms)
      return buffer
    },
    version: () => version,
    canvas: () => opts.canvas(),
  }

  function dprFactor(): number {
    const raw = opts.dpr() ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
    return Math.max(0.5, Math.min(3, raw))
  }

  /** (Re)size the backing buffer to the element, deferring the read to rAF so a
   * wall of these mounting together never forces reflow inside flushJobs. */
  function measure(): CanvasRenderingContext2D | null {
    const wrap = opts.wrap()
    const canvas = opts.canvas()
    // A framework can transiently hand back a reused element that is not
    // (yet) a real <canvas> during a large page mount; bail without throwing
    // and retry next frame rather than calling getContext on a non-canvas.
    if (!wrap || !canvas || typeof canvas.getContext !== "function") return null
    if (ctx2d?.canvas !== canvas) ctx2d = canvas.getContext("2d", { willReadFrequently: true })
    const ctx = ctx2d
    if (!ctx) return null
    box ??= wrap.getBoundingClientRect()
    const unit = (typeof opts.cell === "function" ? opts.cell() : opts.cell) / dprFactor()
    const cols = Math.min(opts.maxCols, Math.max(8, Math.round(box.width / unit)))
    const rows = Math.min(opts.maxRows, Math.max(8, Math.round(box.height / unit)))
    if (!buffer || buffer.width !== cols || buffer.height !== rows) {
      buffer = createRasterBuffer(cols, rows)
      imageData = undefined
      paintedSeek = -1
      canvas.width = cols
      canvas.height = rows
    }
    if (!surfaces.has(canvas)) surfaces.set(canvas, surface)
    return ctx
  }

  function draw(ctx: CanvasRenderingContext2D, dt: number, elapsed: number) {
    if (!buffer) return
    opts.render(buffer, clock, dt, elapsed)
    imageData = putRasterBuffer(ctx, buffer, imageData)
    version++
    const canvas = opts.canvas()
    if (opts.afterPaint && canvas) opts.afterPaint(canvas)
  }

  function frame(now: number) {
    raf = 0
    if (!isVisible() || isDirected()) return
    // Paused holds the raster but never leaves it blank: the first frame (and
    // the one after a restart) still paints, then the loop stands down.
    const paused = opts.paused()
    if (paused && lastPaint) return
    // Cadence gates run BEFORE measure(): a held frame must not read layout.
    // Measuring first cost one getBoundingClientRect + getContext per surface
    // per vsync, paints or not (measured, three 8fps landing surfaces at 4x
    // CPU: script time -28%, getBoundingClientRect self time -63%).
    const fps = opts.frameRate?.() || 0
    // Stop-motion gate: hold the last raster until wall time crosses the next
    // fps boundary (dt below spans the held frames, so the clock never loses
    // time between paints); without a frameRate, the smooth ~30fps throttle.
    const idx = fps > 0 ? frameIndex(now - startNow, fps) : -1
    const held = fps > 0 ? idx === lastFrame : now - lastPaint < 33
    if (held) {
      raf = requestAnimationFrame(frame)
      return
    }
    const ctx = measure()
    if (!ctx) {
      // Canvas ref not ready yet — keep the loop alive and retry next frame
      // (the boundary is consumed only by a frame that actually paints).
      raf = requestAnimationFrame(frame)
      return
    }
    // The frame's paints are over budget (`frame-budget.ts`): this one waits
    // a frame, consuming nothing, and goes first in the next.
    if (!mayPaint(now, owed)) {
      owed = true
      raf = requestAnimationFrame(frame)
      return
    }
    owed = false
    lastFrame = idx
    // The default dt clamp survives tab stalls; at low cadence one frame can
    // span >100ms, so widen it to two frame periods when frameRate is set.
    const cap = fps > 0 ? Math.max(0.1, 2 / fps) : 0.1
    const dt = lastPaint ? Math.min(cap, (now - lastPaint) / 1000) : 0
    lastPaint = now
    clock += dt * (opts.timeScale ? opts.timeScale() : 1)
    const began = performance.now()
    draw(ctx, dt, now - startNow)
    spend(now, performance.now() - began)
    if (!paused) raf = requestAnimationFrame(frame)
  }

  const still = () => opts.renderMode() === "static" || pixelPrefersReducedMotion()

  function wake() {
    if (isDirected()) {
      seekTo(directedTime() ?? 0)
      return
    }
    // A still surface (static mode, reduced motion) painted its one frame in
    // start(); the visibility wake must never start the loop behind it.
    if (still()) return
    // Paused never leaves the raster blank: a surface paused before it was
    // first in view paints that first frame as it comes into view.
    if (raf || !isVisible() || (opts.paused() && lastPaint)) return
    lastPaint = 0
    lastFrame = -1 // a resume paints immediately instead of waiting a boundary
    raf = requestAnimationFrame(frame)
  }

  /** Directed (clock.ts): paint one moment. `clock` is absolute, so pure
   * renderers land on the exact frame; `dt` is the step since the last
   * directed moment (0 when first or backwards), so simulations advance
   * frame by frame in capture order. A paused surface holds its first
   * frame (clock 0) whatever the moment, as one mounted paused shows it; a
   * static one keeps the frame its start painted. A moment that is not the
   * next step in capture order (the first, one again, one before) prints
   * on a clean raster, as a surface mounted at it does, so a simulation's
   * past never shows in it. */
  function seekTo(ms: number) {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    if (opts.precompiled() || opts.renderMode() === "static") return
    let ctx = measure()
    if (!ctx) return
    const paused = opts.paused()
    const moment = paused ? HELD : ms
    // A moment paints once: a consumer's pull and the clock's own call agree.
    if (paintedSeek === moment) return
    const scale = opts.timeScale ? opts.timeScale() : 1
    const dt = !paused && lastSeek >= 0 && ms > lastSeek ? Math.min(0.1, (ms - lastSeek) / 1000) : 0
    if (dt === 0) ctx = clean()
    if (!ctx) return
    if (!paused) lastSeek = ms
    paintedSeek = moment
    clock = paused ? 0 : (ms / 1000) * scale
    draw(ctx, dt, paused ? 1e6 : ms)
  }

  /** A clean raster to print a frame from scratch on. */
  function clean(): CanvasRenderingContext2D | null {
    buffer = null
    return measure()
  }

  /** Paint the held frame again: its inputs changed, its moment did not.
   * A still or directed frame waits for the framework's pending changes
   * like a start does, and stands aside for any paint that lands first (a
   * restart the same change caused), so one change is one paint. A paused
   * frame running free goes back through the loop, which paints it once
   * where it shows (or as it comes into view) and stands down again. */
  function repaint() {
    if (!unseek || opts.precompiled()) return
    if (!still() && !isDirected()) {
      if (opts.paused() && lastPaint) {
        lastPaint = 0
        wake()
      }
      return
    }
    if (repaintAsked) return
    repaintAsked = true
    const token = restartToken
    const seen = version
    defer(() => {
      repaintAsked = false
      // A restart since paints the frame itself, as does a first paint still waiting on its canvas.
      if (token !== restartToken || version !== seen || !buffer || opts.precompiled()) return
      if (isDirected() && opts.renderMode() !== "static") {
        paintedSeek = -1
        seekTo(directedTime() ?? 0)
      } else if (still()) {
        const ctx = clean()
        if (ctx) draw(ctx, 0, 1e6)
      }
    })
  }

  function start() {
    const token = ++restartToken
    // A frame already queued stays queued: a prop driven every frame (a
    // scatter, a moment) restarts the surface every frame, and cancelling
    // the queued paint each time would starve it until the driving stops.
    stop(true)
    if (opts.precompiled()) return stop()
    defer(() => {
      if (token !== restartToken || opts.precompiled()) return
      box = null
      startNow = typeof performance !== "undefined" ? performance.now() : 0
      lastPaint = 0
      lastFrame = -1 // a restart paints at once, as a wake does: a source driven every frame never starves
      lastSeek = -1
      paintedSeek = -1
      if (still()) {
        stop()
        clock = opts.staticClock ?? 4
        // Retry the one-shot until the canvas ref settles.
        const paintOnce = () => {
          if (token !== restartToken) return
          const ctx = clean()
          if (!ctx) {
            raf = requestAnimationFrame(paintOnce)
            return
          }
          draw(ctx, 0, 1e6) // elapsed large -> any page-load fade reads complete
        }
        paintOnce()
        return
      }
      const wrap = opts.wrap()
      if (wrap)
        // Applied on the frame after the report (`watchSize`): measuring
        // sizes the canvas, which can resize the box it reports.
        size = watchSize(wrap, () => {
          box = opts.wrap()?.getBoundingClientRect() ?? null
          if (isDirected()) {
            seekTo(directedTime() ?? 0)
            return
          }
          if (raf) return
          // A held surface repaints at its new size only where it shows: the
          // observer's first report (on observe) painted every paused surface
          // down the page at load. One that never painted gets its first
          // frame from the visibility wake.
          if (!isVisible()) return
          const c = measure()
          if (c && opts.paused()) draw(c, 0, 1e6)
        })
      if (isDirected()) {
        seekTo(directedTime() ?? 0)
        return
      }
      // frame() paints the first frame and retries until the canvas is ready.
      if (!raf) raf = requestAnimationFrame(frame)
    })
  }

  /** Stand the loop down; `keepFrame` leaves a queued paint in place. */
  function stop(keepFrame = false) {
    if (raf && !keepFrame) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    size?.stop()
    size = null
  }

  let unseek: (() => void) | null = null
  return {
    surface,
    mount() {
      unseek ??= onSeek((ms) => (ms === null ? wake() : seekTo(ms)))
      visibility.mount()
      start()
    },
    start,
    // A pause stands the loop down once a frame is up; before, the first still
    // paints. Directed, the moment is painted as the pause now has it.
    pausedChanged: (p) => (p && lastPaint && !isDirected() ? stop() : wake()),
    holds: () => still() || opts.paused() || isDirected(),
    repaint,
    dispose() {
      restartToken += 1
      unseek?.()
      unseek = null
      visibility.dispose()
      stop()
    },
  }
}
