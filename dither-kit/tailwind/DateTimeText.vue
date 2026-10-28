<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

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
  <span :class="cn('tabular-nums', props.class)">{{ text }}</span>
</template>
