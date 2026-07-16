import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue"
import {
  backingSize,
  bloomLayerStyle,
  resolveEasing,
  resolveMatrix,
  resolveTexture,
  prefersReducedMotion,
} from "./dither-paint"
import { distToPolygonEdge, pointInPolygon, polarX, polarY } from "./polar"
import { type PolarChartContextValue, usePolarChart } from "./polar-context"
import { blendRasterPixel, clearRasterBuffer, createRasterBuffer, putRasterBuffer } from "./raster"
import { useCanvasVisibility } from "./use-visibility"

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

/** RAF paint loop for radar charts — framework-agnostic. */
function startRadarLoop({
  canvas,
  bloomCanvas,
  visible,
  cols,
  rows,
  width,
  height,
  state,
}: LoopArgs): { stop: () => void; wake: () => void } | undefined {
  const c = canvas.getContext("2d")
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
  let needsFill = true
  let lastPaintSig = ""
  let lastBloomSig = ""
  let lastSelected: string | null | undefined = Symbol() as never
  let lastHover: number | null | undefined = Symbol() as never

  const fx = cols / Math.max(width, 1)
  const fy = rows / Math.max(height, 1)

  const buildPolys = (prog: number) => {
    const s = state.current
    const radar = s.radar
    if (!radar) return []
    return s.configKeys.map((key) => {
      const poly: number[] = []
      const pts: { x: number; y: number }[] = []
      radar.axes.forEach((ax, i) => {
        const v = Number(s.data[i]?.[key]) || 0
        const r = (v / radar.max) * s.outerRadius * prog
        const x = polarX(s.center.x, r, ax.angle)
        const y = polarY(s.center.y, r, ax.angle)
        poly.push(x, y)
        pts.push({ x, y })
      })
      return { key, poly, pts }
    })
  }

  const paint = (prog: number) => {
    const s = state.current
    if (!s.radar) return
    clearRasterBuffer(frame)
    const polys = buildPolys(resolveEasing(state.current.easing)(prog))
    const band = Math.max(s.outerRadius * s.falloff, 1)

    for (let y = 0; y < rows; y++) {
      const py = ((y + 0.5) * height) / rows
      for (let x = 0; x < cols; x++) {
        const px = ((x + 0.5) * width) / cols
        let covered = false
        for (let pi = 0; pi < polys.length; pi++) {
          const { key, poly } = polys[pi]
          if (!pointInPolygon(px, py, poly)) continue
          const seed = s.seedOf(key)
          const variant = s.variantOf(key)
          const emphasis = s.selectedDataKey ?? s.focusDataKey
          const selDim = emphasis !== null && emphasis !== key ? s.dimOpacity : 1
          const dist = distToPolygonEdge(px, py, poly)
          if (dist < 1.4) {
            blendRasterPixel(frame, x, y, seed.fill, selDim)
            covered = true
            continue
          }
          const tex = resolveTexture(variant)
          const mat = resolveMatrix(variant)
          const raw = 1 - Math.min(1, dist / band)
          const density = 1 - tex.ramp * (1 - raw)
          const sparse = pi * 0.2
          if (tex.hatch >= 2 && ((x + y) % tex.hatch) >= tex.hatch / 2) continue
          const lit =
            density > mat[y & 3][x & 3] - 0.1 * intensity - tex.density + sparse
          if (!lit && (tex.gaps || covered)) continue
          const k = (tex.alphaFloor + density * tex.alphaRange) * (1 + tex.intensityLift * intensity)
          const alpha = Math.min(1, (lit ? k : k * tex.offTier) * selDim)
          blendRasterPixel(frame, x, y, seed.fill, alpha)
          covered = true
        }
      }
    }

    for (const { key, pts } of polys) {
      const seed = s.seedOf(key)
      const emphasis = s.selectedDataKey ?? s.focusDataKey
      const selDim = emphasis !== null && emphasis !== key ? s.dimOpacity : 1
      pts.forEach((p, i) => {
        const bx = Math.round(p.x * fx)
        const by = Math.round(p.y * fy)
        const big = s.hoverIndex === i
        const sz = big ? 2 : 1
        const side = sz * 2 - 1
        for (let yy = 0; yy < side; yy++) {
          for (let xx = 0; xx < side; xx++) {
            blendRasterPixel(frame, bx - (sz - 1) + xx, by - (sz - 1) + yy, seed.fill, selDim)
          }
        }
      })
    }
    c.clearRect(0, 0, cols, rows)
    imageData = putRasterBuffer(c, frame, imageData)
  }

  const schedule = () => {
    if (!raf && visible()) raf = requestAnimationFrame(draw)
  }

  const draw = (now: number) => {
    raf = 0
    if (!visible()) return // off-screen: pause until useCanvasVisibility wakes it
    const s = state.current
    if (!s.ready || !s.radar) return
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
    const prog = animate
      ? Math.min(1, Math.max(0, (now - animStart - s.animationDelay) / duration))
      : 1

    const emphasisNow = s.selectedDataKey ?? s.focusDataKey
    if (emphasisNow !== lastSelected) {
      lastSelected = emphasisNow
      needsFill = true
    }
    if (s.hoverIndex !== lastHover) {
      lastHover = s.hoverIndex
      needsFill = true
    }
    const itTarget = s.hoverLift && s.isMouseInChart ? s.hoverStrength : 0
    let settling = false
    if (Math.abs(intensity - itTarget) > 0.001) {
      intensity += (itTarget - intensity) * (reduce ? 1 : 0.16)
      settling = true
      needsFill = true
    } else intensity = itTarget
    if (prog !== lastProg) {
      lastProg = prog
      needsFill = true
    }

    const paintSig = `${s.outerRadius}|${s.falloff}|${s.dimOpacity}|${s.configKeys
      .map((k) => [k, s.config[k]?.color, s.variantOf(k)])
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

  if (visible()) schedule()
  return {
    stop: () => cancelAnimationFrame(raf),
    wake: schedule,
  }
}

/** Dither canvas for radar charts — polygon-membership dither, scale-in. */
export const RadarCanvas = defineComponent({
  name: "RadarCanvas",
  setup() {
    const ctx = usePolarChart()
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    let loop: { stop: () => void; wake: () => void } | undefined
    const isVisible = useCanvasVisibility(canvasRef, () => loop?.wake())
    const bloomRef = ref<HTMLCanvasElement | null>(null)
    const backing = computed(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
    const stateBox: Box<PolarChartContextValue> = { current: ctx }

    const restart = () => {
      loop?.stop()
      loop = undefined
      const canvas = canvasRef.value
      if (!canvas) return
      const { cols, rows } = backing.value
      loop = startRadarLoop({
        canvas,
        visible: isVisible,
        bloomCanvas: bloomRef.value,
        cols,
        rows,
        width: ctx.plot.width,
        height: ctx.plot.height,
        state: stateBox,
      })
    }

    onMounted(restart)
    watch(
      () => [
        backing.value.cols,
        backing.value.rows,
        ctx.plot.width,
        ctx.plot.height,
        ctx.precompiled,
      ],
      restart,
      { flush: "post" }
    )
    watch(
      () => [
        ctx.radar,
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
        ctx.outerRadius,
        ctx.falloff,
        ctx.bloom,
        ctx.bloomOnHover,
      ],
      () => loop?.wake(),
      { flush: "post" }
    )
    onBeforeUnmount(() => loop?.stop())

    return () => {
      const pos = {
        left: `${ctx.margins.left}px`,
        top: `${ctx.margins.top}px`,
        width: `${ctx.plot.width}px`,
        height: `${ctx.plot.height}px`,
      }
      if (ctx.precompiled) {
        return h("img", {
          src: ctx.precompiled,
          alt: "",
          "aria-hidden": "true",
          class: "pointer-events-none absolute",
          style: { ...pos, imageRendering: "pixelated" },
        })
      }
      const bloom = bloomLayerStyle(
        ctx.bloom,
        ctx.bloomOnHover ? ctx.isMouseInChart : true
      )
      return [
        h("canvas", {
          ref: canvasRef,
          class: "pointer-events-none absolute",
          style: { ...pos, imageRendering: "pixelated" },
        }),
        h("canvas", {
          ref: bloomRef,
          class: "pointer-events-none absolute",
          style: {
            ...pos,
            transition: "opacity 220ms ease",
            ...(bloom
              ? {
                  filter: bloom.filter,
                  opacity: bloom.opacity,
                  mixBlendMode: bloom.mixBlendMode,
                  imageRendering: bloom.imageRendering,
                }
              : { opacity: 0 }),
          },
        }),
      ]
    }
  },
})
