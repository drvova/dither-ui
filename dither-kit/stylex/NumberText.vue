<!-- Generated from ../tailwind/NumberText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Locale-aware number rendering — grouping, decimals, locale through Intl,
 * defaults to the house register. */
const props = withDefaults(
  defineProps<{
    value: number
    decimals?: number
    locale?: string
    grouping?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { locale: "en-US", grouping: true },
)

const text = computed(() =>
  new Intl.NumberFormat(props.locale, {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
    useGrouping: props.grouping,
  }).format(props.value),
)
</script>

<template>
  <span :class="cn(styles.text, props.xstyle, props.class)">{{ text }}</span>
</template>
