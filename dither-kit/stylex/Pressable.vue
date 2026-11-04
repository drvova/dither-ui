<!-- Generated from ../tailwind/Pressable.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

/** A native `button` (type=button so it never submits a form by accident)
 * with the house press affordance, a short scale-down under the
 * finger/Enter key, that looks like a button out of the box: `solid` (ink
 * on the page, the default), `outline`, `ghost`, or `plain`, the bare base
 * with no look of its own for a caller that draws every pixel. Focus wears
 * the theme's ring; `disabled` behaves natively. For the dithered,
 * blooming, canvas-filled version see DitherButton. */
export type PressableVariant = "solid" | "outline" | "ghost" | "plain"

const styles = stylex.create({
  transitionTransform: {
    transitionProperty: "transform, translate, scale, rotate",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    scale: { default: null, ":active": "0.97" },
  },
  key: {
    display: "inline-flex",
    minHeight: "2.5rem",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: "500",
    transitionProperty: {
      default: "background-color, border-color, color, scale",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    scale: { default: null, ":active": "0.97" },
  },
  lookSolid: {
    backgroundColor: {
      default: "var(--foreground)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 85%, transparent)",
      },
    },
    color: "var(--background)",
  },
  lookOutline: {
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
    },
    backgroundColor: {
      default: "color-mix(in oklab, var(--background) 60%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--muted)" },
    },
    color: "var(--foreground)",
  },
  lookGhost: {
    color: "var(--foreground)",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--muted)" } },
  },
})
</script>

<script setup lang="ts">
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset"
    variant?: PressableVariant
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { type: "button", variant: "solid", disabled: false },
)

/** Every look but plain: a 40px key of mono type, its words centred. */
const KEY = styles.key
const LOOK: Record<Exclude<PressableVariant, "plain">, StyleProp> = {
  solid: styles.lookSolid,
  outline: styles.lookOutline,
  ghost: styles.lookGhost,
}
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="
      cn(
        props.variant === 'plain' ? styles.transitionTransform : [CONTROL_BUTTON, KEY, LOOK[props.variant]],
        props.xstyle,
        props.class,
      )
    "
  >
    <slot />
  </button>
</template>
