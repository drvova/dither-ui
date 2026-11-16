// Solid's binding of the bar chart's print: every bar its own print
// (`engine/chart-svg.ts`) in a mark that grows from its base, fades while
// another is under the pointer, and shows its value.

import { createMemo, Index, onMount } from "solid-js"
import { barTargets, blankPrint, headingOf, paintBars, printMarkup } from "../../engine/chart-svg"
import { backingSize, prefersReducedMotion } from "../../engine/dither-paint"
import { clamp01 } from "../../engine/pixel"
import { useChart } from "./chart-context"
import { Cells, PlotFrame, Print, spokenValue } from "./chart-plot"

/**
 * The bar chart's print. Each category owns a band; grouped series split it
 * into side-by-side bars, stacked series share its full width and pile in
 * y. Bars grow up from their base in a staggered left-to-right wave.
 */
export function BarPlot() {
  const ctx = useChart()
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
  const print = createMemo(() => {
    const { cols, rows } = backing()
    const { frame, owner } = blankPrint(cols, rows)
    const bars = paintBars(frame, ctx, barTargets(ctx, rows), owner)
    const inks = printMarkup(frame, owner, ctx.dataLength * ctx.configKeys.length)
    return bars.map((bar) => ({ ...bar, inks: inks[bar.index * ctx.configKeys.length + bar.si] ?? "" }))
  })
  // The wave: a bar starts `stagger` of the run later across the chart and
  // grows over the rest of it.
  const timing = (i: number) => {
    const st = clamp01(Math.min(0.9, ctx.stagger))
    const start = ctx.dataLength > 1 ? (i / (ctx.dataLength - 1)) * st : 0
    return {
      "--dk-bar-delay": `${Math.round(ctx.animationDelay + start * ctx.animationDuration)}ms`,
      "--dk-bar-duration": `${Math.max(1, Math.round((1 - st) * ctx.animationDuration))}ms`,
    }
  }
  onMount(() => {
    if (!ctx.animate || prefersReducedMotion()) ctx.markEntranceDone()
  })
  const last = () => ctx.dataLength - 1

  return (
    <PlotFrame chart={ctx}>
      <g class="dk-chart-bars">
        <Index each={print()}>
          {(bar) => {
            const slot = createMemo(() => ctx.barSlot(bar().index, bar().si, ctx.configKeys.length))
            const value = createMemo(() => ctx.data[bar().index]?.[bar().key])
            const y = createMemo(() => {
              const band = ctx.bands[bar().key]?.[bar().index] ?? [0, 0]
              const top = ctx.y(band[1])
              const base = ctx.y(band[0])
              return { top: Math.min(top, base), height: Math.max(4, Math.abs(base - top)) }
            })
            return (
              <g
                class="dk-chart-bar dk-chart-mark"
                role="img"
                aria-label={`${headingOf(ctx.data[bar().index], ctx.configKeys, bar().index)}: ${ctx.common.labelOf(bar().key)} ${spokenValue(value())}`}
              >
                <g
                  class="dk-chart-grow"
                  style={timing(bar().index)}
                  onAnimationEnd={(e) =>
                    e.target === e.currentTarget && bar().index === last() && ctx.markEntranceDone()
                  }
                >
                  <g class="dk-chart-fill">
                    <Cells plot={ctx.plot} cols={backing().cols} rows={backing().rows}>
                      <Print markup={bar().inks} />
                    </Cells>
                  </g>
                </g>
                <rect x={slot().x} y={y().top} width={slot().width} height={y().height} fill="transparent" />
                <text
                  class="dk-chart-value dk-chart-reveal"
                  x={slot().x + slot().width / 2}
                  y={y().top - 4}
                  text-anchor="middle"
                >
                  {spokenValue(value())}
                </text>
              </g>
            )
          }}
        </Index>
      </g>
    </PlotFrame>
  )
}
