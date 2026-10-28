<!-- Generated from ../tailwind/Highlight.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  mark: {
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "color-mix(in oklab, var(--foreground) 10%, transparent)",
    paddingInline: "0.125rem",
    color: "inherit",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Inline highlight: the `<mark>` element with a neutral token wash (the
 * colored variants ride in `class`). Neutral because house color comes from
 * palette seeds, not hardcoded accents. */
const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <mark :class="cn(styles.mark, props.xstyle, props.class)"><slot /></mark>
</template>
