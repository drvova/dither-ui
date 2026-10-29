<!-- Generated from ../tailwind/Radar.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue"
import type { VariantInput } from "../engine/chart-context"
import { usePolarPart } from "../engine/polar-context"

/** A radar chart's series: registers its texture with the chart, which
 * paints the polygon on its canvas. */
const props = withDefaults(defineProps<{ dataKey: string; variant?: VariantInput }>(), { variant: "gradient" })

const ctx = usePolarPart("Radar", "radar")

if (import.meta.env.DEV && !ctx.config[props.dataKey]) {
  console.warn(
    `<Radar dataKey="${props.dataKey}" />: "${props.dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`,
  )
}

watch(
  () => [props.dataKey, props.variant] as const,
  ([dataKey, variant], old) => {
    if (old && old[0] !== dataKey) ctx.unregisterVariant(old[0])
    ctx.registerVariant(dataKey, variant)
  },
  { immediate: true },
)
onBeforeUnmount(() => ctx.unregisterVariant(props.dataKey))
</script>

<template>
  <!-- The polygon is painted on the canvas; this part only registers the series. -->
  <g />
</template>
