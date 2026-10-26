<script setup lang="ts">
import { cn } from "./lib"

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('dk-scroll overflow-auto', props.class)">
    <slot />
  </div>
</template>

<style scoped>
/* Honest scrollbars — no canvas, just the house tokens. */
.dk-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.dk-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.dk-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.dk-scroll::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 9999px;
}
.dk-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground);
}
</style>
