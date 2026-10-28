<!-- Generated from ../tailwind/Grid.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  g: { stroke: "var(--border)" },
})
</script>

<script setup lang="ts">
import { useChartPart } from "../engine/chart-context"

defineOptions({ chartLayer: "back" })

withDefaults(
  defineProps<{
    horizontal?: boolean
    vertical?: boolean
    strokeDasharray?: string
    tickCount?: number
  }>(),
  { horizontal: true, vertical: false, strokeDasharray: "3 3", tickCount: 4 },
)

const ctx = useChartPart("Grid")
</script>

<template>
  <g v-if="ctx.ready" v-bind="stylex.attrs(styles.g)" :stroke-dasharray="strokeDasharray">
    <template v-if="horizontal">
      <line
        v-for="t in ctx.y.ticks(tickCount)"
        :key="`h-${t}`"
        :x1="0"
        :x2="ctx.plot.width"
        :y1="ctx.y(t)"
        :y2="ctx.y(t)"
      />
    </template>
    <template v-if="vertical">
      <line
        v-for="(_, i) in ctx.data"
        :key="`v-${i}`"
        :x1="ctx.xCenter(i) ?? 0"
        :x2="ctx.xCenter(i) ?? 0"
        :y1="0"
        :y2="ctx.plot.height"
      />
    </template>
  </g>
</template>
