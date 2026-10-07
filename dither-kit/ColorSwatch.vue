<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

/** One color as a pickable chip: a real button with the color in its
 * accessible name, selected state ring, keyboard focus ring. Pure display
 * when no `select` listener is wired. */
const props = withDefaults(
  defineProps<{
    color?: string
    label?: string
    selected?: boolean
    size?: number
    disabled?: boolean
    class?: string
  }>(),
  { color: "#5227FF", size: 24, disabled: false },
)
const emit = defineEmits<{ (e: "select", color: string): void }>()

const name = computed(() => props.label ?? props.color)
</script>

<template>
  <button
    type="button"
    :aria-label="`Select ${name}`"
    :aria-pressed="props.selected"
    :disabled="props.disabled"
    :style="{ background: props.color, width: `${props.size}px`, height: `${props.size}px` }"
    class="rounded-md border border-border/60 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none motion-reduce:hover:scale-100"
    :class="
      cn(
        props.selected && 'ring-2 ring-accent/70 ring-offset-2 ring-offset-background',
        props.class,
      )
    "
    @click="emit('select', props.color)"
  ></button>
</template>
