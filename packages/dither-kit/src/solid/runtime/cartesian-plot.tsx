// Solid's binding of the area and line chart's print: the fill as SVG (paths or a cell
// PNG, `engine/chart-svg.ts`), the live edge's sparkles over it, and a mark per
// data index that shows its crosshair and its values under the pointer.

import { createMemo, onMount, Show } from "solid-js"
import {
  blankPrint,
  cartesianSurfaces,
  crosshairAt,
  escapeXml,
  headingOf,
  paintCartesian,
  printMarkup,
  sparklesAt,
  sparklesMarkup,
  type Star,
} from "../../engine/chart-svg"
import {
  backingSize,
  effectFromSeed,
  glyphFromSeed,
  mulberry32,
  prefersReducedMotion,
  revealFromSeed,
  sparklesFromSeed,
} from "../../engine/dither-paint"
import { useChart } from "./chart-context"
import { Cells, PlotFrame, Print, spokenValue } from "./chart-plot"

/** The edge motion with no seed: steady, no drift, a light twinkle. */
const STILL_EDGE = {
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

/**
 * The area and line chart's print. Each series is reduced to a `[top,
 * floor]` band per backing column: areas fill from their value line down to
 * their floor; lines fill only a thin glow band hugging the line.
 */
export function CartesianPlot() {
  const ctx = useChart()
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
  const surfaces = createMemo(() => cartesianSurfaces(ctx, backing().cols, backing().rows))
  const inks = createMemo(() => {
    const { cols, rows } = backing()
    const { frame } = blankPrint(cols, rows)
    paintCartesian(frame, ctx, surfaces())
    return printMarkup(frame)[0]
  })

  // The live edge: a dedicated `effect` seed pins its motion, else the
  // master seed, else the still default; its glyph from the same key.
  const edgeKey = () => ctx.effect ?? ctx.seed
  const stars = createMemo<Star[]>(() => {
    const out: Star[] = []
    const per = Math.max(1, Math.round((backing().cols / 14) * ctx.sparkleDensity))
    ctx.configKeys.forEach((key, k) => {
      for (let i = 0; i < per; i++) {
        if (ctx.seed !== undefined) {
          const rand = mulberry32(ctx.seed ^ (k * 7919 + i * 31 + 0x5bd1e995))
          out.push({ key, xi: Math.floor(rand() * Math.max(ctx.dataLength, 1)), depth: rand(), phase: rand() * 360 })
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
  const edge = createMemo(() => {
    const s = edgeKey()
    return s !== undefined ? effectFromSeed(s) : STILL_EDGE
  })
  const sparkles = createMemo(() => {
    if (!ctx.sparkles) return []
    const s = edgeKey()
    const glyph = s !== undefined ? glyphFromSeed(s) : [{ dx: 0, dy: 0, a: 1 }]
    return sparklesAt(ctx, surfaces(), stars(), edge(), glyph, backing().cols, backing().rows)
  })
  // A wink's period: the canvas stepped its stars every 100ms / speed and
  // waved them through a sine of `twinkleFreq` a step.
  const twinkle = createMemo(() => {
    const step = 100 / Math.max(0.1, ctx.sparkleSpeed)
    const freq = ctx.seed !== undefined ? sparklesFromSeed(ctx.seed).twinkleFreq : edge().twinkleFreq
    return { half: (Math.PI / Math.max(0.01, freq)) * step, low: 1 - edge().twinkleAmt }
  })

  const reverse = createMemo(() => ctx.seed !== undefined && revealFromSeed(ctx.seed).reverse)
  onMount(() => {
    if (!ctx.animate || prefersReducedMotion()) ctx.markEntranceDone()
  })

  // A mark a data index: its column of the plot, its crosshair, its values.
  const marks = createMemo(() => ctx.interactive || ctx.markerIndex !== null)
  const columnOf = (i: number) => {
    const at = (j: number) => ctx.xCenter(j) ?? 0
    const left = i === 0 ? 0 : (at(i - 1) + at(i)) / 2
    const right = i === ctx.dataLength - 1 ? ctx.plot.width : (at(i) + at(i + 1)) / 2
    return { left, width: Math.max(0, right - left) }
  }

  // One markup string (a mark's crosshair cells and values are dozens of
  // elements a chart; as elements each carried a hydration key), its words
  // escaped. Hover is the stylesheet's; `markerIndex` marks one.
  const n = (v: number) => +v.toFixed(2)
  const marksMarkup = createMemo(() => {
    const { cols, rows } = backing()
    return ctx.data
      .map((row, i) => {
        const column = columnOf(i)
        const values = ctx.configKeys.map((key) => `${ctx.common.labelOf(key)} ${spokenValue(row[key])}`)
        const x = ctx.xCenter(i) ?? 0
        const right = x > ctx.plot.width * 0.6
        const cross = ctx.crosshair
          ? crosshairAt(ctx, surfaces(), cols, i)
              .map(
                (c) =>
                  `<rect x="${c.x}" y="${c.y}" width="1" height="${Math.max(0, rows - c.y)}" fill="${c.color}" fill-opacity="${n(c.alpha)}"/>` +
                  `<rect x="${c.x - 1}" y="${c.y - 1}" width="3" height="3" fill="${c.color}"/>`,
              )
              .join("")
          : ""
        const texts = values
          .map(
            (text, k) =>
              `<text class="dk-chart-value" x="${n(x + (right ? -6 : 6))}" y="${2 + k * 12}" text-anchor="${right ? "end" : "start"}" dominant-baseline="hanging">${escapeXml(text)}</text>`,
          )
          .join("")
        const label = escapeXml(`${headingOf(row, ctx.configKeys, i)}: ${values.join(", ")}`)
        return (
          `<g class="dk-chart-mark" role="img" aria-label="${label}"${ctx.markerIndex === i ? " data-marked" : ""}>` +
          `<rect x="${n(column.left)}" width="${n(column.width)}" height="${n(ctx.plot.height)}" fill="transparent"/>` +
          `<g class="dk-chart-reveal"><svg class="dk-chart-print" width="${n(ctx.plot.width)}" height="${n(ctx.plot.height)}" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none">${cross}</svg>${texts}</g></g>`
        )
      })
      .join("")
  })

  return (
    <PlotFrame
      chart={ctx}
      marks={
        <Show when={marks()}>
          <g innerHTML={marksMarkup()} />
        </Show>
      }
    >
      <g
        class="dk-chart-sweep"
        data-reverse={reverse() ? "" : undefined}
        onAnimationEnd={(e) => e.target === e.currentTarget && ctx.markEntranceDone()}
      >
        <g class="dk-chart-fill">
          <Cells plot={ctx.plot} cols={backing().cols} rows={backing().rows}>
            <Print markup={inks()} />
          </Cells>
        </g>
        <Show when={sparkles().length > 0}>
          <Cells plot={ctx.plot} cols={backing().cols} rows={backing().rows}>
            <g
              style={{
                "--dk-twinkle": `${Math.round(twinkle().half)}ms`,
                "--dk-twinkle-low": twinkle().low.toFixed(3),
              }}
              innerHTML={sparklesMarkup(sparkles(), twinkle().half)}
            />
          </Cells>
        </Show>
      </g>
    </PlotFrame>
  )
}
