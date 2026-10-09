// Shared runtime for the generative canvas backgrounds (aurora, faulty-terminal,
// ferrofluid, ...). It owns the throttled rAF loop, the backing buffer + upload,
// the visibility gate, resize, dpr scaling, the static / reduced-motion single
// frame, and the mount/restart/teardown lifecycle. A component supplies only its
// per-frame `render`; everything mechanical lives here once, not per component.

import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from "vue"
import { directedTime, isDirected, onSeek } from "./clock"
import { pixelPrefersReducedMotion } from "./pixel"
import { createRasterBuffer, putRasterBuffer, type RasterBuffer } from "./raster"
import type { DitherRenderMode } from "./precompile"
import { frameIndex } from "./timing"
import { useCanvasVisibility } from "./use-visibility"

export type DitherBackgroundOptions = {
  wrapRef: Ref<HTMLElement | null>
  canvasRef: Ref<HTMLCanvasElement | null>
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
  /** Reactive sources that force a full restart when they change. */
  restart: () => unknown
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

const surfaces = new WeakMap<HTMLCanvasElement, DitherSurface>()

/** The surface behind a kit canvas, when the canvas is one of this runtime's. */
export const surfaceOf = (canvas: HTMLCanvasElement | null | undefined): DitherSurface | null => (canvas ? (surfaces.get(canvas) ?? null) : null)

export function useDitherBackground(opts: DitherBackgroundOptions): DitherSurface {
  let raf = 0
  let ro: ResizeObserver | null = null
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
  const isVisible = useCanvasVisibility(opts.wrapRef, () => wake())
  const surface: DitherSurface = {
    raster: () => buffer,
    pull(ms) {
      if (ms !== null && isDirected()) seekTo(ms)
      return buffer
    },
    version: () => version,
    canvas: () => opts.canvasRef.value,
  }

  function dprFactor(): number {
    const raw = opts.dpr() ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
    return Math.max(0.5, Math.min(3, raw))
  }

  /** (Re)size the backing buffer to the element, deferring the read to rAF so a
   * wall of these mounting together never forces reflow inside flushJobs. */
  function measure(): CanvasRenderingContext2D | null {
    const wrap = opts.wrapRef.value
    const canvas = opts.canvasRef.value
    // Vue can transiently hand back a reused element that is not (yet) a real
    // <canvas> during a large page mount; bail without throwing and retry next
    // frame rather than calling getContext on a non-canvas.
    if (!wrap || !canvas || typeof canvas.getContext !== "function") return null
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null
    const box = wrap.getBoundingClientRect()
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
    if (opts.afterPaint && opts.canvasRef.value) opts.afterPaint(opts.canvasRef.value)
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
    lastFrame = idx
    // The default dt clamp survives tab stalls; at low cadence one frame can
    // span >100ms, so widen it to two frame periods when frameRate is set.
    const cap = fps > 0 ? Math.max(0.1, 2 / fps) : 0.1
    const dt = lastPaint ? Math.min(cap, (now - lastPaint) / 1000) : 0
    lastPaint = now
    clock += dt * (opts.timeScale ? opts.timeScale() : 1)
    draw(ctx, dt, now - startNow)
    if (!paused) raf = requestAnimationFrame(frame)
  }

  function wake() {
    if (isDirected()) {
      seekTo(directedTime() ?? 0)
      return
    }
    // A still surface (static mode, reduced motion) painted its one frame in
    // start(); the visibility wake must never start the loop behind it.
    if (opts.renderMode() === "static" || pixelPrefersReducedMotion()) return
    if (!raf && !opts.paused() && isVisible()) {
      lastPaint = 0
      lastFrame = -1 // a resume paints immediately instead of waiting a boundary
      raf = requestAnimationFrame(frame)
    }
  }

  /** Directed (clock.ts): paint one moment. `clock` is absolute, so pure
   * renderers land on the exact frame; `dt` is the step since the last
   * directed moment (0 when first or backwards), so simulations advance
   * frame by frame in capture order. */
  function seekTo(ms: number) {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    if (opts.paused() || opts.precompiled() || opts.renderMode() === "static") return
    const ctx = measure()
    if (!ctx) return
    // A moment paints once: a consumer's pull and the clock's own call agree.
    if (paintedSeek === ms) return
    const scale = opts.timeScale ? opts.timeScale() : 1
    const dt = lastSeek >= 0 && ms > lastSeek ? Math.min(0.1, (ms - lastSeek) / 1000) : 0
    lastSeek = ms
    paintedSeek = ms
    clock = (ms / 1000) * scale
    draw(ctx, dt, ms)
  }

  function start() {
    const token = ++restartToken
    stop()
    if (opts.precompiled()) return
    void nextTick(() => {
      if (token !== restartToken || opts.precompiled()) return
      startNow = typeof performance !== "undefined" ? performance.now() : 0
      lastPaint = 0
      lastSeek = -1
      paintedSeek = -1
      if (opts.renderMode() === "static" || pixelPrefersReducedMotion()) {
        clock = opts.staticClock ?? 4
        // Retry the one-shot until the canvas ref settles.
        const paintOnce = () => {
          if (token !== restartToken) return
          const ctx = measure()
          if (!ctx) {
            raf = requestAnimationFrame(paintOnce)
            return
          }
          draw(ctx, 0, 1e6) // elapsed large -> any page-load fade reads complete
        }
        paintOnce()
        return
      }
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          if (isDirected()) {
            seekTo(directedTime() ?? 0)
            return
          }
          if (raf) return
          const c = measure()
          if (c && opts.paused()) draw(c, 0, 1e6)
        })
        if (opts.wrapRef.value) ro.observe(opts.wrapRef.value)
      }
      if (isDirected()) {
        seekTo(directedTime() ?? 0)
        return
      }
      // frame() paints the first frame and retries until the canvas is ready.
      raf = requestAnimationFrame(frame)
    })
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    ro?.disconnect()
    ro = null
  }

  const unseek = onSeek((ms) => (ms === null ? wake() : seekTo(ms)))
  onMounted(start)
  watch(opts.restart, start, { flush: "post" })
  watch(opts.paused, (p) => (p ? stop() : wake()))
  onBeforeUnmount(() => {
    restartToken += 1
    unseek()
    stop()
  })
  return surface
}
