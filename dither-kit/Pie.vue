<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue"
import type { VariantInput } from "./chart-context"
import { usePolarPart } from "./polar-context"

const props = withDefaults(
  defineProps<{ variant?: VariantInput }>(),
  { variant: "gradient" }
)

const ctx = usePolarPart("Pie", "pie")

watch(
  () => props.variant,
  (variant) => ctx.registerVariant("*", variant),
  { immediate: true }
)
onBeforeUnmount(() => ctx.unregisterVariant("*"))
</script>

<template>
  <!-- Slices are painted on the canvas; this part only registers the variant. -->
</template>
