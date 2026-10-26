<script setup lang="ts">
import { cn } from "./lib"

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
  }>(),
  { ratio: "1.618", veilCell: 4 },
)
</script>

<template>
  <a
    :href="props.href"
    :aria-label="props.alt"
    :class="
      cn(
        'group relative block cursor-zoom-in overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        props.class,
      )
    "
    :style="{ aspectRatio: props.ratio }"
  >
    <span class="absolute inset-0 block overflow-hidden rounded-[inherit] border border-border/70">
      <img
        :src="props.src"
        :alt="props.alt"
        loading="lazy"
        decoding="async"
        class="h-full w-full object-cover opacity-70 transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:opacity-100 motion-reduce:transition-none"
      />
      <!-- The recessed veil: the house Bayer lattice as a dot overlay. It is
           what makes the resting state feel sunk into the page rather than
           merely dimmed, and it dissolves as the image wakes. -->
      <span
        aria-hidden="true"
        class="dither-veil pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-0 motion-reduce:transition-none"
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

@media (prefers-reduced-motion: reduce) {
  .dither-veil {
    opacity: 0;
  }
}
</style>
