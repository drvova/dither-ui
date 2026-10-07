<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Center-ellipsis for identifiers: paths, keys, hashes — keeps both ends
 * where recognition happens. `head`/`tail` are character counts; the full
 * string lands in `title`. Pure text, so it never fights `truncate`. */
const props = withDefaults(
  defineProps<{ text?: string; head?: number; tail?: number; title?: boolean; class?: string }>(),
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
  <span ref="root" :title="titleAttr" :class="cn('inline-block max-w-full align-bottom', props.class)">{{ shown }}</span>
</template>
