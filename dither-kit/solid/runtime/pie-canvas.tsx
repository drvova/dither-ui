// Solid's binding of the pie chart canvas (`engine/pie-canvas.ts` is its Vue twin).
// The paint loop below is framework-free and a DUPLICATE of that file's,
// which Solid cannot import because the file also imports Vue: once the
// loop moves to a core of its own, both bindings import it and this copy
// goes.

import { createEffect, createMemo, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import {
  backingSize,
  bloomLayerStyle,
  resolveEasing,
  resolveTexture,
  prefersReducedMotion,
} from "../../engine/dither-paint"
import { sliceAtAngle } from "../../engine/polar"
import type { PolarChartContextValue } from "../../engine/polar-context"
import { setOrBlendRasterPixel, clearRasterBuffer, createRasterBuffer, putRasterBuffer } from "../../engine/raster"
import { directedTime, isDirected, onSeek } from "../../engine/clock"
import { usePolarChart } from "./polar-context"
import { createCanvasVisibility } from "./visibility"

const TOP = -Math.PI / 2
const TAU = Math.PI * 2
type Box<T> = { readonly current: T }

type LoopArgs = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
  visible: () => boolean
  cols: number
  rows: number
  width: number
  height: number
  state: Box<PolarChartContextValue>
}

/** RAF paint loop for pie / donut charts — framework-agnostic. */
function startPieLoop({
  canvas,
  bloomCanvas,
  visible,
  cols,
  rows,
  width,
  height,
  state,
}: LoopArgs): { stop: () => void; wake: () => void } | undefined {
  const c = canvas.getContext("2d", { willReadFrequently: true })
  if (!c || cols <= 0 || rows <= 0) return undefined
  canvas.width = cols
  canvas.height = rows

  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  if (bloomCanvas) {
    bloomCanvas.width = cols
    bloomCanvas.height = rows
  }

  const reduce = prefersReducedMotion()
  const frame = createRasterBuffer(cols, rows)
  let imageData: ImageData | undefined
  let raf = 0
  let animStart = 0
  let lastProg = -1
  let lastRevision = state.current.revision
  let lastAnimate = state.current.animate && !reduce
  let lastDuration = state.current.animationDuration
  let lastDelay = state.current.animationDelay
  let intensity = 0
  let popEase = 0
  let needsFill = true
  let lastPaintSig = ""
  let lastBloomSig = ""
  let lastSelected: string | null | undefined = Symbol() as never
  let lastHover: number | null | undefined = Symbol() as never

  const paint = (prog: number) => {
    const s = state.current
    const slices = s.pie
    if (!slices) return
    clearRasterBuffer(frame)
    const cx = s.center.x
    const cy = s.center.y
    const outerR = s.outerRadius
    const innerR = s.innerRadius
    const base = slices[0]?.start ?? TOP
    const revealAngle = base + resolveEasing(s.easing)(prog) * TAU

    for (let y = 0; y < rows; y++) {
      const py = ((y + 0.5) * height) / rows
      for (let x = 0; x < cols; x++) {
        const px = ((x + 0.5) * width) / cols
        const dx = px - cx
        const dy = py - cy
        const r = Math.hypot(dx, dy)
        if (r < innerR) continue
        const angle = Math.atan2(dy, dx)
        let na = angle
        while (na < base) na += TAU
        while (na >= base + TAU) na -= TAU
        if (na > revealAngle) continue
        const si = sliceAtAngle(slices, angle)
        if (si < 0) continue
        const slice = slices[si]
        const active = s.hoverIndex === si
        const localOuter = active ? outerR + s.popOut * popEase : outerR
        if (r > localOuter) continue

        const seed = s.seedOf(slice.name)
        const variant = s.variantOf(slice.name)
        const emphasis = s.selectedDataKey ?? s.focusDataKey
        const selDim = emphasis !== null && emphasis !== slice.name ? s.dimOpacity : 1
        const it = intensity + (active ? 0.4 * popEase : 0)

        if (localOuter - r < (active ? s.rimWidth + popEase : s.rimWidth)) {
          setOrBlendRasterPixel(frame, x, y, seed.fill, selDim)
          continue
        }
        const tex = resolveTexture(variant)
        const mat = s.matrixOf(variant)
        const raw = (r - innerR) / Math.max(localOuter - innerR, 1)
        const density = 1 - tex.ramp * (1 - raw)
        if (tex.hatch >= 2 && (x + y) % tex.hatch >= tex.hatch / 2) continue
        const lit = density > mat[y & 3][x & 3] - 0.1 * it - tex.density
        if (tex.gaps && !lit) continue
        const k = (tex.alphaFloor + density * tex.alphaRange) * (1 + tex.intensityLift * it)
        const alpha = Math.min(1, (lit ? k : k * tex.offTier) * selDim)
        setOrBlendRasterPixel(frame, x, y, seed.fill, alpha)
      }
    }
    c.clearRect(0, 0, cols, rows)
    imageData = putRasterBuffer(c, frame, imageData)
  }

  // Directed (clock.ts): no frames are requested; `draw(ms)` paints the
  // moment and the entrance runs from composition time 0.
  const schedule = () => {
    if (!raf && visible() && !isDirected()) raf = requestAnimationFrame(draw)
  }

  const draw = (now: number) => {
    raf = 0
    if (!visible() && !isDirected()) return // off-screen: pause until useCanvasVisibility wakes it
    const s = state.current
    if (!s.ready || !s.pie) return
    const animate = s.animate && !reduce
    const duration = Math.max(1, s.animationDuration)
    if (
      s.revision !== lastRevision ||
      animate !== lastAnimate ||
      duration !== lastDuration ||
      s.animationDelay !== lastDelay
    ) {
      lastRevision = s.revision
      lastAnimate = animate
      lastDuration = duration
      lastDelay = s.animationDelay
      animStart = 0
      lastProg = -1
      needsFill = true
    }
    if (!animStart) animStart = now
    const origin = isDirected() ? 0 : animStart
    const prog = animate ? Math.min(1, Math.max(0, (now - origin - s.animationDelay) / duration)) : 1

    const emphasisNow = s.selectedDataKey ?? s.focusDataKey
    if (emphasisNow !== lastSelected) {
      lastSelected = emphasisNow
      needsFill = true
    }
    if (s.hoverIndex !== lastHover) {
      lastHover = s.hoverIndex
      popEase = 0
      needsFill = true
    }
    const itTarget = s.hoverLift && s.isMouseInChart ? s.hoverStrength : 0
    let settling = false
    if (Math.abs(intensity - itTarget) > 0.001) {
      intensity += (itTarget - intensity) * (reduce ? 1 : 0.16)
      settling = true
      needsFill = true
    } else intensity = itTarget
    const popTarget = s.hoverIndex != null ? 1 : 0
    if (Math.abs(popEase - popTarget) > 0.001) {
      popEase += (popTarget - popEase) * (reduce ? 1 : 0.22)
      settling = true
      needsFill = true
    } else popEase = popTarget
    if (prog !== lastProg) {
      lastProg = prog
      needsFill = true
    }

    const paintSig = `${s.innerRadius}|${s.outerRadius}|${s.rimWidth}|${s.popOut}|${s.dimOpacity}|${s.pie
      .map((sl) => [sl.name, sl.start, sl.end, s.config[sl.name]?.color, s.variantOf(sl.name)])
      .map((v) => JSON.stringify(v))
      .join(",")}`
    const bloomSig = `${s.bloom}|${s.bloomOnHover}|${s.isMouseInChart}`
    if (paintSig !== lastPaintSig) {
      lastPaintSig = paintSig
      needsFill = true
    }
    if (bloomSig !== lastBloomSig) {
      lastBloomSig = bloomSig
      needsFill = true
    }

    if (!(needsFill || settling || (animate && prog < 1))) return
    paint(prog)
    if (bloomCtx && s.bloom !== "off" && (!s.bloomOnHover || s.isMouseInChart)) {
      bloomCtx.clearRect(0, 0, cols, rows)
      bloomCtx.drawImage(canvas, 0, 0)
    }
    needsFill = false
    if (settling || (animate && prog < 1)) schedule()
  }

  const paintDirected = (ms: number) => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    draw(ms)
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

/** Dither canvas for pie / donut charts — clockwise sweep-in, slice hover-pop. */
export function PieCanvas() {
  const ctx = usePolarChart()
  let canvasEl: HTMLCanvasElement | undefined
  let bloomEl: HTMLCanvasElement | undefined
  let loop: { stop: () => void; wake: () => void } | undefined
  const isVisible = createCanvasVisibility(
    () => canvasEl,
    () => loop?.wake(),
  )
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
  const stateBox: Box<PolarChartContextValue> = { current: ctx }

  const restart = () => {
    loop?.stop()
    loop = undefined
    // A precompiled image stands in place of the canvases: nothing to paint.
    const canvas = ctx.precompiled ? undefined : canvasEl
    if (!canvas) return
    const { cols, rows } = backing()
    loop = startPieLoop({
      canvas,
      visible: isVisible,
      bloomCanvas: bloomEl ?? null,
      cols,
      rows,
      width: ctx.plot.width,
      height: ctx.plot.height,
      state: stateBox,
    })
  }

  onMount(restart)
  createEffect(
    on(() => [backing().cols, backing().rows, ctx.plot.width, ctx.plot.height, ctx.precompiled], restart, {
      defer: true,
    }),
  )
  createEffect(
    on(
      () => ctx.ready,
      () => loop?.wake(),
      { defer: true },
    ),
  )
  createEffect(
    on(
      () => [
        ctx.pie,
        ctx.revision,
        ctx.variantRevision,
        ctx.configKeys.map((key) => [key, ctx.config[key]?.color]),
        ctx.selectedDataKey,
        ctx.focusDataKey,
        ctx.hoverIndex,
        ctx.isMouseInChart,
        ctx.animate,
        ctx.animationDuration,
        ctx.animationDelay,
        ctx.easing,
        ctx.hoverLift,
        ctx.hoverStrength,
        ctx.dimOpacity,
        ctx.innerRadius,
        ctx.outerRadius,
        ctx.popOut,
        ctx.rimWidth,
        ctx.bloom,
        ctx.bloomOnHover,
      ],
      () => loop?.wake(),
      { defer: true },
    ),
  )
  onCleanup(() => loop?.stop())

  const pos = (): JSX.CSSProperties => ({
    position: "absolute",
    "pointer-events": "none",
    left: `${ctx.margins.left}px`,
    top: `${ctx.margins.top}px`,
    width: `${ctx.plot.width}px`,
    height: `${ctx.plot.height}px`,
  })
  const bloom = createMemo(() => bloomLayerStyle(ctx.bloom, ctx.bloomOnHover ? ctx.isMouseInChart : true))
  const bloomStyle = (): JSX.CSSProperties => {
    const b = bloom()
    return {
      ...pos(),
      transition: "opacity 220ms ease",
      ...(b
        ? {
            filter: b.filter,
            opacity: b.opacity,
            "mix-blend-mode": b.mixBlendMode,
            "image-rendering": b.imageRendering,
          }
        : { opacity: 0 }),
    }
  }

  return (
    <Show
      when={ctx.precompiled}
      fallback={
        <>
          <canvas ref={(el) => (canvasEl = el)} style={{ ...pos(), "image-rendering": "pixelated" }} />
          <canvas ref={(el) => (bloomEl = el)} style={bloomStyle()} />
        </>
      }
    >
      {(src) => <img src={src()} alt="" aria-hidden="true" style={{ ...pos(), "image-rendering": "pixelated" }} />}
    </Show>
  )
}
