<script setup lang="ts">
// The mascot at the wheel of its car (`car.ts`): one picture on one cell
// grid, the car in the ink around it with its ember stripe, door diamond
// and tail light, the mascot behind the windscreen. `size` is its height in
// px. While `driving` its wheels turn (held still under reduced motion);
// parked, they rest. Decorative: what it stands beside says what it means.
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { type CarInk, DRIVEN_H, DRIVEN_TOP, DRIVEN_W, drivenCells, toRuns, WHEEL_STEPS } from "./car"

const props = withDefaults(defineProps<{ size: number; driving?: boolean }>(), { driving: false })

const turn = ref(0)

const SIGNAL = "var(--signal, var(--swatch-orange))"
/** A car cell's paint: the body a shade under the ink so its lights read
 * brighter, the glass and the tyres fainter, the stripe and lights in ember. */
const PAINT: Record<CarInk, { fill: string; opacity?: number }> = {
  body: { fill: "currentColor", opacity: 0.82 },
  light: { fill: "currentColor" },
  glass: { fill: "currentColor", opacity: 0.32 },
  tyre: { fill: "currentColor", opacity: 0.42 },
  ember: { fill: SIGNAL },
}
type Cell = ReturnType<typeof drivenCells>[number]
const paintOf = (c: Cell) => ("driver" in c ? (c.ink === "ember" ? "ember" : "light") : c.ink)
/** Each row's same-paint neighbours as one rect. */
const runs = computed(() =>
  toRuns(drivenCells(turn.value), paintOf).map((r) => ({ ...r, ...PAINT[r.paint as CarInk] })),
)

let spin: ReturnType<typeof setInterval> | undefined
const still = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
watch(
  () => props.driving,
  (on) => {
    clearInterval(spin)
    if (on && !still()) spin = setInterval(() => (turn.value = (turn.value + 1) % WHEEL_STEPS), 70)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(spin))
</script>

<template>
  <svg
    class="mascot-car"
    :viewBox="`0 ${DRIVEN_TOP} ${DRIVEN_W} ${DRIVEN_H}`"
    :height="props.size"
    :width="(props.size * DRIVEN_W) / DRIVEN_H"
    aria-hidden="true"
    focusable="false"
    shape-rendering="crispEdges"
  >
    <rect
      v-for="r in runs"
      :key="`${r.x}.${r.y}`"
      :x="r.x"
      :y="r.y"
      :width="r.w"
      height="1"
      :fill="r.fill"
      :fill-opacity="r.opacity"
    />
  </svg>
</template>

<style scoped>
.mascot-car {
  flex-shrink: 0;
  overflow: visible;
}
</style>
