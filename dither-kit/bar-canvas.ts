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
import { useCanvasVisibility } from "./use-visibility"
import {
  backingSize,
  bloomLayerStyle,
  clamp01,
  resolveEasing,
  paintColumn,
  prefersReducedMotion,
} from "./dither-paint"

type Bars = { top: number[]; base: number[] } // per data index, in backing rows
type Box<T> = { readonly current: T }


type LoopArgs = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
  visible: () => boolean
  cols: number
  rows: number
  width: number
  state: Box<ChartContextValue>
  targets: Box<Record<string, Bars>>
}

/** RAF paint loop for bar charts — framework-agnostic, reads `state.current`. */
function startBarLoop({
  canvas,
  bloomCanvas,
  visible,
  cols,
  rows,
  width,
  state,
  targets,
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
  const animate = state.current.animate && !reduce
  const duration = state.current.animationDuration
  const fx = cols / Math.max(width, 1)

  const barProgress = (i: number, len: number, prog: number) => {
    if (!animate) return 1
    const st = Math.min(0.9, Math.max(0, state.current.stagger))
    const start = len > 1 ? (i / (len - 1)) * st : 0
    return resolveEasing(state.current.easing)(clamp01((prog - start) / (1 - st)))
  }

  let intensity = 0
  const paint = (prog: number) => {
    const s = state.current
    c.clearRect(0, 0, cols, rows)
    const stacked = s.stackType === "stacked" || s.stackType === "percent"
    const keys = s.configKeys
    keys.forEach((key, si) => {
      const t = targets.current[key]
      if (!t) return
      const seed = s.seedOf(key)
      const variant = s.seriesSpecs[key]?.variant ?? "gradient"
      const emphasis = s.selectedDataKey ?? s.focusDataKey
      const selDim =
        (emphasis !== null && emphasis !== key ? s.dimOpacity : 1) *
        (s.seriesSpecs[key]?.opacity ?? 1)
      for (let i = 0; i < s.dataLength; i++) {
        const bp = barProgress(i, s.dataLength, prog)
        const base = t.base[i] ?? rows - 1
        const top = base + ((t.top[i] ?? base) - base) * bp
        const active = s.hoverIndex === i
        const hoverDim =
          s.hoverIndex != null && !active && s.isMouseInChart ? 0.5 : 1
        const slot = s.barSlot(i, si, keys.length)
        const c0 = Math.round(slot.x * fx)
        const c1 = Math.round((slot.x + slot.width) * fx)
        for (let x = c0; x < c1; x++) {
          paintColumn(c, x, top, base, seed, {
            variant,
            intensity: intensity + (active ? 0.4 : 0),
            dim: selDim * hoverDim,
            stacked,
          })
        }
      }
    })
  }

  let raf = 0
  let animStart = 0
  let lastProg = -1
  let lastRevision = state.current.revision
  let needsFill = true
  let lastPaintSig = ""
  let lastSelected: string | null | undefined = Symbol() as never
  let lastHover: number | null | undefined = Symbol() as never

  const draw = (now: number) => {
    if (!visible()) {
      raf = 0
      return // off-screen: pause the loop; useCanvasVisibility wakes it on re-entry
    }
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
    if (s.revision !== lastRevision) {
      lastRevision = s.revision
      animStart = 0
      lastProg = -1
    }
    if (!animStart) animStart = now
    const prog = animate
      ? Math.min(1, Math.max(0, (now - animStart - s.animationDelay) / duration))
      : 1

    if (prog !== lastProg) {
      lastProg = prog
      needsFill = true
    }
    const emphasisNow = s.selectedDataKey ?? s.focusDataKey
    if (emphasisNow !== lastSelected) {
      lastSelected = emphasisNow
      needsFill = true
    }
    if (s.hoverIndex !== lastHover) {
      lastHover = s.hoverIndex
      needsFill = true
    }
    const itTarget =
      s.hoverLift && (s.isMouseInChart || s.hovered) ? s.hoverStrength : 0
    if (Math.abs(intensity - itTarget) > 0.001) {
      intensity += (itTarget - intensity) * (reduce ? 1 : 0.16)
      needsFill = true
    } else intensity = itTarget

    const paintSig = `${s.stackType}|${s.configKeys
      .map((k) => JSON.stringify(s.seriesSpecs[k]?.variant ?? ""))
      .join(",")}`
    if (paintSig !== lastPaintSig) {
      lastPaintSig = paintSig
      needsFill = true
    }

    if (!needsFill) return
    paint(prog)
    needsFill = false
  }

  raf = requestAnimationFrame(draw)
  return {
    stop: () => cancelAnimationFrame(raf),
    wake: () => {
      if (!raf) raf = requestAnimationFrame(draw)
    },
  }
}

/**
 * Dither canvas for bar charts. Each category owns a band; grouped series split
 * it into side-by-side bars, stacked series share its full width and pile in y.
 * Bars grow up from their base in a staggered left-to-right wave.
 */
export const BarCanvas = defineComponent({
  name: "BarCanvas",
  setup() {
    const ctx = useChart()
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    let loop: { stop: () => void; wake: () => void } | undefined
    const isVisible = useCanvasVisibility(canvasRef, () => loop?.wake())
    const bloomRef = ref<HTMLCanvasElement | null>(null)
    const backing = computed(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))

    const targets = computed<Record<string, Bars>>(() => {
      const out: Record<string, Bars> = {}
      if (!ctx.ready) return out
      const { rows } = backing.value
      const h0 = ctx.plot.height || 1
      for (const key of ctx.configKeys) {
        const band = ctx.bands[key]
        if (!band) continue
        out[key] = {
          top: band.map((b) => (ctx.y(b[1]) / h0) * (rows - 1)),
          base: band.map((b) => (ctx.y(b[0]) / h0) * (rows - 1)),
        }
      }
      return out
    })

    const stateBox: Box<ChartContextValue> = { current: ctx }
    const targetsBox: Box<Record<string, Bars>> = {
      get current() {
        return targets.value
      },
    }

    const restart = () => {
      loop?.stop()
      loop = undefined
      const canvas = canvasRef.value
      if (!canvas) return
      const { cols, rows } = backing.value
      loop = startBarLoop({
        canvas,
        visible: isVisible,
        bloomCanvas: bloomRef.value,
        cols,
        rows,
        width: ctx.plot.width,
        state: stateBox,
        targets: targetsBox,
      })
    }

    onMounted(restart)
    watch(
      () => [backing.value.cols, backing.value.rows, ctx.plot.width],
      restart
    )
    onBeforeUnmount(() => loop?.stop())

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
