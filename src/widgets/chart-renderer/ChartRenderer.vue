<script setup lang="ts">
import { computed } from "vue"
import { activeSeries, type ChartModel, configOf, dataOf } from "@/entities/chart"
import { editor } from "@/entities/editor"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
    :stack-type="chart.stackType" :animate="chart.animate" :interactive="chart.interactive"
    :animation-duration="chart.animationDuration" :animation-delay="chart.animationDelay"
    :easing="chart.easing" :sparkles="chart.sparkles" :hover-lift="chart.hoverLift"
    :replay-token="rt"
  >
    <Grid v-if="chart.grid.on" :horizontal="chart.grid.horizontal" :vertical="chart.grid.vertical" :stroke-dasharray="chart.grid.dash" />
    <XAxis v-if="chart.xAxis.on" dataKey="month" :tick-margin="chart.xAxis.tickMargin" :max-ticks="chart.xAxis.maxTicks" />
    <YAxis v-if="chart.yAxis.on" :tick-count="chart.yAxis.tickCount" :tick-margin="chart.yAxis.tickMargin" />
    <Area v-for="s in series" :key="s.key" :dataKey="s.key" :variant="s.variant" :is-clickable="s.isClickable" />
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" labelKey="month" :variant="chart.tooltip.variant" />
  </AreaChart>

  <LineChart
    v-else-if="chart.type === 'line'"
    :data="data" :config="cfg" :margins="chart.margins" :bloom="chart.bloom"
    :animate="chart.animate" :interactive="chart.interactive"
    :animation-duration="chart.animationDuration" :animation-delay="chart.animationDelay"
    :easing="chart.easing" :sparkles="chart.sparkles" :hover-lift="chart.hoverLift"
    :replay-token="rt"
  >
    <Grid v-if="chart.grid.on" :horizontal="chart.grid.horizontal" :vertical="chart.grid.vertical" :stroke-dasharray="chart.grid.dash" />
    <XAxis v-if="chart.xAxis.on" dataKey="month" :tick-margin="chart.xAxis.tickMargin" :max-ticks="chart.xAxis.maxTicks" />
    <YAxis v-if="chart.yAxis.on" :tick-count="chart.yAxis.tickCount" :tick-margin="chart.yAxis.tickMargin" />
    <Line v-for="s in series" :key="s.key" :dataKey="s.key" :is-clickable="s.isClickable" />
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" labelKey="month" :variant="chart.tooltip.variant" />
  </LineChart>

  <BarChart
    v-else-if="chart.type === 'bar'"
    :data="data" :config="cfg" :margins="chart.margins" :bloom="chart.bloom"
    :stack-type="chart.stackType" :animate="chart.animate" :interactive="chart.interactive"
    :animation-duration="chart.animationDuration" :animation-delay="chart.animationDelay"
    :easing="chart.easing" :hover-lift="chart.hoverLift" :stagger="chart.stagger"
    :replay-token="rt"
  >
    <Grid v-if="chart.grid.on" :horizontal="chart.grid.horizontal" :vertical="chart.grid.vertical" :stroke-dasharray="chart.grid.dash" />
    <XAxis v-if="chart.xAxis.on" dataKey="month" :tick-margin="chart.xAxis.tickMargin" :max-ticks="chart.xAxis.maxTicks" />
    <YAxis v-if="chart.yAxis.on" :tick-count="chart.yAxis.tickCount" :tick-margin="chart.yAxis.tickMargin" />
    <Bar v-for="s in series" :key="s.key" :dataKey="s.key" :variant="s.variant" :is-clickable="s.isClickable" />
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" labelKey="month" :variant="chart.tooltip.variant" />
  </BarChart>

  <PieChart
    v-else-if="chart.type === 'pie'"
    :data="data" :config="cfg" data-key="value" name-key="name"
    :inner-radius="chart.innerRadius" :bloom="chart.bloom" :animate="chart.animate"
    :animation-duration="chart.animationDuration" :animation-delay="chart.animationDelay"
    :easing="chart.easing" :hover-lift="chart.hoverLift" :replay-token="rt"
  >
    <Pie :variant="chart.series[0]?.variant ?? 'gradient'" />
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" :variant="chart.tooltip.variant" />
  </PieChart>

  <RadarChart
    v-else
    :data="data" :config="cfg" name-key="axis" :bloom="chart.bloom"
    :animate="chart.animate" :animation-duration="chart.animationDuration"
    :animation-delay="chart.animationDelay" :easing="chart.easing"
    :hover-lift="chart.hoverLift" :replay-token="rt"
  >
    <Radar v-for="s in series" :key="s.key" :dataKey="s.key" :variant="s.variant" :is-clickable="s.isClickable" />
    <Legend v-if="chart.legend.on" :align="chart.legend.align" :is-clickable="chart.legend.clickable" />
    <Tooltip v-if="chart.tooltip.on" :variant="chart.tooltip.variant" />
  </RadarChart>
</template>
