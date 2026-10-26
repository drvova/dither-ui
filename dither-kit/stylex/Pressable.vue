<!-- Generated from ../tailwind/Pressable.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    transitionProperty: "transform, translate, scale, rotate",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    scale: { default: null, ":active": "0.97" },
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

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
    xstyle?: StyleProp
  }>(),
  { type: "button", disabled: false },
)
</script>

<template>
  <button :type="props.type" :disabled="props.disabled" :class="cn(styles.button, props.xstyle, props.class)">
    <slot />
  </button>
</template>
