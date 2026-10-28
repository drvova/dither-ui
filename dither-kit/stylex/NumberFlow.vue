<!-- Generated from ../tailwind/NumberFlow.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "inline-flex", fontVariantNumeric: "   tabular-nums " },
  text: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  text2: { display: "inline-block", height: "1em", overflow: "hidden" },
  grid: {
    display: "grid",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text3: { height: "1em", lineHeight: "1" },
  text4: { lineHeight: "1" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Odometer for live values — each digit rides a 0-9 column that rolls to the
 * new figure whenever `value` changes. Separators stay put. Reduced motion
 * snaps columns without the roll. */
const props = withDefaults(
  defineProps<{
    value: number
    decimals?: number
    /** Roll time per change, ms. */
    duration?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { decimals: 0, duration: 600 },
)

const chars = computed(() =>
  props.value
    .toLocaleString(undefined, {
      minimumFractionDigits: props.decimals,
      maximumFractionDigits: props.decimals,
    })
    .split(""),
)
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
</script>

<template>
  <span :class="cn(styles.row, props.xstyle, props.class)" aria-live="polite">
    <span v-bind="stylex.attrs(styles.text)">{{ chars.join("") }}</span>
    <template v-for="(c, i) in chars" :key="`${chars.length}-${i}`">
      <span v-if="/\d/.test(c)" aria-hidden="true" v-bind="stylex.attrs(styles.text2)">
        <span
          v-bind="stylex.attrs(styles.grid)"
          :style="{ transform: `translateY(-${Number(c)}em)`, transitionDuration: `${props.duration}ms` }"
        >
          <span v-for="d in DIGITS" :key="d" v-bind="stylex.attrs(styles.text3)">{{ d }}</span>
        </span>
      </span>
      <span v-else aria-hidden="true" v-bind="stylex.attrs(styles.text4)">{{ c }}</span>
    </template>
  </span>
</template>
