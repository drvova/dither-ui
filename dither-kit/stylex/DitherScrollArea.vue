<!-- Generated from ../tailwind/DitherScrollArea.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { overflow: "auto" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <div :class="cn([styles.box, 'dk-scroll'], props.xstyle, props.class)">
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
