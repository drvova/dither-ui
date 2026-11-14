// Solid's binding of the polar charts' canvas: one canvas for the pie and the
// radar chart, each starting its own framework-free paint loop
// (`engine/pie-loop.ts`, `engine/radar-loop.ts`) and woken by its own fill.

import { type Component, createMemo } from "solid-js"
import { pieFill, radarFill } from "../../engine/chart-fill"
import type { ChartLoop } from "../../engine/chart-loop"
import type { Box, PolarChartContextValue } from "../../engine/chart-types"
import { backingSize } from "../../engine/dither-paint"
import { startPieLoop } from "../../engine/pie-loop"
import { startRadarLoop } from "../../engine/radar-loop"
import { PlotCanvas, type PlotStart } from "./plot-canvas"
import { usePolarChart } from "./polar-context"

type PolarStart = (
  s: PlotStart & { width: number; height: number; state: Box<PolarChartContextValue> },
) => ChartLoop | undefined

/** A polar chart's canvas over its family's loop; `fill` is what its paint
 * reads beyond what every polar chart's does. */
function PolarCanvas(props: { start: PolarStart; fill: (ctx: PolarChartContextValue) => unknown }) {
  const ctx = usePolarChart()
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
  const stateBox: Box<PolarChartContextValue> = { current: ctx }
  return (
    <PlotCanvas
      chart={ctx}
      backing={backing}
      start={(s) => props.start({ ...s, width: ctx.plot.width, height: ctx.plot.height, state: stateBox })}
      restartOn={() => [ctx.plot.width, ctx.plot.height]}
      wakeOn={() => [
        ctx.revision,
        props.fill(ctx),
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
      hover={ctx.isMouseInChart}
    />
  )
}

/** Dither canvas for pie / donut charts — clockwise sweep-in, slice hover-pop. */
export const PieCanvas: Component = () => <PolarCanvas start={startPieLoop} fill={pieFill} />

/** Dither canvas for radar charts — polygon-membership dither, scale-in. */
export const RadarCanvas: Component = () => (
  <PolarCanvas start={startRadarLoop} fill={(ctx) => [ctx.radar, radarFill(ctx)]} />
)
