<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue"
import type { AreaVariant } from "./chart-context"
import { usePolarPart } from "./polar-context"

const props = withDefaults(
  defineProps<{ dataKey: string; variant?: AreaVariant }>(),
  { variant: "gradient" }
)

const ctx = usePolarPart("Radar", "radar")

if (import.meta.env.DEV && !ctx.config[props.dataKey]) {
  console.warn(
    `<Radar dataKey="${props.dataKey}" />: "${props.dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`
  )
}

watch(
  () => [props.dataKey, props.variant] as const,
  ([dataKey, variant]) => ctx.registerVariant(dataKey, variant),
  { immediate: true }
)
onBeforeUnmount(() => ctx.unregisterVariant(props.dataKey))
</script>

<template>
  <!-- The dithered polygon is painted on the canvas; this registers the series. -->
</template>
