<script setup lang="ts">
import { computed } from "vue"
import { useChartPart } from "./chart-context"

const props = withDefaults(
  defineProps<{
    dataKey?: string
    tickFormatter?: (value: unknown, index: number) => string
    tickMargin?: number
    maxTicks?: number
  }>(),
  { tickMargin: 8, maxTicks: 8 }
)

const ctx = useChartPart("XAxis")
const step = computed(() => Math.max(1, Math.ceil(ctx.dataLength / props.maxTicks)))

function labelAt(row: Record<string, unknown>, i: number): string {
  const raw = props.dataKey ? row[props.dataKey] : i
  return props.tickFormatter ? props.tickFormatter(raw, i) : String(raw ?? "")
}
</script>

<template>
  <g
    v-if="ctx.ready"
    class="fill-current font-mono text-[10px] text-muted-foreground"
  >
    <template v-for="(row, i) in ctx.data" :key="i">
      <text
        v-if="i % step === 0"
        :x="ctx.xCenter(i) ?? 0"
        :y="ctx.plot.height + tickMargin"
        text-anchor="middle"
        dominant-baseline="hanging"
        fill="currentColor"
      >
        {{ labelAt(row as Record<string, unknown>, i) }}
      </text>
    </template>
  </g>
</template>
