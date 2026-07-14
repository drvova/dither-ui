<script setup lang="ts">
import { computed } from "vue"
import { useChart } from "./chart-context"
import { dotPaint, type DotVariant } from "./dot-paint"
import { useSeries } from "./series-context"

const props = withDefaults(
  defineProps<{ variant?: DotVariant; r?: number }>(),
  { variant: "border", r: 2 }
)

const ctx = useChart()
const series = useSeries("Dot")
const band = computed(() => ctx.bands[series.dataKey])
const paint = computed(() => dotPaint(props.variant, series.seed))
</script>

<template>
  <g
    v-if="ctx.ready && band"
    :style="{
      opacity: ctx.entranceDone ? 1 : 0,
      transition: 'opacity 300ms ease',
    }"
  >
    <circle
      v-for="(b, i) in band"
      :key="i"
      :fill="paint.fill"
      :stroke="paint.stroke"
      :stroke-width="paint.strokeWidth"
      :cx="ctx.xCenter(i) ?? 0"
      :cy="ctx.y(b[1])"
      :r="r"
    />
  </g>
</template>
