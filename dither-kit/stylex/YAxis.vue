<!-- Generated from ../tailwind/YAxis.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
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
import { useChartPart } from "../engine/chart-context"

const props = withDefaults(
  defineProps<{
    tickFormatter?: (value: number) => string
    tickCount?: number
    tickMargin?: number
  }>(),
  { tickCount: 4, tickMargin: 8 },
)

const ctx = useChartPart("YAxis")
</script>

<template>
  <g v-if="ctx.ready" v-bind="stylex.attrs(styles.g)">
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
