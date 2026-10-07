<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Money through Intl — currency decides symbol placement, locale decides
 * the grammar (both are the runtime's job, not ours). */
const props = withDefaults(
  defineProps<{
    value: number
    currency?: string
    locale?: string
    decimals?: number
    class?: string
  }>(),
  { currency: "USD", locale: "en-US", decimals: 2 },
)

const text = computed(() =>
  new Intl.NumberFormat(props.locale, {
    style: "currency",
    currency: props.currency,
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  }).format(props.value),
)
</script>

<template>
  <span :class="cn('tabular-nums', props.class)">{{ text }}</span>
</template>
