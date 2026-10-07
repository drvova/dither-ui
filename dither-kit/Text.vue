<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Text primitive on the site's native type scale. `as` picks the element
 * (p default; span/h3/li/… for context), `tone` maps to the shadcn token
 * utilities, `size` to the 11–15px scale the docs use — anything else
 * (leading, tracking, weight) rides along in `class`. */
const props = withDefaults(
  defineProps<{
    as?: string
    tone?: "default" | "muted" | "faint"
    size?: "xs" | "sm" | "md" | "lg"
    class?: string
  }>(),
  { as: "p", tone: "default" },
)

const TONES = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  faint: "text-muted-foreground/70",
} as const

const SIZES = {
  xs: "text-[11px]",
  sm: "text-[12px]",
  md: "text-[13px]",
  lg: "text-[15px]",
} as const

const classes = computed(() => cn(props.size && SIZES[props.size], TONES[props.tone], props.class))
</script>

<template>
  <component :is="props.as" :class="classes"><slot /></component>
</template>
