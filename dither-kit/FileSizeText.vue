<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Bytes → human units. 1024-based (the convention disk tools actually use),
 * sub-KB sizes stay whole numbers, sign preserved. */
const props = withDefaults(
  defineProps<{ bytes?: number; decimals?: number; locale?: string; class?: string }>(),
  { bytes: 0, decimals: 1, locale: "en-US" },
)

const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const

const text = computed(() => {
  const n = props.bytes
  const abs = Math.abs(n)
  if (abs < 1024) return `${n} ${UNITS[0]}`
  let unit = 1
  let scaled = abs / 1024
  while (scaled >= 1024 && unit < UNITS.length - 1) {
    scaled /= 1024
    unit++
  }
  const fixed = new Intl.NumberFormat(props.locale, {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  }).format(scaled)
  return `${n < 0 ? "-" : ""}${fixed} ${UNITS[unit]}`
})
</script>

<template>
  <span :class="cn('tabular-nums', props.class)">{{ text }}</span>
</template>
