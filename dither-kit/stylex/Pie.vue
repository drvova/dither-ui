<!-- Generated from ../tailwind/Pie.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue"
import type { VariantInput } from "../engine/chart-context"
import { usePolarPart } from "../engine/polar-context"

const props = withDefaults(defineProps<{ variant?: VariantInput }>(), { variant: "gradient" })

const ctx = usePolarPart("Pie", "pie")

watch(
  () => props.variant,
  (variant) => ctx.registerVariant("*", variant),
  { immediate: true },
)
onBeforeUnmount(() => ctx.unregisterVariant("*"))
</script>

<template>
  <!-- Slices are painted on the canvas; this part only registers the variant. -->
  <g />
</template>
