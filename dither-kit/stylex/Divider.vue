<!-- Generated from ../tailwind/Divider.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  wPx: {
    width: "1px",
    alignSelf: "stretch",
    backgroundColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  hPx: {
    height: "1px",
    width: "100%",
    borderStyle: "solid",
    borderWidth: "0px",
    backgroundColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** Hairline rule. Horizontal renders a real `hr` (separator semantics come
 * for free); vertical is a flex-row citizen that stretches to the row height.
 * Both announce `role="separator"` with the right orientation. */
const props = withDefaults(
  defineProps<{
    orientation?: "horizontal" | "vertical"
    class?: string
    xstyle?: StyleProp
  }>(),
  { orientation: "horizontal" },
)
</script>

<template>
  <component
    :is="props.orientation === 'vertical' ? 'div' : 'hr'"
    role="separator"
    :aria-orientation="props.orientation"
    :class="cn(props.orientation === 'vertical' ? styles.wPx : styles.hPx, props.xstyle, props.class)"
  />
</template>
