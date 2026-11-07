// Shared runtime for the generative canvas backgrounds (aurora, faulty-terminal,
// ferrofluid, ...). It owns the throttled rAF loop, the backing buffer + upload,
// the visibility gate, resize, dpr scaling, the static / reduced-motion single
// frame, and the mount/restart/teardown lifecycle. A component supplies only its
// per-frame `render`; everything mechanical lives here once, not per component.
//
// Svelte 5 port: this is a Svelte ACTION rather than a Vue composable. DOM
// lifecycle (mount/restart/teardown, observers, rAF) is exactly what actions
// exist for, so no `$effect` is needed. Attach it to the wrapper element and
// pass the canvas element plus a `restartKey`; the action restarts when the key
// changes and always paints with the latest `render` closure.

import { isCovered, onCoverChange } from "../engine/cover"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { createRasterBuffer, putRasterBuffer, type RasterBuffer } from "../engine/raster"
import type { DitherRenderMode } from "../engine/precompile"
import { frameIndex } from "../engine/timing"

export type DitherBackgroundParams = {
  /** The <canvas> to paint (bound via bind:this; may be null for one frame). */
  canvas: HTMLCanvasElement | null
  /** Backing cell size in CSS px before dpr scaling — bigger = chunkier. */
  cell: number
  maxCols: number
  maxRows: number
  dpr?: number
  paused?: boolean
  renderMode?: DitherRenderMode
  precompiled?: string
  /** dt multiplier for the clock — e.g. a `timeScale` prop. Default 1. */
  timeScale?: number
  /**
   * Stop-motion cadence: when > 0, paint only on wall-time frame boundaries at
   * this fps (`engine/timing.frameIndex`) — between boundaries the previous
   * raster is held, so the surface steps like film AND skips the buffer upload
   * entirely. 0/undefined keeps the smooth ~30fps paint throttle.
   */
  frameRate?: number
  /** Clock value used for the single static / reduced-motion frame. Default 4. */
  staticClock?: number
  /** Serialized restart sources — a change forces a full restart. */
  restartKey: string
  /**
   * Fill `buffer` for one frame.
   * @param clock   seconds elapsed, scaled by timeScale.
   * @param dt      seconds since the previous painted frame (0 on the first).
   * @param elapsed ms since this run started (drives page-load fades).
   */
  render: (buffer: RasterBuffer, clock: number, dt: number, elapsed: number) => void
}

export function ditherBackground(wrap: HTMLElement, initial: DitherBackgroundParams) {
  let p = initial
  let raf = 0
  let ro: ResizeObserver | null = null
  let io: IntersectionObserver | null = null
  let visible = typeof IntersectionObserver === "undefined"
  let clock = 0
  let lastPaint = 0
  let lastFrame = -1
  let startNow = 0
  let buffer: RasterBuffer | null = null
  let imageData: ImageData | undefined
  // The element's box, read once and then only as the ResizeObserver reports
  // a change (after layout, so the read is free): a read per painted frame
  // forced a layout per surface per frame while the page scrolled.
  let box: { width: number; height: number } | null = null
  // The canvas's context, asked for once per element, not once per frame.
  let ctx2d: CanvasRenderingContext2D | null = null

  function dprFactor(): number {
    const raw = p.dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
    return Math.max(0.5, Math.min(3, raw))
  }

  /** (Re)size the backing buffer to the element. Bails without throwing if the
   * canvas ref is not ready yet so the loop can retry next frame. */
  function measure(): CanvasRenderingContext2D | null {
    const canvas = p.canvas
    if (!canvas || typeof canvas.getContext !== "function") return null
    if (ctx2d?.canvas !== canvas) ctx2d = canvas.getContext("2d", { willReadFrequently: true })
    const ctx = ctx2d
    if (!ctx) return null
    box ??= wrap.getBoundingClientRect()
    const unit = p.cell / dprFactor()
    const cols = Math.min(p.maxCols, Math.max(8, Math.round(box.width / unit)))
    const rows = Math.min(p.maxRows, Math.max(8, Math.round(box.height / unit)))
    if (!buffer || buffer.width !== cols || buffer.height !== rows) {
      buffer = createRasterBuffer(cols, rows)
      imageData = undefined
      canvas.width = cols
      canvas.height = rows
    }
    return ctx
  }

  function draw(ctx: CanvasRenderingContext2D, dt: number, elapsed: number) {
    if (!buffer) return
    p.render(buffer, clock, dt, elapsed)
    imageData = putRasterBuffer(ctx, buffer, imageData)
  }

  function frame(now: number) {
    raf = 0
    // Paused holds the raster but never leaves it blank: the first frame
    // still paints, then the loop stands down.
    if (!visible || isCovered(wrap) || (p.paused && lastPaint)) return
    // Cadence gates run BEFORE measure(): a held frame must not touch the
    // canvas. Stop-motion holds the last raster until wall time crosses the
    // next fps boundary (dt below spans the held frames, so the clock never
    // loses time between paints); without a frameRate, the ~30fps throttle.
    const fps = p.frameRate
    const idx = fps && fps > 0 ? frameIndex(now - startNow, fps) : -1
    const held = fps && fps > 0 ? idx === lastFrame : now - lastPaint < 33
    if (held) {
      raf = requestAnimationFrame(frame)
      return
    }
    const ctx = measure()
    if (!ctx) {
      raf = requestAnimationFrame(frame)
      return
    }
    lastFrame = idx
    // The default dt clamp survives tab stalls; at low cadence one frame can
    // span >100ms, so widen it to two frame periods when frameRate is set.
    const cap = fps && fps > 0 ? Math.max(0.1, 2 / fps) : 0.1
    const dt = lastPaint ? Math.min(cap, (now - lastPaint) / 1000) : 0
    lastPaint = now
    clock += dt * (p.timeScale ?? 1)
    draw(ctx, dt, now - startNow)
    if (!p.paused) raf = requestAnimationFrame(frame)
  }

  function wake() {
    // A still surface (static mode, reduced motion) painted its one frame in
    // start(); the visibility wake must never start the loop behind it.
    if (p.renderMode === "static" || pixelPrefersReducedMotion()) return
    // Paused never leaves the raster blank: a surface paused before it was
    // first in view paints that first frame as it comes into view.
    if (raf || !visible || isCovered(wrap) || (p.paused && lastPaint)) return
    lastPaint = 0
    lastFrame = -1 // a resume paints immediately instead of waiting a boundary
    raf = requestAnimationFrame(frame)
  }

  function start() {
    // A frame already queued stays queued: a `restartKey` driven every frame
    // restarts the surface every frame, and cancelling the queued paint each
    // time would starve it until the driving stops.
    stop(true)
    if (p.precompiled) return stop()
    box = null
    startNow = typeof performance !== "undefined" ? performance.now() : 0
    lastPaint = 0
    lastFrame = -1
    if (p.renderMode === "static" || pixelPrefersReducedMotion()) {
      stop()
      clock = p.staticClock ?? 4
      const paintOnce = () => {
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
        box = wrap.getBoundingClientRect()
        if (raf) return
        // A held surface repaints at its new size only where it shows: the
        // observer's first report (on observe) painted every paused surface
        // down the page at load. One that never painted gets its first
        // frame from the visibility wake.
        if (!visible) return
        const c = measure()
        if (c && p.paused) draw(c, 0, 1e6)
      })
      ro.observe(wrap)
    }
    // frame() paints the first frame and retries until the canvas is ready.
    if (!raf) raf = requestAnimationFrame(frame)
  }

  /** Stand the loop down; `keepFrame` leaves a queued paint in place. */
  function stop(keepFrame = false) {
    if (raf && !keepFrame) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    ro?.disconnect()
    ro = null
  }

  // Under a cover (a full-screen sheet) the loop holds its frame; it wakes
  // as the cover lifts.
  const unCover = onCoverChange(() => {
    if (!isCovered(wrap)) wake()
  })

  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(([entry]) => {
      const v = entry?.isIntersecting ?? true
      visible = v
      if (v) wake() // now visible — resume the paused loop
    })
    io.observe(wrap)
  }

  start()

  return {
    update(next: DitherBackgroundParams) {
      const restart = next.restartKey !== p.restartKey
      const wasPaused = p.paused
      p = next
      if (restart) start()
      else if (wasPaused && !p.paused) wake()
      // A pause stands the loop down once a frame is up; before, the first still paints.
      else if (!wasPaused && p.paused) {
        if (lastPaint) stop()
        else wake()
      }
    },
    destroy() {
      stop()
      unCover()
      io?.disconnect()
      io = null
    },
  }
}
