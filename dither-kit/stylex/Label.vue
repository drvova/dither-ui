<!-- Generated from ../tailwind/Label.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "12px",
    color: "var(--foreground)",
  },
  text: { color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** A real `<label>` — pairs with controls through the `for` attr (or by
 * nesting), which is the whole point over a styled span. */
const props = withDefaults(defineProps<{ required?: boolean; class?: string; xstyle?: StyleProp }>(), {
  required: false,
})
</script>

<template>
  <label :class="cn(styles.label, props.xstyle, props.class)">
    <slot />
    <span v-if="props.required" v-bind="stylex.attrs(styles.text)" aria-hidden="true">*</span>
  </label>
</template>
