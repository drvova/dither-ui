<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Ratio → percent. Input is the FRACTION (0.42 → 42%) because that is what
 * Intl's percent style expects; decimals default to zero for the clean read. */
const props = withDefaults(
  defineProps<{ value: number; decimals?: number; locale?: string; class?: string }>(),
  { decimals: 0, locale: "en-US" },
)

const text = computed(() =>
  new Intl.NumberFormat(props.locale, {
    style: "percent",
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  }).format(props.value),
)
</script>

<template>
  <span :class="cn('tabular-nums', props.class)">{{ text }}</span>
</template>
