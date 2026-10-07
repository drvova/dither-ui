<script setup lang="ts">
import { cn } from "./lib"

/** Plain image primitive with the modern loading contract built in:
 * `loading="lazy"`, `decoding="async"`, and a required `alt` (empty string is
 * the explicit decorative choice — the type will not let you forget it).
 * width/height and anything else fall through to the img untouched. */
const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    loading?: "lazy" | "eager"
    decoding?: "async" | "auto" | "sync"
    class?: string
  }>(),
  { loading: "lazy", decoding: "async" },
)
</script>

<template>
  <img
    :src="props.src"
    :alt="props.alt"
    :loading="props.loading"
    :decoding="props.decoding"
    :class="cn('', props.class)"
  />
</template>
