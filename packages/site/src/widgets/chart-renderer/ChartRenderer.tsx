import { createMemo, For, type JSX, Match, Show, Switch } from "solid-js"
import { activeSeries, type ChartModel, configOf, dataOf } from "@/entities/chart"
import {
  ActiveDot,
  Area,
  AreaChart,
  Bar,
  BarChart,
  Dot,
  Grid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "dither-kit"
import { editor } from "@/entities/editor"

type Series = ReturnType<typeof activeSeries>[number]

export default function ChartRenderer(props: { chart: ChartModel }) {
  const cfg = createMemo(() => configOf(props.chart))
  const data = createMemo(() => dataOf(props.chart))
  const series = createMemo(() => activeSeries(props.chart))
  const rt = createMemo(() => editor.replayToken)

  // What every cartesian chart composes around its series: the grid and the
  // axes before them, the legend and the tooltip after.
  const frame = (): JSX.Element => (
    <>
      <Show when={props.chart.grid.on}>
        <Grid
          horizontal={props.chart.grid.horizontal}
          vertical={props.chart.grid.vertical}
          strokeDasharray={props.chart.grid.dash}
          tickCount={props.chart.grid.tickCount}
        />
      </Show>
      <Show when={props.chart.xAxis.on}>
        <XAxis dataKey="month" tickMargin={props.chart.xAxis.tickMargin} maxTicks={props.chart.xAxis.maxTicks} />
      </Show>
      <Show when={props.chart.yAxis.on}>
        <YAxis tickCount={props.chart.yAxis.tickCount} tickMargin={props.chart.yAxis.tickMargin} />
      </Show>
    </>
  )
  const dots = (s: Series): JSX.Element => (
    <>
      <Show when={s.dots.on}>
        <Dot variant={s.dots.variant} r={s.dots.r} />
      </Show>
      <Show when={s.activeDot.on}>
        <ActiveDot variant={s.activeDot.variant} r={s.activeDot.r} />
      </Show>
    </>
  )
  const foot = (labelKey?: string): JSX.Element => (
    <>
      <Show when={props.chart.legend.on}>
        <Legend align={props.chart.legend.align} isClickable={props.chart.legend.clickable} />
      </Show>
      <Show when={props.chart.tooltip.on}>
        <Tooltip labelKey={labelKey} variant={props.chart.tooltip.variant} />
      </Show>
    </>
  )

  return (
    <Switch
      fallback={
        <RadarChart
          data={data()}
          config={cfg()}
          nameKey="axis"
          bloom={props.chart.bloom}
          seed={props.chart.seed}
          animate={props.chart.animate}
          animationDuration={props.chart.animationDuration}
          animationDelay={props.chart.animationDelay}
          easing={props.chart.easing}
          hoverLift={props.chart.hoverLift}
          cell={props.chart.cell}
          falloff={props.chart.falloff}
          hoverStrength={props.chart.hoverStrength}
          dimOpacity={props.chart.dimOpacity}
          rings={props.chart.radarRings}
          replayToken={rt()}
        >
          <For each={series()}>{(s) => <Radar dataKey={s.key} variant={s.variant} />}</For>
          {foot()}
        </RadarChart>
      }
    >
      <Match when={props.chart.type === "area"}>
        <AreaChart
          data={data()}
          config={cfg()}
          margins={props.chart.margins}
          bloom={props.chart.bloom}
          seed={props.chart.seed}
          effect={props.chart.effect}
          stackType={props.chart.stackType}
          animate={props.chart.animate}
          interactive={props.chart.interactive}
          animationDuration={props.chart.animationDuration}
          animationDelay={props.chart.animationDelay}
          easing={props.chart.easing}
          sparkles={props.chart.sparkles}
          hoverLift={props.chart.hoverLift}
          cell={props.chart.cell}
          sparkleDensity={props.chart.sparkleDensity}
          sparkleSpeed={props.chart.sparkleSpeed}
          hoverStrength={props.chart.hoverStrength}
          dimOpacity={props.chart.dimOpacity}
          crosshair={props.chart.crosshair}
          replayToken={rt()}
        >
          {frame()}
          <For each={series()}>
            {(s) => (
              <Area dataKey={s.key} variant={s.variant} isClickable={s.isClickable} opacity={s.opacity}>
                {dots(s)}
              </Area>
            )}
          </For>
          {foot("month")}
        </AreaChart>
      </Match>

      <Match when={props.chart.type === "line"}>
        <LineChart
          data={data()}
          config={cfg()}
          margins={props.chart.margins}
          bloom={props.chart.bloom}
          seed={props.chart.seed}
          effect={props.chart.effect}
          animate={props.chart.animate}
          interactive={props.chart.interactive}
          animationDuration={props.chart.animationDuration}
          animationDelay={props.chart.animationDelay}
          easing={props.chart.easing}
          sparkles={props.chart.sparkles}
          hoverLift={props.chart.hoverLift}
          cell={props.chart.cell}
          sparkleDensity={props.chart.sparkleDensity}
          sparkleSpeed={props.chart.sparkleSpeed}
          glowSize={props.chart.glowSize}
          hoverStrength={props.chart.hoverStrength}
          dimOpacity={props.chart.dimOpacity}
          crosshair={props.chart.crosshair}
          replayToken={rt()}
        >
          {frame()}
          <For each={series()}>
            {(s) => (
              <Line dataKey={s.key} isClickable={s.isClickable} opacity={s.opacity}>
                {dots(s)}
              </Line>
            )}
          </For>
          {foot("month")}
        </LineChart>
      </Match>

      <Match when={props.chart.type === "bar"}>
        <BarChart
          data={data()}
          config={cfg()}
          margins={props.chart.margins}
          bloom={props.chart.bloom}
          seed={props.chart.seed}
          stackType={props.chart.stackType}
          animate={props.chart.animate}
          interactive={props.chart.interactive}
          animationDuration={props.chart.animationDuration}
          animationDelay={props.chart.animationDelay}
          easing={props.chart.easing}
          hoverLift={props.chart.hoverLift}
          stagger={props.chart.stagger}
          cell={props.chart.cell}
          barGap={props.chart.barGap}
          barEdge={props.chart.barEdge}
          hoverStrength={props.chart.hoverStrength}
          dimOpacity={props.chart.dimOpacity}
          crosshair={props.chart.crosshair}
          replayToken={rt()}
        >
          {frame()}
          <For each={series()}>
            {(s) => (
              <Bar dataKey={s.key} variant={s.variant} isClickable={s.isClickable} opacity={s.opacity}>
                {dots(s)}
              </Bar>
            )}
          </For>
          {foot("month")}
        </BarChart>
      </Match>

      <Match when={props.chart.type === "pie"}>
        <PieChart
          data={data()}
          config={cfg()}
          dataKey="value"
          nameKey="name"
          innerRadius={props.chart.innerRadius}
          bloom={props.chart.bloom}
          seed={props.chart.seed}
          animate={props.chart.animate}
          animationDuration={props.chart.animationDuration}
          animationDelay={props.chart.animationDelay}
          easing={props.chart.easing}
          hoverLift={props.chart.hoverLift}
          cell={props.chart.cell}
          popOut={props.chart.popOut}
          rimWidth={props.chart.rimWidth}
          hoverStrength={props.chart.hoverStrength}
          dimOpacity={props.chart.dimOpacity}
          startAngle={props.chart.startAngle}
          replayToken={rt()}
        >
          <Pie variant={props.chart.series[0]?.variant ?? "gradient"} />
          {foot()}
        </PieChart>
      </Match>
    </Switch>
  )
}
