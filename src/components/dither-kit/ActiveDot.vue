<script setup lang="ts">
import { computed } from "vue"
import { useChart } from "./chart-context"
import { dotPaint, type DotVariant } from "./dot-paint"
import { rgb } from "./palette"
import { useSeries } from "./series-context"

const props = withDefaults(
  defineProps<{ variant?: DotVariant; r?: number }>(),
  { variant: "colored-border", r: 3 }
)

const ctx = useChart()
const series = useSeries("ActiveDot")
const band = computed(() => ctx.bands[series.dataKey])
const point = computed(() => {
  if (
    !ctx.ready ||
    !band.value ||
    ctx.hoverIndex == null ||
    !ctx.entranceDone
  )
    return null
  const b = band.value[ctx.hoverIndex]
  if (!b) return null
  return { cx: ctx.xCenter(ctx.hoverIndex), cy: ctx.y(b[1]) }
})
const paint = computed(() => dotPaint(props.variant, series.seed))
const halo = computed(() => rgb(series.seed.line, 1, 0.18))
</script>

<template>
  <g v-if="point">
    <circle :cx="point.cx" :cy="point.cy" :r="r + 3" :fill="halo" />
    <circle
      :cx="point.cx"
      :cy="point.cy"
      :r="r"
      :fill="paint.fill"
      :stroke="paint.stroke"
      :stroke-width="2"
    />
  </g>
</template>
