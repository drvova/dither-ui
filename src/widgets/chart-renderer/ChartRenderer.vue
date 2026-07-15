<script setup lang="ts">
import { computed } from "vue"
import { activeSeries, type ChartModel, configOf, dataOf } from "@/entities/chart"
import { editor } from "@/entities/editor"
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
} from "@dither-kit"

const props = defineProps<{ chart: ChartModel }>()

const cfg = computed(() => configOf(props.chart))
const data = computed(() => dataOf(props.chart))
const series = computed(() => activeSeries(props.chart))
const rt = computed(() => editor.replayToken)
</script>

<template>
  <AreaChart
    v-if="chart.type === 'area'"
    :data="data" :config="cfg" :margins="chart.margins" :bloom="chart.bloom"
    :seed="chart.seed" :effect="chart.effect"
    :stack-type="chart.stackType" :animate="chart.animate" :interactive="chart.interactive"
    :animation-duration="chart.animationDuration" :animation-delay="chart.animationDelay"
    :easing="chart.easing" :sparkles="chart.sparkles" :hover-lift="chart.hoverLift"
    :cell="chart.cell" :sparkle-density="chart.sparkleDensity" :sparkle-speed="chart.sparkleSpeed"
    :hover-strength="chart.hoverStrength" :dim-opacity="chart.dimOpacity" :crosshair="chart.crosshair"
    :replay-token="rt"
  >
    <Grid v-if="chart.grid.on" :horizontal="chart.grid.horizontal" :vertical="chart.grid.vertical" :stroke-dasharray="chart.grid.dash" :tick-count="chart.grid.tickCount" />
    <XAxis v-if="chart.xAxis.on" dataKey="month" :tick-margin="chart.xAxis.tickMargin" :max-ticks="chart.xAxis.maxTicks" />
    <YAxis v-if="chart.yAxis.on" :tick-count="chart.yAxis.tickCount" :tick-margin="chart.yAxis.tickMargin" />
    <Area v-for="s in series" :key="s.key" :dataKey="s.key" :variant="s.variant" :is-clickable="s.isClickable" :opacity="s.opacity">
      <Dot v-if="s.dots.on" :variant="s.dots.variant" :r="s.dots.r" />
      <ActiveDot v-if="s.activeDot.on" :variant="s.activeDot.variant" :r="s.activeDot.r" />
    </Area>
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" labelKey="month" :variant="chart.tooltip.variant" />
  </AreaChart>

  <LineChart
    v-else-if="chart.type === 'line'"
    :data="data" :config="cfg" :margins="chart.margins" :bloom="chart.bloom"
    :seed="chart.seed" :effect="chart.effect"
    :animate="chart.animate" :interactive="chart.interactive"
    :animation-duration="chart.animationDuration" :animation-delay="chart.animationDelay"
    :easing="chart.easing" :sparkles="chart.sparkles" :hover-lift="chart.hoverLift"
    :cell="chart.cell" :sparkle-density="chart.sparkleDensity" :sparkle-speed="chart.sparkleSpeed"
    :glow-size="chart.glowSize" :hover-strength="chart.hoverStrength" :dim-opacity="chart.dimOpacity"
    :crosshair="chart.crosshair" :replay-token="rt"
  >
    <Grid v-if="chart.grid.on" :horizontal="chart.grid.horizontal" :vertical="chart.grid.vertical" :stroke-dasharray="chart.grid.dash" :tick-count="chart.grid.tickCount" />
    <XAxis v-if="chart.xAxis.on" dataKey="month" :tick-margin="chart.xAxis.tickMargin" :max-ticks="chart.xAxis.maxTicks" />
    <YAxis v-if="chart.yAxis.on" :tick-count="chart.yAxis.tickCount" :tick-margin="chart.yAxis.tickMargin" />
    <Line v-for="s in series" :key="s.key" :dataKey="s.key" :is-clickable="s.isClickable" :opacity="s.opacity">
      <Dot v-if="s.dots.on" :variant="s.dots.variant" :r="s.dots.r" />
      <ActiveDot v-if="s.activeDot.on" :variant="s.activeDot.variant" :r="s.activeDot.r" />
    </Line>
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" labelKey="month" :variant="chart.tooltip.variant" />
  </LineChart>

  <BarChart
    v-else-if="chart.type === 'bar'"
    :data="data" :config="cfg" :margins="chart.margins" :bloom="chart.bloom"
    :seed="chart.seed"
    :stack-type="chart.stackType" :animate="chart.animate" :interactive="chart.interactive"
    :animation-duration="chart.animationDuration" :animation-delay="chart.animationDelay"
    :easing="chart.easing" :hover-lift="chart.hoverLift" :stagger="chart.stagger"
    :cell="chart.cell" :bar-gap="chart.barGap" :bar-edge="chart.barEdge"
    :hover-strength="chart.hoverStrength" :dim-opacity="chart.dimOpacity" :crosshair="chart.crosshair"
    :replay-token="rt"
  >
    <Grid v-if="chart.grid.on" :horizontal="chart.grid.horizontal" :vertical="chart.grid.vertical" :stroke-dasharray="chart.grid.dash" :tick-count="chart.grid.tickCount" />
    <XAxis v-if="chart.xAxis.on" dataKey="month" :tick-margin="chart.xAxis.tickMargin" :max-ticks="chart.xAxis.maxTicks" />
    <YAxis v-if="chart.yAxis.on" :tick-count="chart.yAxis.tickCount" :tick-margin="chart.yAxis.tickMargin" />
    <Bar v-for="s in series" :key="s.key" :dataKey="s.key" :variant="s.variant" :is-clickable="s.isClickable" :opacity="s.opacity">
      <Dot v-if="s.dots.on" :variant="s.dots.variant" :r="s.dots.r" />
      <ActiveDot v-if="s.activeDot.on" :variant="s.activeDot.variant" :r="s.activeDot.r" />
    </Bar>
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" labelKey="month" :variant="chart.tooltip.variant" />
  </BarChart>

  <PieChart
    v-else-if="chart.type === 'pie'"
    :data="data" :config="cfg" data-key="value" name-key="name"
    :inner-radius="chart.innerRadius" :bloom="chart.bloom" :seed="chart.seed" :animate="chart.animate"
    :animation-duration="chart.animationDuration" :animation-delay="chart.animationDelay"
    :easing="chart.easing" :hover-lift="chart.hoverLift" :cell="chart.cell"
    :pop-out="chart.popOut" :rim-width="chart.rimWidth" :hover-strength="chart.hoverStrength"
    :dim-opacity="chart.dimOpacity" :start-angle="chart.startAngle" :replay-token="rt"
  >
    <Pie :variant="chart.series[0]?.variant ?? 'gradient'" />
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" :variant="chart.tooltip.variant" />
  </PieChart>

  <RadarChart
    v-else
    :data="data" :config="cfg" name-key="axis" :bloom="chart.bloom" :seed="chart.seed"
    :animate="chart.animate" :animation-duration="chart.animationDuration"
    :animation-delay="chart.animationDelay" :easing="chart.easing"
    :hover-lift="chart.hoverLift" :cell="chart.cell" :falloff="chart.falloff"
    :hover-strength="chart.hoverStrength" :dim-opacity="chart.dimOpacity" :rings="chart.radarRings"
    :replay-token="rt"
  >
    <Radar v-for="s in series" :key="s.key" :dataKey="s.key" :variant="s.variant" :is-clickable="s.isClickable" />
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" :variant="chart.tooltip.variant" />
  </RadarChart>
</template>
