<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Locale-aware number rendering — grouping, decimals, locale through Intl,
 * defaults to the house register. */
const props = withDefaults(
  defineProps<{
    value: number
    decimals?: number
    locale?: string
    grouping?: boolean
    class?: string
  }>(),
  { locale: "en-US", grouping: true },
)

const text = computed(() =>
  new Intl.NumberFormat(props.locale, {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
    useGrouping: props.grouping,
  }).format(props.value),
)
</script>

<template>
  <span :class="cn('tabular-nums', props.class)">{{ text }}</span>
</template>
