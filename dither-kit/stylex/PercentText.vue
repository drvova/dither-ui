<!-- Generated from ../tailwind/PercentText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Ratio → percent. Input is the FRACTION (0.42 → 42%) because that is what
 * Intl's percent style expects; decimals default to zero for the clean read. */
const props = withDefaults(
  defineProps<{ value: number; decimals?: number; locale?: string; class?: string; xstyle?: StyleProp }>(),
  {
    decimals: 0,
    locale: "en-US",
  },
)

const text = computed(() =>
  new Intl.NumberFormat(props.locale, {
    style: "percent",
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  }).format(props.value),
)
</script>

<template>
  <span :class="cn(styles.text, props.xstyle, props.class)">{{ text }}</span>
</template>
