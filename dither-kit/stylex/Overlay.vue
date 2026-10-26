<!-- Generated from ../tailwind/Overlay.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  fixed: { position: "fixed", inset: "0px", zIndex: "40" },
  pointerEventsAuto: { pointerEvents: "auto" },
  pointerEventsNone: { pointerEvents: "none" },
  dimsSoft: { backgroundColor: "color-mix(in oklab, var(--background) 20%, transparent)" },
  dimsMedium: { backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)" },
  dimsStrong: { backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)" },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Full-cover layer primitive: fixed dim over the app (dialogs, drawers, busy
 * states). Decorative and click-transparent by default; flip `interactive` to
 * make it catch pointer events (dismissable scrims), which also lifts the
 * aria-hidden so its slot stays reachable. */
const props = withDefaults(
  defineProps<{
    dim?: "none" | "soft" | "medium" | "strong"
    interactive?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { dim: "soft", interactive: false },
)

const DIMS = {
  none: null,
  soft: styles.dimsSoft,
  medium: styles.dimsMedium,
  strong: styles.dimsStrong,
} as const

const classes = computed(() =>
  cn(
    styles.fixed,
    DIMS[props.dim],
    props.interactive ? styles.pointerEventsAuto : styles.pointerEventsNone,
    props.xstyle,
    props.class,
  ),
)
</script>

<template>
  <div :class="cn(classes)" :aria-hidden="props.interactive ? undefined : 'true'"><slot /></div>
</template>
