<script setup lang="ts">
import { useChartPart } from "./chart-context"

const props = withDefaults(
  defineProps<{
    tickFormatter?: (value: number) => string
    tickCount?: number
    tickMargin?: number
  }>(),
  { tickCount: 4, tickMargin: 8 }
)

const ctx = useChartPart("YAxis")
</script>

<template>
  <g
    v-if="ctx.ready"
    class="fill-current font-mono text-[10px] text-muted-foreground"
  >
    <text
      v-for="t in ctx.y.ticks(tickCount)"
      :key="t"
      :x="-tickMargin"
      :y="ctx.y(t)"
      text-anchor="end"
      dominant-baseline="central"
      fill="currentColor"
    >
      {{ props.tickFormatter ? props.tickFormatter(t) : t }}
    </text>
  </g>
</template>
