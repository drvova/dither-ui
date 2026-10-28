<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Milliseconds → a smart human duration: precision drops as magnitude grows
 * (500ms → 45s → 2m 5s → 22h 20m → 1d 1h), no zero-padding clutter. */
const props = withDefaults(defineProps<{ ms?: number; class?: string }>(), { ms: 0 })

const text = computed(() => {
  const ms = props.ms
  const s = Math.floor(ms / 1000)
  if (ms < 1000) return `${ms}ms`
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rs = s % 60
  if (m < 60) return rs > 0 ? `${m}m ${rs}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  if (h < 24) return rm > 0 ? `${h}h ${rm}m` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h % 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
})
</script>

<template>
  <span :class="cn(props.class)">{{ text }}</span>
</template>
