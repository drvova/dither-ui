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
import { rgb } from "./palette"
import { sliceAtAngle } from "./polar"
import { type PolarChartContextValue, usePolarChart } from "./polar-context"
import { useCanvasVisibility } from "./use-visibility"

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
  let popEase = 0
  let needsFill = true
  let lastPaintSig = ""
  let lastSelected: string | null | undefined = Symbol() as never
  let lastHover: number | null | undefined = Symbol() as never

  const paint = (prog: number) => {
    const s = state.current
    const slices = s.pie
    if (!slices) return
    c.clearRect(0, 0, cols, rows)
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
          c.fillStyle = rgb(seed.fill, 1, selDim)
          c.fillRect(x, y, 1, 1)
          continue
        }
        const tex = resolveTexture(variant)
        const mat = resolveMatrix(variant)
        const raw = (r - innerR) / Math.max(localOuter - innerR, 1)
        const density = 1 - tex.ramp * (1 - raw)
        if (tex.hatch >= 2 && ((x + y) % tex.hatch) >= tex.hatch / 2) continue
        const lit = density > mat[y & 3][x & 3] - 0.1 * it - tex.density
        if (tex.gaps && !lit) continue
        const k = (tex.alphaFloor + density * tex.alphaRange) * (1 + tex.intensityLift * it)
        const alpha = Math.min(1, (lit ? k : k * tex.offTier) * selDim)
        c.fillStyle = rgb(seed.fill, 1, alpha)
        c.fillRect(x, y, 1, 1)
      }
    }
  }

  const draw = (now: number) => {
    if (!visible()) {
      raf = 0
      return // off-screen: pause the loop; useCanvasVisibility wakes it on re-entry
    }
    raf = requestAnimationFrame(draw)
    const s = state.current
    if (!s.ready || !s.pie) return
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
      popEase = 0
      needsFill = true
    }
    const itTarget = s.hoverLift && s.isMouseInChart ? s.hoverStrength : 0
    if (Math.abs(intensity - itTarget) > 0.001) {
      intensity += (itTarget - intensity) * (reduce ? 1 : 0.16)
      needsFill = true
    } else intensity = itTarget
    const popTarget = s.hoverIndex != null ? 1 : 0
    if (Math.abs(popEase - popTarget) > 0.001) {
      popEase += (popTarget - popEase) * (reduce ? 1 : 0.22)
      needsFill = true
    } else popEase = popTarget
    if (prog !== lastProg) {
      lastProg = prog
      needsFill = true
    }

    const paintSig = `${s.innerRadius}|${s.pie
      .map((sl) => JSON.stringify(s.variantOf(sl.name)))
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

/** Dither canvas for pie / donut charts — clockwise sweep-in, slice hover-pop. */
export const PieCanvas = defineComponent({
  name: "PieCanvas",
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
      loop = startPieLoop({
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
      ],
      restart
    )
    onBeforeUnmount(() => loop?.stop())

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
