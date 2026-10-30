<!-- Generated from ../tailwind/InputGroup.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.375rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: { default: "var(--border)", ":focus-within": "var(--ring)" },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.5rem",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text: { flexShrink: "0", fontSize: "12px", color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Addon slots around a control — prefix/suffix text, icons or buttons in
 * one bordered group. The inner control drops its own chrome (the docs
 * snippet shows the exact class set); the group owns the border and the
 * focus-within ring. */
const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <div :class="cn(styles.row, props.xstyle, props.class)">
    <span v-bind="stylex.attrs(styles.text)"><slot name="prefix" /></span>
    <slot />
    <span v-bind="stylex.attrs(styles.text)"><slot name="suffix" /></span>
  </div>
</template>
