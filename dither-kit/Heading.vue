<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Semantic heading with the site's scale baked in: h1–h6 pick their own
 * size/weight from the level, `class` overrides anything below. */
const props = withDefaults(
  defineProps<{ level?: "1" | "2" | "3" | "4" | "5" | "6"; class?: string }>(),
  { level: "2" },
)

const LEVELS = {
  "1": "text-2xl tracking-tight font-medium",
  "2": "text-lg tracking-tight font-medium",
  "3": "text-base tracking-tight font-medium",
  "4": "text-sm font-medium",
  "5": "text-[13px] font-medium",
  "6": "text-[12px] font-medium",
} as const

const tag = computed(() => `h${props.level}`)
</script>

<template>
  <component :is="tag" :class="cn(LEVELS[props.level], props.class)"><slot /></component>
</template>
