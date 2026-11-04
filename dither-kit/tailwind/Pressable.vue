<script lang="ts">
/** A native `button` (type=button so it never submits a form by accident)
 * with the house press affordance, a short scale-down under the
 * finger/Enter key, that looks like a button out of the box: `solid` (ink
 * on the page, the default), `outline`, `ghost`, or `plain`, the bare base
 * with no look of its own for a caller that draws every pixel. Focus wears
 * the theme's ring; `disabled` behaves natively. For the dithered,
 * blooming, canvas-filled version see DitherButton. */
export type PressableVariant = "solid" | "outline" | "ghost" | "plain"
</script>

<script setup lang="ts">
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset"
    variant?: PressableVariant
    disabled?: boolean
    class?: string
  }>(),
  { type: "button", variant: "solid", disabled: false },
)

/** Every look but plain: a 40px key of mono type, its words centred. */
const KEY =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 font-mono text-xs font-medium transition-[background-color,border-color,color,scale] active:scale-[0.97] motion-reduce:transition-none"
const LOOK: Record<Exclude<PressableVariant, "plain">, string> = {
  solid: "bg-foreground text-background hover:bg-foreground/85",
  outline: "border border-border bg-background/60 text-foreground hover:border-foreground/25 hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
}
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="
      cn(
        props.variant === 'plain'
          ? 'transition-transform active:scale-[0.97]'
          : [CONTROL_BUTTON, KEY, LOOK[props.variant]],
        props.class,
      )
    "
  >
    <slot />
  </button>
</template>
