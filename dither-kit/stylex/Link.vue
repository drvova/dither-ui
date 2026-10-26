<!-- Generated from ../tailwind/Link.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  a: {
    textDecorationLine: "underline",
    textDecorationColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 60%, transparent)",
      },
    },
    textUnderlineOffset: "4px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

/** The anchor, dressed: house underline treatment (hairline, grows its
 * offset, brightens on hover) and inheritable color so it sits in prose. */
const props = withDefaults(
  defineProps<{
    href: string
    external?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { external: false },
)
</script>

<template>
  <a
    :href="props.href"
    :target="props.external ? '_blank' : undefined"
    :rel="props.external ? 'noreferrer' : undefined"
    :class="cn(styles.a, props.xstyle, props.class)"
  >
    <slot />
  </a>
</template>
