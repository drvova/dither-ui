<script setup lang="ts">
import type { StrokeVariant, VariantInput } from "./chart-context"
import CartesianSeries from "./CartesianSeries.vue"

defineProps<{
  dataKey: string
  variant?: VariantInput
  strokeVariant?: StrokeVariant
  isClickable?: boolean
}>()
</script>

<template>
  <CartesianSeries part="Line" kind="line" v-bind="$props">
    <slot />
  </CartesianSeries>
</template>
