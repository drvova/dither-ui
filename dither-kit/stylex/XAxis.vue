<!-- Generated from ../tailwind/XAxis.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  g: {
    fill: "currentcolor",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--muted-foreground)",
  },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { useChartPart } from "../engine/chart-context"

const props = withDefaults(
  defineProps<{
    dataKey?: string
    tickFormatter?: (value: unknown, index: number) => string
    tickMargin?: number
    maxTicks?: number
  }>(),
  { tickMargin: 8, maxTicks: 8 },
)

const ctx = useChartPart("XAxis")
const step = computed(() => Math.max(1, Math.ceil(ctx.dataLength / props.maxTicks)))

function labelAt(row: unknown, i: number): string {
  const raw = props.dataKey ? (row as Record<string, unknown>)[props.dataKey] : i
  return props.tickFormatter ? props.tickFormatter(raw, i) : String(raw ?? "")
}
</script>

<template>
  <g v-if="ctx.ready" v-bind="stylex.attrs(styles.g)">
    <template v-for="(row, i) in ctx.data" :key="i">
      <text
        v-if="i % step === 0"
        :x="ctx.xCenter(i) ?? 0"
        :y="ctx.plot.height + tickMargin"
        text-anchor="middle"
        dominant-baseline="hanging"
        fill="currentColor"
      >
        {{ labelAt(row, i) }}
      </text>
    </template>
  </g>
</template>
