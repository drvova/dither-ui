<script lang="ts" module>
  // Framework-agnostic engine copied verbatim from the Vue `cartesian-canvas.ts`
  // (`startCartesianLoop` + `paintFill` + their types). They read live chart
  // state through `Box<T> = { current: T }` mutable refs, so only the thin
  // component wrapper below differs between Vue and Svelte.
  import type { ChartContextValue } from "./chart-context"
  import {
    resolveEasing,
    paintColumn,
    prefersReducedMotion,
    revealFromSeed,
    colNoise,
    sparklesFromSeed,
    effectFromSeed,
    type Glyph,
  } from "../engine/dither-paint"
  import { rgb } from "../engine/palette"
  import { clearRasterBuffer, createRasterBuffer, putRasterBuffer } from "../engine/raster"

  type Star = { key: string; xi: number; depth: number; phase: number }
  type Surface = { top: number[]; floor: number[] }
  type Box<T> = { readonly current: T }

  type LoopArgs = {
    canvas: HTMLCanvasElement
    bloomCanvas: HTMLCanvasElement | null
    visible: () => boolean
    cols: number
    rows: number
    state: Box<ChartContextValue>
    targets: Box<Record<string, Surface>>
    stars: Box<Star[]>
    spark: Box<ReturnType<typeof sparklesFromSeed> | { twinkleFreq: number; starBase: number; starRange: number; burstThreshold: number; starCrossAlpha: number; crosshairAlpha: number }>
    effect: Box<ReturnType<typeof effectFromSeed>>
    glyph: Box<Glyph>
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
    visible,
    cols,
    rows,
    state,
    targets,
    stars,
    spark,
    effect,
    glyph,
  }: LoopArgs): { stop: () => void; wake: () => void } | undefined {
    const c = canvas.getContext("2d", { willReadFrequently: true })
    if (!c || cols <= 0 || rows <= 0) return undefined
    canvas.width = cols
    canvas.height = rows

    const frame = createRasterBuffer(cols, rows)
    let imageData: ImageData | undefined

    const bloomCtx = bloomCanvas?.getContext("2d") ?? null
    if (bloomCanvas) {
      bloomCanvas.width = cols
      bloomCanvas.height = rows
    }

    const reduce = prefersReducedMotion()
    const EASE = reduce ? 1 : 0.18
    const current: Record<string, Surface> = {}

    const paintFill = (intensity: number, reveal: number) => {
      clearRasterBuffer(frame)
      const s = state.current
      const stacked = s.stackType === "stacked" || s.stackType === "percent"
      // Seeded reveal: a clean sweep by default, a scattered dissolve when the
      // chart's seed asks for it. `rev.jitter === 0` keeps the fast break path.
      const rev = s.seed !== undefined ? revealFromSeed(s.seed) : { reverse: false, jitter: 0 }
      const seedInt = Math.round(s.seed ?? 0)
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
        const dim =
          (emphasis !== null && emphasis !== key ? s.dimOpacity : 1) *
          (s.seriesSpecs[key]?.opacity ?? 1)
        const sparse = stacked ? 0 : si * 0.14
        for (let x = 0; x < cols; x++) {
          if (rev.jitter === 0) {
            // Clean sweep (optionally reversed) — break once past the edge.
            const pos = rev.reverse ? cols - 1 - x : x
            if (pos > revealCols) continue
          } else {
            // Dissolve: per-column threshold jittered around its sweep position,
            // so columns develop out of order into the final fill.
            const base = rev.reverse ? 1 - x / cols : x / cols
            if (base + (colNoise(x, seedInt) - 0.5) * rev.jitter > reveal) continue
          }
          paintColumn(frame, x, cur.top[x] ?? 0, cur.floor[x] ?? 0, seed, {
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
    let lastAnimate = state.current.animate && !reduce
    let lastDuration = state.current.animationDuration
    let lastDelay = state.current.animationDelay
    let entranceReported = !lastAnimate
    let intensity = 0
    let needsFill = true
    let lastPaintSig = ""
    let lastBloomSig = ""
    let lastSelected: string | null | undefined = Symbol() as never
    let lastMarker: number | null | undefined = Symbol() as never
    let lastCrosshair: boolean | undefined
    const schedule = () => {
      if (!raf && visible()) raf = requestAnimationFrame(draw)
    }

    const draw = (now: number) => {
      raf = 0
      if (!visible()) return // off-screen: pause until the visibility gate wakes it
      const s = state.current
      if (!s.ready) return
      const tgt = targets.current
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
        entranceReported = !animate
        needsFill = true
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

      const itTarget =
        s.hoverLift && (s.isMouseInChart || s.hovered) ? s.hoverStrength : 0
      let settling = false
      if (Math.abs(intensity - itTarget) > 0.001) {
        intensity += (itTarget - intensity) * 0.16
        settling = true
        needsFill = true
      } else intensity = itTarget

      const marker = s.hoverIndex != null ? s.hoverIndex : s.markerIndex
      const sparkleMotion = s.sparkles && !reduce
      const winkDue =
        sparkleMotion && now - last >= 100 / Math.max(0.1, s.sparkleSpeed)
      const paintSig = `${s.stackType}|${s.dimOpacity}|${JSON.stringify(s.configKeys.map((k) => [k, s.config[k]?.color, s.seriesSpecs[k]]))}`
      const bloomSig = `${s.bloom}|${s.bloomOnHover}|${s.isMouseInChart}|${s.hovered}`
      const sigChanged = paintSig !== lastPaintSig
      if (sigChanged) {
        lastPaintSig = paintSig
        needsFill = true
      }
      if (bloomSig !== lastBloomSig) {
        lastBloomSig = bloomSig
        needsFill = true
      }
      if (marker !== lastMarker || s.crosshair !== lastCrosshair) {
        lastMarker = marker
        lastCrosshair = s.crosshair
        needsFill = true
      }
      if (!(moving || settling || (sparkleMotion && winkDue) || progChanged || sigChanged || needsFill)) {
        if (sparkleMotion) schedule()
        return
      }
      if (progChanged) {
        lastProg = prog
        needsFill = true
      }
      if (winkDue) {
        last = now
        tick += 1
      }

      const reveal = animate ? resolveEasing(s.easing)(prog) : 1
      const revealCols = reveal * cols

      if (needsFill) {
        paintFill(intensity, reveal)
        needsFill = false
      }
      c.clearRect(0, 0, cols, rows)
      imageData = putRasterBuffer(c, frame, imageData)

      const mx =
        marker != null && s.dataLength > 1
          ? Math.round((marker / (s.dataLength - 1)) * (cols - 1))
          : -1
      if (s.crosshair && mx >= 0 && mx <= revealCols) {
        for (const key of s.configKeys) {
          const cur = current[key]
          if (!cur) continue
          const seed = s.seedOf(key)
          const my = Math.round(cur.top[mx] ?? 0)
          c.fillStyle = rgb(seed.fill, 1, spark.current.crosshairAlpha)
          for (let y = my; y < rows; y++) c.fillRect(mx, y, 1, 1)
          c.fillStyle = rgb(seed.fill)
          c.fillRect(mx - 1, my - 1, 3, 3)
        }
      }

      if (!s.sparkles) {
        if (bloomCtx && s.bloom !== "off" && (!s.bloomOnHover || s.isMouseInChart || s.hovered)) {
          bloomCtx.clearRect(0, 0, cols, rows)
          bloomCtx.drawImage(canvas, 0, 0)
        }
        if ((animate && !entranceReported) || moving || settling) schedule()
        return
      }
      // Generative particle field — one loop, infinite motions. Each particle
      // drifts by the seeded velocity + gravity, twinkles, and trails; where it
      // lands in the band is blended by `flow` between the value line and free
      // scatter. Classic sparkle/rain/comet are just regions of this space.
      const fx = effect.current
      const sxOf = (xi: number) => (xi / Math.max(s.dataLength - 1, 1)) * (cols - 1)
      const T = reduce ? 0 : tick * fx.speed * 0.02
      for (const star of stars.current) {
        const cur = current[star.key]
        if (!cur) continue
        // Life clock: each particle cycles 0..1, offset by its phase.
        const life = ((T + star.phase * 0.03) % 1 + 1) % 1
        // Horizontal drift, wrapped across the revealed span.
        const reach = Math.max(1, Math.min(revealCols, cols - 1))
        const baseX = sxOf(star.xi)
        const sx = Math.round((((baseX + fx.driftX * life * reach) % (reach + 1)) + (reach + 1)) % (reach + 1))
        if (sx > revealCols) continue
        const top = cur.top[sx] ?? 0
        const floor = cur.floor[sx] ?? rows - 1
        const band = Math.max(1, floor - top)
        // Vertical position: `flow` blends value-line-locked vs free-scatter;
        // driftY + gravity push it through the band over its life.
        const scatter = star.depth * fx.spread
        const drift = fx.driftY * life + 0.5 * fx.gravity * life * life
        const vy = ((scatter + drift) % 1 + 1) % 1
        const sy = Math.round(top + fx.flow * vy * band)
        if (sy < 0 || sy >= rows) continue
        const col = s.seedOf(star.key).fill
        // Twinkle: blends steady (twinkleAmt 0) to full wink (1).
        const osc = reduce ? 0.85 : (Math.sin((tick + star.phase) * fx.twinkleFreq) + 1) / 2
        const tw = 1 - fx.twinkleAmt + fx.twinkleAmt * osc
        const lift = tw * (fx.brightBase + 0.3 * intensity)
        if (lift < 0.4) continue
        // Stamp the seeded glyph — a dot, plus, x, streak or asterisk. Arms grow
        // at brightness peaks (the burst folded into the shape itself).
        const grow = fx.burst > 0.15 && tw > 0.85
        for (const gp of glyph.current) {
          const gx = sx + gp.dx
          const gy = sy + gp.dy
          if (gx < 0 || gx > revealCols || gy < 0 || gy >= rows) continue
          c.fillStyle = rgb(col, 1, lift * gp.a)
          c.fillRect(gx, gy, 1, 1)
          // Burst: extend each arm one cell further at a peak.
          if (grow && (gp.dx !== 0 || gp.dy !== 0)) {
            const ex = sx + gp.dx * 2
            const ey = sy + gp.dy * 2
            if (ex >= 0 && ex <= revealCols && ey >= 0 && ey < rows) {
              c.fillStyle = rgb(col, 1, lift * fx.burst * (tw - 0.85) * 6)
              c.fillRect(ex, ey, 1, 1)
            }
          }
        }
        // Trail behind the motion vector (dir from drift signs).
        if (fx.trail > 0) {
          const dxs = fx.driftX >= 0 ? -1 : 1
          const dys = fx.driftY + fx.gravity >= 0 ? -1 : 1
          for (let t = 1; t <= fx.trail; t++) {
            const tx = sx + dxs * t
            const ty = sy + (fx.flow > 0.3 ? dys * t : 0)
            if (tx < 0 || tx > revealCols || ty < 0 || ty >= rows) break
            c.fillStyle = rgb(col, 1, lift * (1 - t / (fx.trail + 1)) * 0.7)
            c.fillRect(tx, ty, 1, 1)
          }
        }
      }
      if (bloomCtx && s.bloom !== "off" && (!s.bloomOnHover || s.isMouseInChart || s.hovered)) {
        bloomCtx.clearRect(0, 0, cols, rows)
        bloomCtx.drawImage(canvas, 0, 0)
      }
      if (sparkleMotion || (animate && !entranceReported) || moving || settling) schedule()
    }

    if (visible()) schedule()
    return {
      stop: () => cancelAnimationFrame(raf),
      wake: () => {
        schedule()
      },
    }
  }
</script>

<script lang="ts">
  import { useChart } from "./chart-context"
  import { chartCanvas, type ChartCanvasParams } from "./chart-canvas"
  import {
    backingSize,
    bloomLayerStyle,
    sparklesFromSeed as sparkFromSeed,
    effectFromSeed as edgeFromSeed,
    glyphFromSeed,
    mulberry32,
    resample,
  } from "../engine/dither-paint"

  const ctx = useChart()

  let bloomEl = $state<HTMLCanvasElement | null>(null)

  const backing = $derived(backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))

  const targets = $derived.by<Record<string, Surface>>(() => {
    const out: Record<string, Surface> = {}
    if (!ctx.ready) return out
    const { cols, rows } = backing
    const h0 = ctx.plot.height || 1
    const glow = Math.max(2, Math.round(rows * ctx.glowSize))
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

  // Sparkle character — seed-derived when the chart has a master seed.
  const spark = $derived(
    ctx.seed !== undefined
      ? sparkFromSeed(ctx.seed)
      : {
          twinkleFreq: 0.35,
          starBase: 0.7,
          starRange: 0.3,
          burstThreshold: 0.9,
          starCrossAlpha: 0.6,
          crosshairAlpha: 0.55,
        }
  )

  // Generative live-edge motion. A dedicated `effect` seed pins it; else the
  // master seed drives it; else a gentle sparkle-like default (steady, no
  // drift, light twinkle) so unseeded charts keep the classic feel.
  const effectKey = $derived(ctx.effect ?? ctx.seed)
  const effect = $derived(
    effectKey !== undefined
      ? edgeFromSeed(effectKey)
      : {
          driftX: 0,
          driftY: 0,
          gravity: 0,
          twinkleAmt: 1,
          twinkleFreq: 0.35,
          trail: 0,
          spread: 1,
          flow: 1,
          burst: 0.6,
          brightBase: 0.7,
          speed: 1,
        }
  )
  // The particle shape — seeded from the same key; default is a plain dot.
  const glyph = $derived<Glyph>(
    effectKey !== undefined ? glyphFromSeed(effectKey) : [{ dx: 0, dy: 0, a: 1 }]
  )

  const stars = $derived.by<Star[]>(() => {
    const out: Star[] = []
    const { cols } = backing
    const per = Math.max(1, Math.round((cols / 14) * ctx.sparkleDensity))
    ctx.configKeys.forEach((key, k) => {
      for (let i = 0; i < per; i++) {
        // Seed-derived position and phase when a master seed exists;
        // otherwise the legacy linear hash (unchanged behavior).
        if (ctx.seed !== undefined) {
          const rand = mulberry32(ctx.seed ^ (k * 7919 + i * 31 + 0x5bd1e995))
          out.push({
            key,
            xi: Math.floor(rand() * Math.max(ctx.dataLength, 1)),
            depth: rand(),
            phase: rand() * 360,
          })
        } else {
          const h = i * 67 + 13 + k * 131
          out.push({
            key,
            xi: h % Math.max(ctx.dataLength, 1),
            depth: ((h * 53 + 7) % 100) / 100,
            phase: (h * 41) % 360,
          })
        }
      }
    })
    return out
  })

  // Getter boxes: the loop reads live `$derived`/context values every frame, the
  // same way the Vue component's `{ get current() { return x.value } }` boxes did.
  const stateBox: Box<ChartContextValue> = { current: ctx }
  const targetsBox: Box<Record<string, Surface>> = {
    get current() {
      return targets
    },
  }
  const starsBox: Box<Star[]> = {
    get current() {
      return stars
    },
  }
  const sparkBox = {
    get current() {
      return spark
    },
  }
  const effectBox = {
    get current() {
      return effect
    },
  }
  const glyphBox: Box<Glyph> = {
    get current() {
      return glyph
    },
  }

  const start = (canvas: HTMLCanvasElement, visible: () => boolean) =>
    startCartesianLoop({
      canvas,
      bloomCanvas: bloomEl,
      visible,
      cols: backing.cols,
      rows: backing.rows,
      state: stateBox,
      targets: targetsBox,
      stars: starsBox,
      spark: sparkBox,
      effect: effectBox,
      glyph: glyphBox,
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
      ctx.revision,
      ctx.configKeys.map((key) => [key, ctx.config[key]?.color]),
      ctx.seriesSpecs,
      ctx.selectedDataKey,
      ctx.focusDataKey,
      ctx.hoverIndex,
      ctx.markerIndex,
      ctx.isMouseInChart,
      ctx.hovered,
      ctx.animate,
      ctx.animationDuration,
      ctx.animationDelay,
      ctx.easing,
      ctx.sparkles,
      ctx.hoverLift,
      ctx.sparkleDensity,
      ctx.sparkleSpeed,
      ctx.hoverStrength,
      ctx.glowSize,
      ctx.dimOpacity,
      ctx.bloom,
      ctx.bloomOnHover,
      ctx.crosshair,
    ]),
  })

  const bloomActive = $derived(
    ctx.bloomOnHover ? ctx.isMouseInChart || ctx.hovered : true
  )
  const bloom = $derived(bloomLayerStyle(ctx.bloom, bloomActive))
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
