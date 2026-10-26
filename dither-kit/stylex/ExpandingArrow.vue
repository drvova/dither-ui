<!-- Generated from ../tailwind/ExpandingArrow.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.75rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    paddingBlock: "0.375rem",
    paddingRight: "0.375rem",
    paddingLeft: "0.875rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
      ":focus-visible": "var(--foreground)",
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  row: { display: "flex", alignItems: "center" },
  text: {
    height: "3px",
    width: "0px",
    opacity: "0%",
    transitionProperty: { default: "width, opacity", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  grid: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    borderRadius: "var(--radius)",
    fontSize: "14px",
    color: "var(--background)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
})
</script>

<script setup lang="ts">
import { cssColor } from "../engine/palette"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** An accent tile that expands into a dotted-arrow trail on hover or focus —
 * the trail is stamped by a repeating radial gradient in the accent hue and
 * the head tile nudges forward. Reduced motion reveals the trail instantly. */
const props = withDefaults(
  defineProps<{
    color?: PixelColor
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "blue", disabled: false },
)
</script>

<template>
  <button
    type="button"
    :disabled="props.disabled"
    :class="cn([styles.button, 'dk-arrow'], CONTROL_BUTTON, props.xstyle, props.class)"
  >
    <slot>Explore the kit</slot>
    <span aria-hidden="true" v-bind="stylex.attrs(styles.row)">
      <span
        v-bind="stylex.attrs(styles.text)"
        class="dk-arrow-trail"
        :style="{
          backgroundImage: `radial-gradient(circle, ${cssColor(props.color)} 1.5px, transparent 1.5px)`,
          backgroundSize: '6px 3px',
          backgroundPosition: 'center',
        }"
      />
      <span v-bind="stylex.attrs(styles.grid)" class="dk-arrow-head" :style="{ background: cssColor(props.color) }">
        →
      </span>
    </span>
  </button>
</template>

<style scoped>
/* The trail answers the whole button: a descendant of its hover or focus,
   which no single element's styles can say. */
@media (hover: hover) {
  .dk-arrow:hover .dk-arrow-trail {
    width: 2.25rem;
    opacity: 1;
  }
  .dk-arrow:hover .dk-arrow-head {
    translate: 0.125rem 0;
  }
}
.dk-arrow:focus-visible .dk-arrow-trail {
  width: 2.25rem;
  opacity: 1;
}
</style>
