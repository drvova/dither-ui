// Solid's binding of the area and line chart canvas: it mounts the canvases and
// starts the framework-free paint loop (`engine/cartesian-loop.ts`).

import { createMemo } from "solid-js"
import { seriesFill } from "../../engine/chart-fill"
import { startCartesianLoop, type Star, type Surface } from "../../engine/cartesian-loop"
import type { Box, ChartContextValue } from "../../engine/chart-types"
import {
  backingSize,
  resample,
  sparklesFromSeed,
  effectFromSeed,
  glyphFromSeed,
  mulberry32,
} from "../../engine/dither-paint"
import { useChart } from "./chart-context"
import { PlotCanvas } from "./plot-canvas"

/**
 * Continuous dither canvas for area and line charts. Each series is reduced to a
 * `[top, floor]` band per backing column: areas fill from their value line down
 * to their floor; lines fill only a thin glow band hugging the line.
 */
export function CartesianCanvas() {
  const ctx = useChart()
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))

  const targets = createMemo<Record<string, Surface>>(() => {
    const out: Record<string, Surface> = {}
    if (!ctx.ready) return out
    const { cols, rows } = backing()
    const h0 = ctx.plot.height || 1
    const glow = Math.max(2, Math.round(rows * ctx.glowSize))
    const defaultKind = ctx.chartType === "line" ? "line" : "area"
    for (const key of ctx.configKeys) {
      const band = ctx.bands[key]
      if (!band) continue
      const line = (ctx.seriesSpecs[key]?.kind ?? defaultKind) === "line"
      const top = band.map((b) => (ctx.y(b[1]) / h0) * (rows - 1))
      const floor = band.map((b, i) => (line ? Math.min(rows - 1, top[i] + glow) : (ctx.y(b[0]) / h0) * (rows - 1)))
      out[key] = { top: resample(top, cols), floor: resample(floor, cols) }
    }
    return out
  })

  // Sparkle character — seed-derived when the chart has a master seed.
  const spark = createMemo(() =>
    ctx.seed !== undefined
      ? sparklesFromSeed(ctx.seed)
      : {
          twinkleFreq: 0.35,
          starBase: 0.7,
          starRange: 0.3,
          burstThreshold: 0.9,
          starCrossAlpha: 0.6,
          crosshairAlpha: 0.55,
        },
  )

  // Generative live-edge motion. A dedicated `effect` seed pins it; else the
  // master seed drives it; else a gentle sparkle-like default (steady, no
  // drift, light twinkle) so unseeded charts keep the classic feel.
  const effectKey = () => ctx.effect ?? ctx.seed
  const effect = createMemo(() => {
    const s = effectKey()
    return s !== undefined
      ? effectFromSeed(s)
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
  })
  // The particle shape — seeded from the same key; default is a plain dot.
  const glyph = createMemo(() => {
    const s = effectKey()
    return s !== undefined ? glyphFromSeed(s) : [{ dx: 0, dy: 0, a: 1 }]
  })

  const stars = createMemo<Star[]>(() => {
    const out: Star[] = []
    const { cols } = backing()
    const per = Math.max(1, Math.round((cols / 14) * ctx.sparkleDensity))
    ctx.configKeys.forEach((key, k) => {
      for (let i = 0; i < per; i++) {
        // Seed-derived position and phase when a master seed exists;
        // otherwise a linear hash of the series and the sparkle.
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

  const stateBox: Box<ChartContextValue> = { current: ctx }
  const targetsBox: Box<Record<string, Surface>> = {
    get current() {
      return targets()
    },
  }
  const starsBox: Box<Star[]> = {
    get current() {
      return stars()
    },
  }

  return (
    <PlotCanvas
      chart={ctx}
      backing={backing}
      start={(s) =>
        startCartesianLoop({
          ...s,
          state: stateBox,
          targets: targetsBox,
          stars: starsBox,
          spark: {
            get current() {
              return spark()
            },
          },
          effect: {
            get current() {
              return effect()
            },
          },
          glyph: {
            get current() {
              return glyph()
            },
          },
        })
      }
      restartOn={() => [ctx.plot.width, ctx.plot.height]}
      wakeOn={() => [
        targets(),
        ctx.revision,
        seriesFill(ctx),
        ctx.selectedDataKey,
        ctx.focusDataKey,
        ctx.hoverIndex,
        ctx.markerIndex,
        ctx.animate,
        ctx.animationDuration,
        ctx.animationDelay,
        ctx.easing,
        ctx.sparkles,
        ctx.hoverLift,
        ctx.sparkleDensity,
        ctx.sparkleSpeed,
        ctx.hoverStrength,
        ctx.crosshair,
      ]}
      hover={ctx.isMouseInChart || ctx.hovered}
    />
  )
}
