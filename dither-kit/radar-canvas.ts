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
  BAYER,
  backingSize,
  bloomLayerStyle,
  EASINGS,
  OFF_TIER,
  prefersReducedMotion,
} from "./dither-paint"
import { rgb } from "./palette"
import { distToPolygonEdge, pointInPolygon, polarX, polarY } from "./polar"
import { type PolarChartContextValue, usePolarChart } from "./polar-context"

type Box<T> = { readonly current: T }

type LoopArgs = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
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
  cols,
  rows,
  width,
  height,
  state,
}: LoopArgs): (() => void) | undefined {
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
  const animate = state.current.animate && !reduce
  const duration = state.current.animationDuration
  let raf = 0
  let animStart = 0
  let lastProg = -1
  let lastRevision = state.current.revision
  let intensity = 0
  let needsFill = true
  let lastPaintSig = ""
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
    c.clearRect(0, 0, cols, rows)
    const polys = buildPolys(EASINGS[state.current.easing](prog))
    const band = Math.max(s.outerRadius * 0.45, 1)

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
          const selDim = emphasis !== null && emphasis !== key ? 0.3 : 1
          const dist = distToPolygonEdge(px, py, poly)
          if (dist < 1.4) {
            c.fillStyle = rgb(seed.fill, 1, selDim)
            c.fillRect(x, y, 1, 1)
            covered = true
            continue
          }
          const density = 1 - Math.min(1, dist / band)
          const bias = variant === "dotted" ? 0.12 : 0
          const sparse = pi * 0.2
          if (variant === "hatched" && ((x + y) & 3) >= 2) continue
          const lit =
            variant === "solid" ||
            density > BAYER[y & 3][x & 3] - 0.1 * intensity - bias + sparse
          if (!lit && (variant === "dotted" || covered)) continue
          const k = (0.32 + density * 0.68) * (1 + 0.22 * intensity)
          const alpha = Math.min(1, (lit ? k : k * OFF_TIER) * selDim)
          c.fillStyle = rgb(seed.fill, 1, alpha)
          c.fillRect(x, y, 1, 1)
          covered = true
        }
      }
    }

    for (const { key, pts } of polys) {
      const seed = s.seedOf(key)
      const emphasis = s.selectedDataKey ?? s.focusDataKey
      const selDim = emphasis !== null && emphasis !== key ? 0.3 : 1
      pts.forEach((p, i) => {
        const bx = Math.round(p.x * fx)
        const by = Math.round(p.y * fy)
        const big = s.hoverIndex === i
        c.fillStyle = rgb(seed.fill, 1, selDim)
        const sz = big ? 2 : 1
        c.fillRect(bx - (sz - 1), by - (sz - 1), sz * 2 - 1, sz * 2 - 1)
      })
    }
  }

  const draw = (now: number) => {
    raf = requestAnimationFrame(draw)
    const s = state.current
    if (!s.ready || !s.radar) return
    if (bloomCtx) {
      const on = s.bloom !== "off" && (!s.bloomOnHover || s.isMouseInChart)
      if (on) {
        bloomCtx.clearRect(0, 0, cols, rows)
        bloomCtx.drawImage(canvas, 0, 0)
      }
    }
    if (s.revision !== lastRevision) {
      lastRevision = s.revision
      animStart = 0
      lastProg = -1
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
    const itTarget = s.hoverLift && s.isMouseInChart ? 1 : 0
    if (Math.abs(intensity - itTarget) > 0.001) {
      intensity += (itTarget - intensity) * (reduce ? 1 : 0.16)
      needsFill = true
    } else intensity = itTarget
    if (prog !== lastProg) {
      lastProg = prog
      needsFill = true
    }

    const paintSig = s.configKeys.map((k) => s.variantOf(k)).join(",")
    if (paintSig !== lastPaintSig) {
      lastPaintSig = paintSig
      needsFill = true
    }

    if (!needsFill) return
    paint(prog)
    needsFill = false
  }

  raf = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(raf)
}

/** Dither canvas for radar charts — polygon-membership dither, scale-in. */
export const RadarCanvas = defineComponent({
  name: "RadarCanvas",
  setup() {
    const ctx = usePolarChart()
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const bloomRef = ref<HTMLCanvasElement | null>(null)
    const backing = computed(() => backingSize(ctx.plot.width, ctx.plot.height))
    const stateBox: Box<PolarChartContextValue> = { current: ctx }

    let stop: (() => void) | undefined
    const restart = () => {
      stop?.()
      stop = undefined
      const canvas = canvasRef.value
      if (!canvas) return
      const { cols, rows } = backing.value
      stop = startRadarLoop({
        canvas,
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
      ],
      restart
    )
    onBeforeUnmount(() => stop?.())

    return () => {
      const bloom = bloomLayerStyle(
        ctx.bloom,
        ctx.bloomOnHover ? ctx.isMouseInChart : true
      )
      const pos = {
        left: `${ctx.margins.left}px`,
        top: `${ctx.margins.top}px`,
        width: `${ctx.plot.width}px`,
        height: `${ctx.plot.height}px`,
      }
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
