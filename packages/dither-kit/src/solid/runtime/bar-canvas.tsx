// Solid's binding of the bar chart canvas: it mounts the canvases and
// starts the framework-free paint loop (`engine/bar-loop.ts`).

import { createMemo } from "solid-js"
import { type Bars, startBarLoop } from "../../engine/bar-loop"
import { seriesFill } from "../../engine/chart-fill"
import type { Box, ChartContextValue } from "../../engine/chart-types"
import { backingSize } from "../../engine/dither-paint"
import { useChart } from "./chart-context"
import { PlotCanvas } from "./plot-canvas"

/**
 * Dither canvas for bar charts. Each category owns a band; grouped series split
 * it into side-by-side bars, stacked series share its full width and pile in y.
 * Bars grow up from their base in a staggered left-to-right wave.
 */
export function BarCanvas() {
  const ctx = useChart()
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))

  const targets = createMemo<Record<string, Bars>>(() => {
    const out: Record<string, Bars> = {}
    if (!ctx.ready) return out
    const { rows } = backing()
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
      return targets()
    },
  }

  return (
    <PlotCanvas
      chart={ctx}
      backing={backing}
      start={(s) => startBarLoop({ ...s, width: ctx.plot.width, state: stateBox, targets: targetsBox })}
      restartOn={() => ctx.plot.width}
      wakeOn={() => [
        targets(),
        ctx.revision,
        seriesFill(ctx),
        ctx.selectedDataKey,
        ctx.focusDataKey,
        ctx.hoverIndex,
        ctx.animate,
        ctx.animationDuration,
        ctx.animationDelay,
        ctx.easing,
        ctx.hoverLift,
        ctx.hoverStrength,
      ]}
      hover={ctx.isMouseInChart || ctx.hovered}
    />
  )
}
