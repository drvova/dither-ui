<!-- Generated from ../tailwind/Image.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

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
    xstyle?: StyleProp
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
    :class="cn(null, props.xstyle, props.class)"
  />
</template>
