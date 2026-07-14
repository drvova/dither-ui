<script setup lang="ts">
import type { AreaVariant, StrokeVariant } from "./chart-context"
import CartesianSeries from "./CartesianSeries.vue"

defineProps<{
  dataKey: string
  variant?: AreaVariant
  strokeVariant?: StrokeVariant
  isClickable?: boolean
}>()
</script>

<template>
  <CartesianSeries part="Area" kind="area" v-bind="$props">
    <slot />
  </CartesianSeries>
</template>
