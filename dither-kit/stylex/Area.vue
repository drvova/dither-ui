<!-- Generated from ../tailwind/Area.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import type { StrokeVariant, VariantInput } from "../engine/chart-context"
import CartesianSeries from "./CartesianSeries.vue"

defineProps<{
  dataKey: string
  variant?: VariantInput
  strokeVariant?: StrokeVariant
  isClickable?: boolean
  opacity?: number
}>()
</script>

<template>
  <CartesianSeries part="Area" kind="area" v-bind="$props">
    <slot />
  </CartesianSeries>
</template>
