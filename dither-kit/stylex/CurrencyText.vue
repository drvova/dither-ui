<!-- Generated from ../tailwind/CurrencyText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Money through Intl — currency decides symbol placement, locale decides
 * the grammar (both are the runtime's job, not ours). */
const props = withDefaults(
  defineProps<{
    value: number
    currency?: string
    locale?: string
    decimals?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { currency: "USD", locale: "en-US", decimals: 2 },
)

const text = computed(() =>
  new Intl.NumberFormat(props.locale, {
    style: "currency",
    currency: props.currency,
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  }).format(props.value),
)
</script>

<template>
  <span :class="cn(styles.text, props.xstyle, props.class)">{{ text }}</span>
</template>
