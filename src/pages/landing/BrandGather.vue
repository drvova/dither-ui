<script setup lang="ts">
// The brand as cells (`brand.ts`): the lockup, 4px cells seven tall, set
// where its parent places it, its field the nearest positioned ancestor.
// Decorative.
//
// Its one moment, once, as it comes into view: the mark's cells lie loose in
// the scene's rows of the field; they gather left to right into the mark,
// which holds a beat, bursts to the right and settles, in order across, into
// the whole brand. Each cell steps whole cells on the grid. Under five
// seconds, so it needs no pause; under reduced motion (and before the app
// runs) the brand is simply there. With `replay`, a mouse or pen coming to
// rest on it plays the moment again from the top, once it is home (a touch
// does not: a finger passing over is not a hover). `moving` says a replay
// began and `settled` when it is home (at once when it does not move), so a
// parent can keep one moving layer at a time.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { choreograph, LOCKUP, LOCKUP_SIZE, MOMENT, type Staging, type Waypoint } from "./brand"

const { scene, replay = false } = defineProps<{
  scene: Staging
  replay?: boolean
}>()
const emit = defineEmits<{ moving: []; settled: [] }>()

const CELL = 4
const lockup = ref<HTMLElement | null>(null)
// Indexed by the lockup's order: a v-for ref array keeps no order.
const cells: HTMLElement[] = []
let io: IntersectionObserver | null = null
// The moment's animations, two per cell; none where it does not move.
let moves: Animation[] = []
const home = () =>
  void moves[0]?.finished.then(
    () => emit("settled"),
    () => {},
  )
const play = () => {
  io?.disconnect()
  io = null
  for (const move of moves) move.play()
}

function again(e: PointerEvent) {
  if (!replay || e.pointerType === "touch" || !moves.length) return
  if (moves.some((m) => m.playState === "running")) return
  emit("moving")
  for (const move of moves) move.currentTime = 0
  play()
  home()
}

/** One axis of a path as keyframes, each leg stepped one cell at a time. */
const legs = (path: Waypoint[], axis: "x" | "y", home: number, value: (d: number) => Keyframe): Keyframe[] =>
  path.map((p, k) => {
    const next = path[k + 1]
    const steps = next ? Math.round(Math.abs(next[axis] - p[axis]) / CELL) : 0
    return { ...value(p[axis] - home), offset: p.t / MOMENT.end, easing: `steps(${Math.max(1, steps)}, end)` }
  })

onMounted(() => {
  const set = lockup.value
  const field = set?.offsetParent
  if (
    !set ||
    !(field instanceof HTMLElement) ||
    !cells[0] ||
    typeof IntersectionObserver === "undefined" ||
    typeof cells[0].animate !== "function" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return emit("settled")
  const slots = LOCKUP.map((c) => ({ x: set.offsetLeft + c.x * CELL, y: set.offsetTop + c.y * CELL }))
  const box = { width: field.clientWidth, height: field.clientHeight }
  const paths = choreograph(scene(box.height, set.offsetTop), box, slots, CELL)
  // Each axis its own animation, so each steps whole cells.
  moves = cells.flatMap((el, i) => [
    el.animate(
      legs(paths[i], "x", slots[i].x, (d) => ({ translate: `${d}px 0` })),
      MOMENT.end,
    ),
    el.animate(
      legs(paths[i], "y", slots[i].y, (d) => ({ transform: `translateY(${d}px)` })),
      MOMENT.end,
    ),
  ])
  // Held loose until the lockup's home is in view, clear of the bottom edge.
  for (const move of moves) move.pause()
  home()
  io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) play()
    },
    { threshold: 1, rootMargin: "0px 0px -10% 0px" },
  )
  io.observe(set)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div
    ref="lockup"
    class="brand-gather"
    :style="{ width: `${LOCKUP_SIZE.width * CELL}px`, height: `${LOCKUP_SIZE.height * CELL}px` }"
    aria-hidden="true"
    @pointerenter="again"
  >
    <span
      v-for="(c, i) in LOCKUP"
      :ref="(el) => (cells[i] = el as HTMLElement)"
      :key="`${c.x}.${c.y}`"
      class="brand-cell"
      :class="{ core: c.core }"
      :style="{ left: `${c.x * CELL}px`, top: `${c.y * CELL}px` }"
    />
  </div>
</template>

<style scoped>
.brand-gather {
  flex: none;
}

.brand-cell {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--ink);
}

.brand-cell.core {
  background: var(--signal);
}
</style>
