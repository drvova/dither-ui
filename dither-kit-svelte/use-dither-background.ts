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

import { pixelPrefersReducedMotion } from "./pixel"
import { createRasterBuffer, putRasterBuffer, type RasterBuffer } from "./raster"
import type { DitherRenderMode } from "./precompile"

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
  let startNow = 0
  let buffer: RasterBuffer | null = null
  let imageData: ImageData | undefined

  function dprFactor(): number {
    const raw = p.dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
    return Math.max(0.5, Math.min(3, raw))
  }

  /** (Re)size the backing buffer to the element. Bails without throwing if the
   * canvas ref is not ready yet so the loop can retry next frame. */
  function measure(): CanvasRenderingContext2D | null {
    const canvas = p.canvas
    if (!canvas || typeof canvas.getContext !== "function") return null
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null
    const box = wrap.getBoundingClientRect()
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
    if (!visible || p.paused) return
    const ctx = measure()
    if (!ctx) {
      raf = requestAnimationFrame(frame)
      return
    }
    if (now - lastPaint < 33) {
      raf = requestAnimationFrame(frame)
      return
    }
    const dt = lastPaint ? Math.min(0.1, (now - lastPaint) / 1000) : 0
    lastPaint = now
    clock += dt * (p.timeScale ?? 1)
    draw(ctx, dt, now - startNow)
    raf = requestAnimationFrame(frame)
  }

  function wake() {
    if (!raf && !p.paused && p.renderMode !== "static" && visible) {
      lastPaint = 0
      raf = requestAnimationFrame(frame)
    }
  }

  function start() {
    stop()
    if (p.precompiled) return
    startNow = typeof performance !== "undefined" ? performance.now() : 0
    lastPaint = 0
    if (p.renderMode === "static" || pixelPrefersReducedMotion()) {
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
        if (raf) return
        const c = measure()
        if (c && p.paused) draw(c, 0, 1e6)
      })
      ro.observe(wrap)
    }
    // frame() paints the first frame and retries until the canvas is ready.
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    ro?.disconnect()
    ro = null
  }

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
      else if (!wasPaused && p.paused) stop()
    },
    destroy() {
      stop()
      io?.disconnect()
      io = null
    },
  }
}
