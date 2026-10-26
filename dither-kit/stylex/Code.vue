<!-- Generated from ../tailwind/Code.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  code: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    paddingInline: "0.25rem",
    paddingBlock: "1px",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "color-mix(in oklab, var(--foreground) 90%, transparent)",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Inline code — the `<code>` element in house chrome (small radius, card
 * fill). For the copyable, highlighted block see CodeBlock in the app layer. */
const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <code :class="cn(styles.code, props.xstyle, props.class)">
    <slot />
  </code>
</template>
