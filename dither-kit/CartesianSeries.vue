<script setup lang="ts">
import { computed, onBeforeUnmount, provide, watch } from "vue"
import {
  type VariantInput,
  type SeriesKind,
  type StrokeVariant,
  useChartPart,
} from "./chart-context"
import { SeriesKey } from "./series-context"

const props = withDefaults(
  defineProps<{
    part: string
    kind: SeriesKind
    dataKey: string
    variant?: VariantInput
    strokeVariant?: StrokeVariant
    isClickable?: boolean
  }>(),
  { variant: "gradient", strokeVariant: "solid", isClickable: false }
)

const ctx = useChartPart(props.part, props.kind === "line" ? "line" : "area")

if (import.meta.env.DEV && !ctx.config[props.dataKey]) {
  console.warn(
    `<${props.part} dataKey="${props.dataKey}" />: "${props.dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`
  )
}

watch(
  () =>
    [props.dataKey, props.kind, props.variant, props.strokeVariant] as const,
  ([dataKey, kind, variant, strokeVariant]) =>
    ctx.registerSeries({ dataKey, kind, variant, strokeVariant }),
  { immediate: true }
)
onBeforeUnmount(() => ctx.unregisterSeries(props.dataKey))

provide(SeriesKey, {
  dataKey: props.dataKey,
  get seed() {
    return ctx.seedOf(props.dataKey)
  },
  get dimmed() {
    const e = ctx.selectedDataKey ?? ctx.focusDataKey
    return e !== null && e !== props.dataKey
  },
})

const band = computed(() => ctx.bands[props.dataKey])
const hitPath = computed(() => {
  if (!props.isClickable || !band.value) return null
  const b = band.value
  const parts: string[] = []
  b.forEach((pt, i) => {
    parts.push(`${i === 0 ? "M" : "L"}${ctx.xCenter(i)},${ctx.y(pt[1])}`)
  })
  for (let i = b.length - 1; i >= 0; i -= 1) {
    parts.push(`L${ctx.xCenter(i)},${ctx.y(b[i][0])}`)
  }
  return `${parts.join(" ")} Z`
})

function onClick() {
  if (!props.isClickable) return
  ctx.selectDataKey(ctx.selectedDataKey === props.dataKey ? null : props.dataKey)
}
</script>

<template>
  <g v-if="ctx.ready && band">
    <path
      v-if="hitPath"
      :d="hitPath"
      fill="transparent"
      style="cursor: pointer"
      @click="onClick"
    />
    <slot />
  </g>
</template>
