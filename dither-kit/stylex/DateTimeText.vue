<!-- Generated from ../tailwind/DateTimeText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Date → localized text. Default is the medium date + short time register;
 * any Intl.DateTimeFormatOptions shape overrides it (pass `timeZone` inside
 * options for deterministic cross-machine rendering). An unparseable date
 * renders an em dash — visible, not silent. */
const props = withDefaults(
  defineProps<{
    date?: Date | string | number
    locale?: string
    options?: Intl.DateTimeFormatOptions
    class?: string
    xstyle?: StyleProp
  }>(),
  { date: "", locale: "en-US" },
)

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }

const text = computed(() => {
  const d = new Date(props.date)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(props.locale, props.options ?? DEFAULT_OPTIONS)
})
</script>

<template>
  <span :class="cn(styles.text, props.xstyle, props.class)">{{ text }}</span>
</template>
