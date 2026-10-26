<!-- Generated from ../tailwind/DitherGrid.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Dashboard grid — auto-fit card columns by minimum width, or a fixed
 * column count. Children span with plain col-span utilities. */
const props = withDefaults(
  defineProps<{
    /** Minimum card width; columns auto-fit. Ignored when cols is set. */
    min?: number
    /** Fixed column count — for deliberate layouts. */
    cols?: number
    /** Grid gap, any CSS length. */
    gap?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { min: 240, gap: "0.75rem" },
)

const style = computed(() => ({
  gridTemplateColumns: props.cols
    ? `repeat(${props.cols}, minmax(0, 1fr))`
    : `repeat(auto-fit, minmax(min(100%, ${props.min}px), 1fr))`,
  gap: props.gap,
}))
</script>

<template>
  <div :class="cn(styles.grid, props.xstyle, props.class)" :style="style">
    <slot />
  </div>
</template>
