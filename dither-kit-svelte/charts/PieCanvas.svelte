<script lang="ts" module>
  // Framework-agnostic engine copied verbatim from the Vue `pie-canvas.ts`
  // (`startPieLoop` + its types).
  import type { PolarChartContextValue } from "./polar-context"
  import {
    resolveEasing,
    resolveMatrix,
    resolveTexture,
    prefersReducedMotion,
  } from "../engine/dither-paint"
  import { sliceAtAngle } from "./polar"
  import { setOrBlendRasterPixel, clearRasterBuffer, createRasterBuffer, putRasterBuffer } from "../engine/raster"

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
          const mat = resolveMatrix(variant)
          const raw = (r - innerR) / Math.max(localOuter - innerR, 1)
          const density = 1 - tex.ramp * (1 - raw)
          if (tex.hatch >= 2 && ((x + y) % tex.hatch) >= tex.hatch / 2) continue
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

    const schedule = () => {
      if (!raf && visible()) raf = requestAnimationFrame(draw)
    }

    const draw = (now: number) => {
      raf = 0
      if (!visible()) return // off-screen: pause until the visibility gate wakes it
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

    if (visible()) schedule()
    return {
      stop: () => cancelAnimationFrame(raf),
      wake: schedule,
    }
  }
</script>

<script lang="ts">
  import { usePolarChart } from "./polar-context"
  import { chartCanvas, type ChartCanvasParams } from "./chart-canvas"
  import { backingSize, bloomLayerStyle } from "../engine/dither-paint"

  const ctx = usePolarChart()

  let bloomEl = $state<HTMLCanvasElement | null>(null)

  const backing = $derived(backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
  const stateBox: Box<PolarChartContextValue> = { current: ctx }

  const start = (canvas: HTMLCanvasElement, visible: () => boolean) =>
    startPieLoop({
      canvas,
      bloomCanvas: bloomEl,
      visible,
      cols: backing.cols,
      rows: backing.rows,
      width: ctx.plot.width,
      height: ctx.plot.height,
      state: stateBox,
    })

  const params = $derived<ChartCanvasParams>({
    start,
    restartKey: JSON.stringify([
      backing.cols,
      backing.rows,
      ctx.plot.width,
      ctx.plot.height,
      ctx.precompiled,
    ]),
    wakeKey: JSON.stringify([
      ctx.ready,
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
    ]),
  })

  const bloom = $derived(
    bloomLayerStyle(ctx.bloom, ctx.bloomOnHover ? ctx.isMouseInChart : true)
  )
</script>

{#if ctx.precompiled}
  <img
    src={ctx.precompiled}
    alt=""
    aria-hidden="true"
    class="pointer-events-none absolute"
    style:left="{ctx.margins.left}px"
    style:top="{ctx.margins.top}px"
    style:width="{ctx.plot.width}px"
    style:height="{ctx.plot.height}px"
    style:z-index="10"
    style:image-rendering="pixelated"
  />
{:else}
  <canvas
    use:chartCanvas={params}
    aria-hidden="true"
    class="pointer-events-none absolute"
    style:left="{ctx.margins.left}px"
    style:top="{ctx.margins.top}px"
    style:width="{ctx.plot.width}px"
    style:height="{ctx.plot.height}px"
    style:z-index="10"
    style:image-rendering="pixelated"
  ></canvas>
  <canvas
    bind:this={bloomEl}
    aria-hidden="true"
    class="pointer-events-none absolute"
    style:left="{ctx.margins.left}px"
    style:top="{ctx.margins.top}px"
    style:width="{ctx.plot.width}px"
    style:height="{ctx.plot.height}px"
    style:z-index="10"
    style:transition="opacity 220ms ease"
    style:filter={bloom ? bloom.filter : undefined}
    style:opacity={bloom ? bloom.opacity : 0}
    style:mix-blend-mode={bloom ? bloom.mixBlendMode : undefined}
    style:image-rendering={bloom ? bloom.imageRendering : undefined}
  ></canvas>
{/if}
