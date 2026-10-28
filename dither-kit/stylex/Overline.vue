<!-- Generated from ../tailwind/Overline.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: {
    display: "block",
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** The tiny uppercase eyebrow above section titles — 10px, open tracking,
 * muted; the editorial "OVERLINE" register. `faint` shares the muted ink:
 * no text in the kit drops under AA (4.5:1). */
const props = withDefaults(defineProps<{ tone?: "muted" | "faint"; class?: string; xstyle?: StyleProp }>(), {
  tone: "muted",
})
</script>

<template>
  <span :class="cn(styles.text, props.xstyle, props.class)">
    <slot />
  </span>
</template>
