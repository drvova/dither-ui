// Solid's binding of the polar charts' prints (`engine/chart-svg.ts`): the
// pie's slices, each its own print in a mark that pops out under the
// pointer, revealed by an arc going round; the radar's polygons scaling
// out of the centre, with a mark an axis that shows its vertices' values.

import { type Component, createMemo, createUniqueId, Index } from "solid-js"
import { blankPrint, paintPie, paintRadar, printMarkup, radarVertices, slicePath } from "../../engine/chart-svg"
import { backingSize } from "../../engine/dither-paint"
import { polarX, polarY } from "../../engine/polar"
import { Cells, PlotFrame, Print, spokenValue } from "./chart-plot"
import { usePolarChart } from "./polar-context"

const TAU = Math.PI * 2

/** The pie and donut chart's print: a clockwise sweep in, a slice popping
 * out under the pointer. */
export const PiePlot: Component = () => {
  const ctx = usePolarChart()
  const arc = createUniqueId()
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
  const slices = createMemo(() => {
    const pie = ctx.pie ?? []
    const { cols, rows } = backing()
    const { frame, owner } = blankPrint(cols, rows)
    paintPie(frame, ctx, owner)
    const inks = printMarkup(frame, owner, pie.length)
    const total = pie.reduce((n, s) => n + s.value, 0) || 1
    return pie.map((slice, i) => ({ ...slice, inks: inks[i], share: Math.round((slice.value / total) * 100) }))
  })
  const reach = () => ctx.outerRadius + ctx.popOut + 4

  return (
    <PlotFrame chart={ctx}>
      <mask
        id={arc}
        maskUnits="userSpaceOnUse"
        x={-20}
        y={-20}
        width={ctx.plot.width + 40}
        height={ctx.plot.height + 40}
      >
        <circle
          class="dk-chart-arc"
          cx={ctx.center.x}
          cy={ctx.center.y}
          r={reach() / 2}
          fill="none"
          stroke="#fff"
          stroke-width={reach()}
          pathLength={1}
          stroke-dasharray="1 1"
          transform={`rotate(${(((ctx.pie?.[0]?.start ?? -Math.PI / 2) * 180) / Math.PI).toFixed(3)} ${ctx.center.x} ${ctx.center.y})`}
        />
      </mask>
      <g mask={`url(#${arc})`}>
        <Index each={slices()}>
          {(slice) => (
            <g
              class="dk-chart-slice dk-chart-mark"
              role="img"
              aria-label={`${ctx.common.labelOf(slice().name)}: ${spokenValue(slice().value)} (${slice().share}%)`}
              style={{
                "--dk-pop-x": `${(Math.cos(slice().mid) * ctx.popOut).toFixed(2)}px`,
                "--dk-pop-y": `${(Math.sin(slice().mid) * ctx.popOut).toFixed(2)}px`,
              }}
            >
              <g class="dk-chart-fill">
                <Cells plot={ctx.plot} cols={backing().cols} rows={backing().rows}>
                  <Print markup={slice().inks} />
                </Cells>
              </g>
              <path
                d={slicePath(ctx.center.x, ctx.center.y, ctx.innerRadius, ctx.outerRadius, slice().start, slice().end)}
                fill="transparent"
              />
              <text
                class="dk-chart-value dk-chart-reveal"
                x={polarX(ctx.center.x, (ctx.innerRadius + ctx.outerRadius) / 2, slice().mid)}
                y={polarY(ctx.center.y, (ctx.innerRadius + ctx.outerRadius) / 2, slice().mid)}
                text-anchor="middle"
                dominant-baseline="central"
              >
                {spokenValue(slice().value)}
              </text>
            </g>
          )}
        </Index>
      </g>
    </PlotFrame>
  )
}

/** The radar chart's print: polygon-membership dither, scaling in. */
export const RadarPlot: Component = () => {
  const ctx = usePolarChart()
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
  const inks = createMemo(() => {
    const { cols, rows } = backing()
    const { frame } = blankPrint(cols, rows)
    paintRadar(frame, ctx)
    return printMarkup(frame)[0]
  })
  const vertices = createMemo(() => radarVertices(ctx, backing().cols, backing().rows))
  const axes = createMemo(() => ctx.radar?.axes ?? [])

  return (
    <PlotFrame
      chart={ctx}
      marks={
        <Index each={axes()}>
          {(axis, i) => {
            const at = createMemo(() => vertices().filter((v) => v.index === i))
            const half = () => Math.PI / Math.max(axes().length, 1)
            return (
              <g
                class="dk-chart-mark"
                role="img"
                aria-label={`${axis().label}: ${ctx.configKeys
                  .map((key) => `${ctx.common.labelOf(key)} ${spokenValue(ctx.data[i]?.[key])}`)
                  .join(", ")}`}
              >
                <path
                  d={slicePath(
                    ctx.center.x,
                    ctx.center.y,
                    0,
                    ctx.outerRadius + 10,
                    axis().angle - half(),
                    Math.min(axis().angle + half(), axis().angle - half() + TAU),
                  )}
                  fill="transparent"
                />
                <g class="dk-chart-reveal">
                  <Cells plot={ctx.plot} cols={backing().cols} rows={backing().rows}>
                    <Index each={at()}>
                      {(v) => (
                        <rect
                          x={v().x - 1}
                          y={v().y - 1}
                          width={3}
                          height={3}
                          fill={v().color}
                          fill-opacity={v().alpha < 1 ? v().alpha : undefined}
                        />
                      )}
                    </Index>
                  </Cells>
                  <Index each={ctx.configKeys}>
                    {(key, k) => {
                      const v = () => at()[k]
                      const fx = () => ctx.plot.width / Math.max(backing().cols, 1)
                      const fy = () => ctx.plot.height / Math.max(backing().rows, 1)
                      return (
                        <text
                          class="dk-chart-value"
                          x={((v()?.x ?? 0) + 0.5) * fx() + 6}
                          y={((v()?.y ?? 0) + 0.5) * fy() + k * 12}
                          dominant-baseline="central"
                        >
                          {`${ctx.common.labelOf(key())} ${spokenValue(ctx.data[i]?.[key()])}`}
                        </text>
                      )
                    }}
                  </Index>
                </g>
              </g>
            )
          }}
        </Index>
      }
    >
      <g transform={`translate(${ctx.center.x},${ctx.center.y})`}>
        <g class="dk-chart-scale">
          <g transform={`translate(${-ctx.center.x},${-ctx.center.y})`}>
            <g class="dk-chart-fill">
              <Cells plot={ctx.plot} cols={backing().cols} rows={backing().rows}>
                <Print markup={inks()} />
              </Cells>
            </g>
          </g>
        </g>
      </g>
    </PlotFrame>
  )
}
