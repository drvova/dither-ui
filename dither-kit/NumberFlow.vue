<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Odometer for live values — each digit rides a 0-9 column that rolls to the
 * new figure whenever `value` changes. Separators stay put. Reduced motion
 * snaps columns without the roll. */
const props = withDefaults(
  defineProps<{
    value: number
    decimals?: number
    /** Roll time per change, ms. */
    duration?: number
    class?: string
  }>(),
  { decimals: 0, duration: 600 }
)

const chars = computed(() =>
  props.value
    .toLocaleString(undefined, {
      minimumFractionDigits: props.decimals,
      maximumFractionDigits: props.decimals,
    })
    .split("")
)
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
</script>

<template>
  <span :class="cn('inline-flex tabular-nums', props.class)" aria-live="polite">
    <span class="sr-only">{{ chars.join("") }}</span>
    <template v-for="(c, i) in chars" :key="`${chars.length}-${i}`">
      <span v-if="/\d/.test(c)" aria-hidden="true" class="inline-block h-[1em] overflow-hidden">
        <span
          class="grid transition-transform ease-out motion-reduce:transition-none"
          :style="{ transform: `translateY(-${Number(c)}em)`, transitionDuration: `${props.duration}ms` }"
        >
          <span v-for="d in DIGITS" :key="d" class="h-[1em] leading-none">{{ d }}</span>
        </span>
      </span>
      <span v-else aria-hidden="true" class="leading-none">{{ c }}</span>
    </template>
  </span>
</template>
