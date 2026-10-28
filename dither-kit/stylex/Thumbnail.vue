<!-- Generated from ../tailwind/Thumbnail.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  a: {
    position: "relative",
    display: "block",
    cursor: "zoom-in",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    outlineStyle: "none",
    boxShadow: {
      default: null,
      ":focus-visible":
        "0 0 0 2px var(--background), 0 0 0 calc(2px + 2px) color-mix(in oklab, var(--accent) 30%, transparent)",
    },
  },
  layer: {
    position: "absolute",
    inset: "0px",
    display: "block",
    overflow: "hidden",
    borderRadius: "inherit",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
  },
  img: {
    height: "100%",
    width: "100%",
    objectFit: "cover",
    opacity: "70%",
    transitionProperty: { default: "opacity, scale", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
    transitionDuration: "300ms",
  },
  layer2: {
    pointerEvents: "none",
    position: "absolute",
    inset: "0px",
    opacity: "100%",
    transitionProperty: { default: "opacity", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
    transitionDuration: "300ms",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

// The interactive thumbnail: a parent link is the trigger, a masked frame
// (radius + hairline border + overflow hidden) holds a cover-fit image that
// rests recessed — 70% opacity under a Bayer dot veil — and on hover the
// whole thing wakes: the image scales up a touch while fading to full
// opacity as the veil dissolves. One transition block, interruptible mid-
// flight, clipped by the frame so the zoom never escapes it. zoom-in cursor
// announces the affordance before the first pixel moves.
const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    href: string
    /** aspect ratio of the frame, width/height — the house default is phi. */
    ratio?: string
    /** dither veil cell size in css px. */
    veilCell?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { ratio: "1.618", veilCell: 4 },
)
</script>

<template>
  <a
    :href="props.href"
    :aria-label="props.alt"
    :class="cn([styles.a, 'dk-thumb'], props.xstyle, props.class)"
    :style="{ aspectRatio: props.ratio }"
  >
    <span v-bind="stylex.attrs(styles.layer)">
      <img
        :src="props.src"
        :alt="props.alt"
        loading="lazy"
        decoding="async"
        v-bind="stylex.attrs(styles.img)"
        class="dk-thumb-img"
      />
      <!-- The recessed veil: the house Bayer lattice as a dot overlay. It is
           what makes the resting state feel sunk into the page rather than
           merely dimmed, and it dissolves as the image wakes. -->
      <span
        aria-hidden="true"
        v-bind="stylex.attrs(styles.layer2)"
        class="dither-veil"
        :style="{ backgroundSize: `${props.veilCell * 4}px ${props.veilCell * 4}px` }"
      />
    </span>
  </a>
</template>

<style scoped>
/* A 4x4 Bayer lattice tile: one cell of four lit, offset per row — the same
   ordered-dither rhythm the canvas engine uses, as a static overlay. */
.dither-veil {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cg fill='%23000' fill-opacity='0.5'%3E%3Crect x='0' y='0' width='2' height='2'/%3E%3Crect x='8' y='8' width='2' height='2'/%3E%3C/g%3E%3Cg fill='%23fff' fill-opacity='0.35'%3E%3Crect x='8' y='0' width='2' height='2'/%3E%3Crect x='0' y='8' width='2' height='2'/%3E%3C/g%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

/* Hover wakes the image and dissolves the veil: the link's descendants,
   which no single element's styles can say. */
@media (hover: hover) {
  .dk-thumb:hover .dk-thumb-img {
    scale: 1.04;
    opacity: 1;
  }
  .dk-thumb:hover .dither-veil {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dither-veil {
    opacity: 0;
  }
}
</style>
