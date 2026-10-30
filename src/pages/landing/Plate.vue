<script setup lang="ts">
// One plate of the series (`plate.ts`): a 2.35:1 sheet on the page's width,
// square cornered and flat like the hero's print, on the raised ground as
// its stock. Each half shows only the thin end of its ramp (the ramp runs
// 1/tone times the half's depth), through the kit's Bayer screen; the brand,
// the mark and the pixel wordmark in 4px cells, stands in the clear band,
// pulled in from the right edge where the plate is narrow. Decorative.
//
// Its one moment, once, as it comes into view: the tone prints in through
// the kit's reveal (the lights coming on) while the mark's cells lie loose
// across the field; they gather left to right into the mark, which holds a
// beat, bursts to the right and settles, in order across, into the whole
// brand. Each cell steps whole cells on the grid. Under five seconds, so it
// needs no pause; under reduced motion (and before the app runs) the plate
// is simply there, the brand assembled.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherGradient, DitherReveal } from "@dither-kit"
import { choreograph, LOCKUP, LOCKUP_SIZE, MOMENT, STOCK, type Plate, type Waypoint } from "./plate"

const { plate } = defineProps<{ plate: Plate }>()
const pct = (f: number) => `${f * 100}%`

const CELL = 4
const WIDTH = LOCKUP_SIZE.width * CELL
const HALF = 3.5 * CELL
const root = ref<HTMLElement | null>(null)
const lockup = ref<HTMLElement | null>(null)
// Indexed by the lockup's order: a v-for ref array keeps no order.
const cells: HTMLElement[] = []
let io: IntersectionObserver | null = null

/** One axis of a path as keyframes, each leg stepped one cell at a time. */
const legs = (path: Waypoint[], axis: "x" | "y", home: number, value: (d: number) => Keyframe): Keyframe[] =>
  path.map((p, k) => {
    const next = path[k + 1]
    const steps = next ? Math.round(Math.abs(next[axis] - p[axis]) / CELL) : 0
    return { ...value(p[axis] - home), offset: p.t / MOMENT.end, easing: `steps(${Math.max(1, steps)}, end)` }
  })

onMounted(() => {
  const box = root.value
  const set = lockup.value
  const els = cells
  if (!box || !set || !els[0] || typeof IntersectionObserver === "undefined" || typeof els[0].animate !== "function")
    return
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const slots = LOCKUP.map((c) => ({ x: set.offsetLeft + c.x * CELL, y: set.offsetTop + c.y * CELL }))
  const paths = choreograph(plate, { width: box.clientWidth, height: box.clientHeight }, slots, CELL)
  // Each axis its own animation, so each steps whole cells.
  const moves = els.flatMap((el, i) => [
    el.animate(
      legs(paths[i], "x", slots[i].x, (d) => ({ translate: `${d}px 0` })),
      MOMENT.end,
    ),
    el.animate(
      legs(paths[i], "y", slots[i].y, (d) => ({ transform: `translateY(${d}px)` })),
      MOMENT.end,
    ),
  ])
  // Held loose, out of sight, until the plate is in view.
  for (const move of moves) move.pause()
  io = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      io?.disconnect()
      io = null
      for (const move of moves) move.play()
    },
    { threshold: 0.6 },
  )
  io.observe(box)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div ref="root" class="plate" :style="{ background: STOCK }" aria-hidden="true">
    <DitherReveal class="plate-print" :duration="0.72" easing="linear">
      <div class="plate-tone" :style="{ top: 0, height: pct(plate.band[0]) }">
        <DitherGradient
          from="#e4e1d8"
          :to="STOCK"
          direction="down"
          :cell="CELL"
          :style="{ inset: 'auto 0 0', height: pct(1 / plate.sky) }"
        />
      </div>
      <div class="plate-tone" :style="{ top: pct(plate.band[1]), bottom: 0 }">
        <DitherGradient
          from="#e4e1d8"
          :to="STOCK"
          direction="up"
          :cell="CELL"
          :style="{ inset: '0 0 auto', height: pct(1 / plate.ground) }"
        />
      </div>
    </DitherReveal>
    <div
      ref="lockup"
      class="plate-lockup"
      :style="{
        left: `clamp(16px, calc(${pct(plate.mark[0])} - ${HALF}px), calc(100% - ${WIDTH + 16}px))`,
        top: `calc(${pct(plate.mark[1])} - ${HALF}px)`,
        width: `${WIDTH}px`,
      }"
    >
      <span
        v-for="(c, i) in LOCKUP"
        :ref="(el) => (cells[i] = el as HTMLElement)"
        :key="`${c.x}.${c.y}`"
        class="plate-cell"
        :class="{ core: c.core }"
        :style="{ left: `${c.x * CELL}px`, top: `${c.y * CELL}px` }"
      />
    </div>
  </div>
</template>

<style scoped>
.plate {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 2.35;
  overflow: hidden;
}

.plate-print {
  position: absolute;
  inset: 0;
}

.plate-tone {
  position: absolute;
  inset-inline: 0;
  overflow: hidden;
}

.plate-lockup {
  position: absolute;
  height: 28px;
}

.plate-cell {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--ink);
}

.plate-cell.core {
  background: var(--signal);
}
</style>
