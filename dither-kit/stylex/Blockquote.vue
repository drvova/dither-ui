<!-- Generated from ../tailwind/Blockquote.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  blockquote: {
    borderLeftStyle: "solid",
    borderLeftWidth: "2px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingLeft: "1rem",
    fontSize: "13px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Quoted aside: real `<blockquote>` semantics with the editorial treatment —
 * hairline left rule, muted register. Cite lives in the slot (or the `cite`
 * attr). */
const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <blockquote :class="cn(styles.blockquote, props.xstyle, props.class)">
    <slot />
  </blockquote>
</template>
