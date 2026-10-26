<!-- Generated from ../tailwind/MiddleEllipsis.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block", maxWidth: "100%", verticalAlign: "bottom" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Center-ellipsis for identifiers: paths, keys, hashes — keeps both ends
 * where recognition happens. `head`/`tail` are character counts; the full
 * string lands in `title`. Pure text, so it never fights `truncate`. */
const props = withDefaults(
  defineProps<{ text?: string; head?: number; tail?: number; title?: boolean; class?: string; xstyle?: StyleProp }>(),
  { text: "", head: 8, tail: 6, title: true },
)

const shown = computed(() => {
  const t = props.text
  if (t.length <= props.head + props.tail + 1) return t
  return `${t.slice(0, props.head)}…${t.slice(-props.tail)}`
})
const titleAttr = computed(() => (props.title ? props.text : undefined))
</script>

<template>
  <span ref="root" :title="titleAttr" :class="cn(styles.text, props.xstyle, props.class)">{{ shown }}</span>
</template>
