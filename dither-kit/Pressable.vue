<script setup lang="ts">
import { cn } from "./lib"

/** The plainest possible interactive base: a native `button` (type=button so
 * it never submits forms by accident) with the house press affordance — a
 * short scale-down under the finger/Enter key. Focus styling comes from the
 * global `:focus-visible` floor; `disabled` behaves natively. For the
 * dithered, blooming, canvas-filled version see DitherButton. */
const props = withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    class?: string
  }>(),
  { type: "button", disabled: false },
)
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="cn('transition-transform active:scale-[0.97]', props.class)"
  >
    <slot />
  </button>
</template>
