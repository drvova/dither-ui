<script setup lang="ts">
import { computed, onBeforeUnmount, provide, watch } from "vue"
import {
  type AreaVariant,
  type StrokeVariant,
  useChartPart,
} from "./chart-context"
import { SeriesKey } from "./series-context"

const props = withDefaults(
  defineProps<{
    dataKey: string
    variant?: AreaVariant
    strokeVariant?: StrokeVariant
    isClickable?: boolean
  }>(),
  { variant: "gradient", strokeVariant: "solid", isClickable: false }
)

const ctx = useChartPart("Bar", "bar")

if (import.meta.env.DEV && !ctx.config[props.dataKey]) {
  console.warn(
    `<Bar dataKey="${props.dataKey}" />: "${props.dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`
  )
}

watch(
  () => [props.dataKey, props.variant, props.strokeVariant] as const,
  ([dataKey, variant, strokeVariant]) =>
    ctx.registerSeries({ dataKey, kind: "bar", variant, strokeVariant }),
  { immediate: true }
)
onBeforeUnmount(() => ctx.unregisterSeries(props.dataKey))

provide(SeriesKey, {
  dataKey: props.dataKey,
  get seed() {
    return ctx.seedOf(props.dataKey)
  },
  get dimmed() {
    return ctx.selectedDataKey !== null && ctx.selectedDataKey !== props.dataKey
  },
})

const band = computed(() => ctx.bands[props.dataKey])
const si = computed(() => ctx.configKeys.indexOf(props.dataKey))
const rects = computed(() => {
  if (!props.isClickable || !band.value) return []
  const n = ctx.configKeys.length
  return band.value.map((b, i) => {
    const slot = ctx.barSlot(i, si.value, n)
    const top = ctx.y(b[1])
    const base = ctx.y(b[0])
    return {
      x: slot.x,
      y: Math.min(top, base),
      width: slot.width,
      height: Math.abs(base - top),
    }
  })
})

function onClick() {
  ctx.selectDataKey(ctx.selectedDataKey === props.dataKey ? null : props.dataKey)
}
</script>

<template>
  <g v-if="ctx.ready && band">
    <rect
      v-for="(r, i) in rects"
      :key="i"
      :x="r.x"
      :y="r.y"
      :width="r.width"
      :height="r.height"
      fill="transparent"
      style="cursor: pointer"
      @click="onClick"
    />
    <slot />
  </g>
</template>
