<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** Full-cover layer primitive: fixed dim over the app (dialogs, drawers, busy
 * states). Decorative and click-transparent by default; flip `interactive` to
 * make it catch pointer events (dismissable scrims), which also lifts the
 * aria-hidden so its slot stays reachable. */
const props = withDefaults(
  defineProps<{
    dim?: "none" | "soft" | "medium" | "strong"
    interactive?: boolean
    class?: string
  }>(),
  { dim: "soft", interactive: false },
)

const DIMS = {
  none: "",
  soft: "bg-background/20",
  medium: "bg-background/40",
  strong: "bg-background/60",
} as const

const classes = computed(() =>
  cn(
    "fixed inset-0 z-40",
    DIMS[props.dim],
    props.interactive ? "pointer-events-auto" : "pointer-events-none",
    props.class,
  ),
)
</script>

<template>
  <div :class="classes" :aria-hidden="props.interactive ? undefined : 'true'"><slot /></div>
</template>
