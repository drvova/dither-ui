<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import type { Plate } from "./plates"

// One renderer for every landing figure. The plate is markup (it serializes
// into the prerender and scales crisply at any DPR); motion is CSS on a
// single latch: the first time the figure is properly in view it goes live
// (data-live), each group plays once, and the last animation's end marks it
// done (data-done) — no timers, no rAF. The latch attributes are runtime
// state: the prerender strips them, so the static bytes ship the figure
// un-latched and the client plays the entrance exactly once (never a flash
// of the finished art before the app mounts over it).
// Under reduced motion the CSS never arms, so the figure
// is simply its final frame. Strokes and dashes run 3% long: under
// crispEdges, float drift along a long dash lattice otherwise opens 1px
// seams between abutting cells.
withDefaults(
  defineProps<{
    plate: Plate
    /** develop: groups light in order (Bayer rank → the dither itself is the
     * transition); rise: groups climb into place one cell per step. */
    motion?: "develop" | "rise"
    fit?: string
  }>(),
  { motion: "develop", fit: "xMidYMax meet" },
)

const root = ref<SVGSVGElement | null>(null)
const live = ref(false)
const done = ref(false)
let io: IntersectionObserver | null = null


// Heat scales with the cell's own brightness, so the develop keeps the
// figure's tonal structure: bright cells land white-hot, mid tones glint
// ember, dark cells simply appear (a night side must never flash).
function heat(hex: string): string {
  const lin = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const l = 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5)
  return l >= 0.3 ? "hot" : l >= 0.1 ? "warm" : ""
}

onMounted(() => {
  if (typeof IntersectionObserver === "undefined" || !root.value) {
    live.value = true
    done.value = true
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      live.value = true
      io?.disconnect()
      io = null
    },
    { threshold: 0.3 },
  )
  io.observe(root.value)
})

onBeforeUnmount(() => {
  io?.disconnect()
  io = null
})

// The develop is over when the last running animation in the figure ends —
// whichever element carries it (heat tiers vary per colour, so no fixed
// element is guaranteed the final one). Settled, later data changes (the
// seeded strip) repaint instantly instead of replaying.
function onEnd() {
  if (!root.value?.getAnimations({ subtree: true }).length) done.value = true
}
</script>

<template>
  <svg
    ref="root"
    class="plate"
    :class="motion"
    :data-live="live || undefined"
    :data-done="done || undefined"
    :viewBox="`0 0 ${plate.w} ${plate.h}`"
    :preserveAspectRatio="fit"
    shape-rendering="crispEdges"
    fill="none"
    stroke-width="1.03"
    :stroke-dasharray="plate.period > 1 ? `1.03 ${plate.period - 1.03}` : undefined"
    aria-hidden="true"
    focusable="false"
    @animationend="onEnd"
  >
    <g
      v-for="g in plate.groups"
      :key="g.index"
      :class="{ tw: g.twinkle }"
      :style="{ '--g': g.index, '--lift': plate.h - g.top }"
    >
      <path v-for="l in g.layers" :key="l.color" :d="l.d" :stroke="l.color" :class="heat(l.color)" />
    </g>
  </svg>
</template>

<style scoped>
.plate {
  display: block;
  overflow: hidden;
}

/* Heat = time: a cell lands white-hot, flares ember, and cools into its own
   tone in quantized steps — the eye reads the order pixels were placed in.
   Keyframes give only the hot start; the end is each path's own stroke. */
@media (prefers-reduced-motion: no-preference) {
  .plate:not([data-live]) g {
    opacity: 0;
  }

  .develop[data-live]:not([data-done]) g {
    animation: plate-on 1ms step-end calc(var(--g) * 55ms) backwards;
  }

  .develop[data-live]:not([data-done]) .hot {
    animation: plate-heat 640ms steps(3, jump-none) calc(var(--g) * 55ms) backwards;
  }

  .develop[data-live]:not([data-done]) .warm {
    animation: plate-warm 520ms steps(2, jump-none) calc(var(--g) * 55ms) backwards;
  }

  /* Rise travels whole cells only — one step per cell of lift. */
  .rise[data-live]:not([data-done]) g {
    animation: plate-rise calc(var(--lift) * 34ms) steps(var(--lift), end) calc(var(--g) * 90ms) backwards;
  }

  .rise[data-live]:not([data-done]) .hot {
    animation: plate-heat 640ms steps(3, jump-none) calc(var(--g) * 90ms + var(--lift) * 34ms) backwards;
  }

  [data-done] .tw {
    animation: plate-twinkle 3.4s steps(2, jump-none) calc(var(--g) * -1.13s) infinite;
  }
}

@keyframes plate-on {
  from {
    opacity: 0;
  }
}

@keyframes plate-rise {
  from {
    transform: translateY(calc(var(--lift) * 1px));
  }
}

@keyframes plate-heat {
  from {
    stroke: #fff;
  }
  34% {
    stroke: var(--swatch-orange);
  }
}

@keyframes plate-warm {
  from {
    stroke: var(--swatch-orange);
  }
}

@keyframes plate-twinkle {
  50% {
    opacity: 0.2;
  }
}
</style>
