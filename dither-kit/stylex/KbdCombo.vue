<!-- Generated from ../tailwind/KbdCombo.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "inline-flex", alignItems: "center", gap: "0.25rem" },
  text: { color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"
import DitherKbd from "./DitherKbd.vue"

/** A key combo as one readable unit: `["⌘", "K"]` renders ⌘ + K with the
 * separators Kbd uses — single keys go through DitherKbd directly. */
const props = withDefaults(defineProps<{ keys?: string[]; separator?: string; class?: string; xstyle?: StyleProp }>(), {
  keys: () => ["⌘", "K"],
  separator: "+",
})

const list = computed(() => props.keys.filter(Boolean))
</script>

<template>
  <span :class="cn(styles.row, props.xstyle, props.class)" aria-label="Keyboard shortcut">
    <template v-for="(k, i) in list" :key="i">
      <DitherKbd>{{ k }}</DitherKbd>
      <span v-if="i < list.length - 1" v-bind="stylex.attrs(styles.text)" aria-hidden="true">{{
        props.separator
      }}</span>
    </template>
  </span>
</template>
