<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"
import DitherKbd from "./DitherKbd.vue"

/** A key combo as one readable unit: `["⌘", "K"]` renders ⌘ + K with the
 * separators Kbd uses — single keys go through DitherKbd directly. */
const props = withDefaults(
  defineProps<{ keys?: string[]; separator?: string; class?: string }>(),
  { keys: () => ["⌘", "K"], separator: "+" },
)

const list = computed(() => props.keys.filter(Boolean))
</script>

<template>
  <span :class="cn('inline-flex items-center gap-1', props.class)" aria-label="Keyboard shortcut">
    <template v-for="(k, i) in list" :key="i">
      <DitherKbd>{{ k }}</DitherKbd>
      <span v-if="i < list.length - 1" class="text-muted-foreground/70" aria-hidden="true">{{ props.separator }}</span>
    </template>
  </span>
</template>
