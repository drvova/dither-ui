<script setup lang="ts">
// One plate of the series (`plate.ts`): a 2.35:1 sheet on the page's width,
// square cornered and flat like the hero's print, on the raised ground as
// its stock. Each half shows only the thin end of its ramp (the ramp runs
// 1/tone times the half's depth), through the kit's Bayer screen; the mark,
// 28px (seven 4px cells), stands in the clear band. Decorative.
//
// Its one moment, once, as it comes into view: the tone prints in through
// the kit's reveal (the lights coming on) while the mark's cells lie loose
// across the field, then they lift out of the field left to right and travel, a cell
// at a time on the 4px grid, into the mark, which stays. Under five
// seconds, so it needs no pause; under reduced motion (and before the app
// runs) the plate is simply there, the mark assembled.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherGradient, DitherReveal } from "@dither-kit"
import { xorshift32 } from "@dither-kit/engine/pixel"
import { MARK_CELLS, STOCK, type Plate } from "./plate"

const { plate } = defineProps<{ plate: Plate }>()
const pct = (f: number) => `${f * 100}%`

const CELL = 4
// The gather: cells lift from 0.8 s, the leftmost first, the last 1.6 s
// later; each travels at PACE cells a second, held to SPAN seconds. They
// lie loose up to EDGE of the plate's depth into the tone.
const LIFT = 800
const SWEEP = 1600
const PACE = 60
const SPAN: readonly [number, number] = [1.2, 2.4]
const EDGE = 0.08
const root = ref<HTMLElement | null>(null)
const cells = ref<HTMLElement[]>([])
let io: IntersectionObserver | null = null

const at = (c: { x: number; y: number }) => ({
  left: `calc(${pct(plate.mark[0])} + ${(c.x - 3.5) * CELL}px)`,
  top: `calc(${pct(plate.mark[1])} + ${(c.y - 3.5) * CELL}px)`,
})

onMounted(() => {
  const box = root.value
  const els = cells.value
  if (!box || !els[0] || typeof IntersectionObserver === "undefined" || typeof els[0].animate !== "function") return
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const { clientWidth: w, clientHeight: h } = box
  const snap = (v: number) => Math.round(v / CELL) * CELL
  // Where each cell lies at first: on the grid, loose in the field, the
  // same for a plate on every visit.
  const rand = xorshift32(Math.round((plate.mark[0] * 997 + plate.mark[1] * 131) * 1e3))
  const loose = MARK_CELLS.map(() => {
    // The clear band and the thin edges of the tone either side of it.
    const [lo, hi] = [plate.band[0] - EDGE, plate.band[1] + EDGE]
    return { x: snap((0.02 + rand() * 0.96) * w), y: snap((lo + rand() * (hi - lo)) * h) }
  }).sort((a, b) => a.x - b.x)
  // Matched to the mark's cells in the same order across, so paths seldom cross.
  const slots = els.map((el) => ({ el, x: el.offsetLeft, y: el.offsetTop })).sort((a, b) => a.x - b.x || a.y - b.y)
  const moves = slots.flatMap((slot, i) => {
    const from = loose[i]
    const dx = snap(from.x - slot.x)
    const dy = snap(from.y - slot.y)
    const n = Math.max(Math.abs(dx), Math.abs(dy)) / CELL
    const timing = {
      delay: LIFT + (from.x / w) * SWEEP,
      duration: Math.min(SPAN[1], Math.max(SPAN[0], n / PACE)) * 1000,
      fill: "backwards" as const,
    }
    // Each axis steps whole cells, so the cell never leaves the grid.
    return [
      slot.el.animate([{ translate: `${dx}px 0` }, { translate: "0 0" }], {
        ...timing,
        easing: `steps(${Math.max(1, Math.abs(dx) / CELL)}, end)`,
      }),
      slot.el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], {
        ...timing,
        easing: `steps(${Math.max(1, Math.abs(dy) / CELL)}, end)`,
      }),
    ]
  })
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
    <span
      v-for="c in MARK_CELLS"
      ref="cells"
      :key="`${c.x}.${c.y}`"
      class="plate-cell"
      :class="{ core: c.core }"
      :style="at(c)"
    />
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
