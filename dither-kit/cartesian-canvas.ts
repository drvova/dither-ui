import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue"
import { type ChartContextValue, useChart } from "./chart-context"
import {
  backingSize,
  bloomLayerStyle,
  EASINGS,
  paintColumn,
  prefersReducedMotion,
  resample,
} from "./dither-paint"
import { rgb } from "./palette"

type Star = { key: string; xi: number; depth: number; phase: number }
type Surface = { top: number[]; floor: number[] }
type Box<T> = { readonly current: T }

type LoopArgs = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
  cols: number
  rows: number
  state: Box<ChartContextValue>
  targets: Box<Record<string, Surface>>
  stars: Box<Star[]>
}

/**
 * The requestAnimationFrame paint loop — eases each series toward its target
 * surface, paints the dither fill (with the entrance reveal), then layers the
 * crosshair marker and winking stars on top. Framework-agnostic: it reads the
 * live chart state through `state.current`. Returns a cleanup that cancels it.
 */
function startCartesianLoop({
  canvas,
  bloomCanvas,
  cols,
  rows,
  state,
  targets,
  stars,
}: LoopArgs): (() => void) | undefined {
  const c = canvas.getContext("2d")
  if (!c || cols <= 0 || rows <= 0) return undefined
  canvas.width = cols
  canvas.height = rows

  const off = document.createElement("canvas")
  off.width = cols
  off.height = rows
  const octx = off.getContext("2d")
  if (!octx) return undefined

  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  if (bloomCanvas) {
    bloomCanvas.width = cols
    bloomCanvas.height = rows
  }

  const reduce = prefersReducedMotion()
  const EASE = reduce ? 1 : 0.18
  const animate = state.current.animate && !reduce
  const duration = state.current.animationDuration
  const current: Record<string, Surface> = {}

  const paintFill = (intensity: number, reveal: number) => {
    octx.clearRect(0, 0, cols, rows)
    const s = state.current
    const stacked = s.stackType === "stacked" || s.stackType === "percent"
    const revealCols = Math.ceil(reveal * cols)
    s.configKeys.forEach((key, si) => {
      const cur = current[key]
      if (!cur) return
      const seed = s.seedOf(key)
      const variant = s.seriesSpecs[key]?.variant ?? "gradient"
      const isLine =
        (s.seriesSpecs[key]?.kind ??
          (s.chartType === "line" ? "line" : "area")) === "line"
      const emphasis = s.selectedDataKey ?? s.focusDataKey
      const dim = emphasis !== null && emphasis !== key ? 0.3 : 1
      const sparse = stacked ? 0 : si * 0.14
      for (let x = 0; x < cols; x++) {
        if (x > revealCols) break
        paintColumn(octx, x, cur.top[x] ?? 0, cur.floor[x] ?? 0, seed, {
          variant,
          intensity,
          dim,
          stacked: stacked && !isLine,
          sparse,
        })
      }
    })
  }

  let raf = 0
  let tick = 0
  let last = 0
  let animStart = 0
  let lastProg = -1
  let lastRevision = state.current.revision
  let entranceReported = !animate
  let intensity = 0
  let needsFill = true
  let lastPaintSig = ""
  let lastSelected: string | null | undefined = Symbol() as never

  const draw = (now: number) => {
    raf = requestAnimationFrame(draw)
    const s = state.current
    if (!s.ready) return
    if (bloomCtx) {
      const on =
        s.bloom !== "off" && (!s.bloomOnHover || s.isMouseInChart || s.hovered)
      if (on) {
        bloomCtx.clearRect(0, 0, cols, rows)
        bloomCtx.drawImage(canvas, 0, 0)
      }
    }
    const tgt = targets.current
    if (s.revision !== lastRevision) {
      lastRevision = s.revision
      animStart = 0
      lastProg = -1
      entranceReported = false
    }
    if (!animStart) animStart = now
    const prog = animate
      ? Math.min(1, Math.max(0, (now - animStart - s.animationDelay) / duration))
      : 1
    const progChanged = prog !== lastProg
    if (prog >= 1 && !entranceReported) {
      entranceReported = true
      s.markEntranceDone()
    }

    let moving = false
    for (const key of s.configKeys) {
      const t = tgt[key]
      if (!t) continue
      const cur = current[key]
      if (!cur || cur.top.length !== cols) {
        current[key] = { top: t.top.slice(), floor: t.floor.slice() }
        needsFill = true
        continue
      }
      for (let x = 0; x < cols; x++) {
        const dt = t.top[x] - cur.top[x]
        const df = t.floor[x] - cur.floor[x]
        if (Math.abs(dt) > 0.01 || Math.abs(df) > 0.01) {
          cur.top[x] += dt * EASE
          cur.floor[x] += df * EASE
          moving = true
        } else {
          cur.top[x] = t.top[x]
          cur.floor[x] = t.floor[x]
        }
      }
    }
    for (const key of Object.keys(current)) {
      if (!tgt[key]) {
        delete current[key]
        needsFill = true
      }
    }
    if (moving) needsFill = true
    const emphasisNow = s.selectedDataKey ?? s.focusDataKey
    if (emphasisNow !== lastSelected) {
      lastSelected = emphasisNow
      needsFill = true
    }

    const itTarget = s.hoverLift && (s.isMouseInChart || s.hovered) ? 1 : 0
    let settling = false
    if (Math.abs(intensity - itTarget) > 0.001) {
      intensity += (itTarget - intensity) * 0.16
      settling = true
      needsFill = true
    } else intensity = itTarget

    const marker = s.hoverIndex != null ? s.hoverIndex : s.markerIndex
    const winkDue = !reduce && now - last >= 100
    const paintSig = `${s.stackType}|${s.configKeys
      .map((k) => s.seriesSpecs[k]?.variant ?? "")
      .join(",")}`
    const sigChanged = paintSig !== lastPaintSig
    if (sigChanged) {
      lastPaintSig = paintSig
      needsFill = true
    }
    if (
      !(
        moving ||
        settling ||
        winkDue ||
        marker != null ||
        progChanged ||
        sigChanged
      )
    )
      return
    if (progChanged) {
      lastProg = prog
      needsFill = true
    }
    if (winkDue) {
      last = now
      tick += 1
    }

    const reveal = animate ? EASINGS[s.easing](prog) : 1
    const revealCols = reveal * cols

    if (needsFill) {
      paintFill(intensity, reveal)
      needsFill = false
    }
    c.clearRect(0, 0, cols, rows)
    c.drawImage(off, 0, 0)

    const mx =
      marker != null && s.dataLength > 1
        ? Math.round((marker / (s.dataLength - 1)) * (cols - 1))
        : -1
    if (mx >= 0 && mx <= revealCols) {
      for (const key of s.configKeys) {
        const cur = current[key]
        if (!cur) continue
        const seed = s.seedOf(key)
        const my = Math.round(cur.top[mx] ?? 0)
        c.fillStyle = rgb(seed.fill, 1, 0.55)
        for (let y = my; y < rows; y++) c.fillRect(mx, y, 1, 1)
        c.fillStyle = rgb(seed.fill)
        c.fillRect(mx - 1, my - 1, 3, 3)
      }
    }

    if (!s.sparkles) return
    for (const star of stars.current) {
      const cur = current[star.key]
      if (!cur) continue
      const sx = Math.round(
        (star.xi / Math.max(s.dataLength - 1, 1)) * (cols - 1)
      )
      if (sx > revealCols) continue
      const top = cur.top[sx] ?? 0
      const floor = cur.floor[sx] ?? rows - 1
      const sy = Math.round(top + star.depth * (floor - top))
      const tw = reduce ? 0.85 : (Math.sin((tick + star.phase) * 0.35) + 1) / 2
      const lift = tw * (0.7 + 0.3 * intensity)
      if (lift < 0.55 || sy < 0 || sy >= rows) continue
      const starColor = s.seedOf(star.key).fill
      c.fillStyle = rgb(starColor, 1, lift)
      c.fillRect(sx, sy, 1, 1)
      if (tw > 0.9) {
        c.fillStyle = rgb(starColor, 1, lift * 0.6 * (tw - 0.9) * 10)
        c.fillRect(sx - 1, sy, 1, 1)
        c.fillRect(sx + 1, sy, 1, 1)
        c.fillRect(sx, sy - 1, 1, 1)
        c.fillRect(sx, sy + 1, 1, 1)
      }
    }
  }

  raf = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(raf)
}

/**
 * Continuous dither canvas for area and line charts. Each series is reduced to a
 * `[top, floor]` band per backing column: areas fill from their value line down
 * to their floor; lines fill only a thin glow band hugging the line.
 */
export const CartesianCanvas = defineComponent({
  name: "CartesianCanvas",
  setup() {
    const ctx = useChart()
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const bloomRef = ref<HTMLCanvasElement | null>(null)

    const backing = computed(() => backingSize(ctx.plot.width, ctx.plot.height))

    const targets = computed<Record<string, Surface>>(() => {
      const out: Record<string, Surface> = {}
      if (!ctx.ready) return out
      const { cols, rows } = backing.value
      const h0 = ctx.plot.height || 1
      const glow = Math.max(6, Math.round(rows * 0.16))
      const defaultKind = ctx.chartType === "line" ? "line" : "area"
      for (const key of ctx.configKeys) {
        const band = ctx.bands[key]
        if (!band) continue
        const line = (ctx.seriesSpecs[key]?.kind ?? defaultKind) === "line"
        const top = band.map((b) => (ctx.y(b[1]) / h0) * (rows - 1))
        const floor = band.map((b, i) =>
          line ? Math.min(rows - 1, top[i] + glow) : (ctx.y(b[0]) / h0) * (rows - 1)
        )
        out[key] = { top: resample(top, cols), floor: resample(floor, cols) }
      }
      return out
    })

    const stars = computed<Star[]>(() => {
      const out: Star[] = []
      const { cols } = backing.value
      const per = Math.max(4, Math.round(cols / 14))
      ctx.configKeys.forEach((key, k) => {
        for (let i = 0; i < per; i++) {
          const seed = i * 67 + 13 + k * 131
          out.push({
            key,
            xi: seed % Math.max(ctx.dataLength, 1),
            depth: ((seed * 53 + 7) % 100) / 100,
            phase: (seed * 41) % 360,
          })
        }
      })
      return out
    })

    const stateBox: Box<ChartContextValue> = { current: ctx }
    const targetsBox: Box<Record<string, Surface>> = {
      get current() {
        return targets.value
      },
    }
    const starsBox: Box<Star[]> = {
      get current() {
        return stars.value
      },
    }

    let stop: (() => void) | undefined
    const restart = () => {
      stop?.()
      stop = undefined
      const canvas = canvasRef.value
      if (!canvas) return
      const { cols, rows } = backing.value
      stop = startCartesianLoop({
        canvas,
        bloomCanvas: bloomRef.value,
        cols,
        rows,
        state: stateBox,
        targets: targetsBox,
        stars: starsBox,
      })
    }

    onMounted(restart)
    watch(() => [backing.value.cols, backing.value.rows], restart)
    onBeforeUnmount(() => stop?.())

    return () => {
      const bloomActive = ctx.bloomOnHover
        ? ctx.isMouseInChart || ctx.hovered
        : true
      const bloom = bloomLayerStyle(ctx.bloom, bloomActive)
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
