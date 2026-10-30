<script setup lang="ts">
// One plate of the series (`plate.ts`): a 2.35:1 sheet on the page's width,
// square cornered and flat like the hero's print, on the raised ground as
// its stock. Each half shows only the thin end of its ramp (the ramp runs
// 1/tone times the half's depth), through the kit's Bayer screen; the mark,
// 28px (seven 4px cells), stands in the clear band. Decorative.
//
// Its one moment, once, as it comes into view: the tone prints in through
// the kit's reveal (the lights coming on), then the mark walks in from the
// nearer edge to where it stands, a cell at a time at one steady pace, and
// stays: a small figure arriving in a still field. Under five seconds, so
// it needs no pause; under reduced motion the plate is simply there.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherGradient, DitherReveal } from "@dither-kit"
import { MARK, STOCK, type Plate } from "./plate"

const { plate } = defineProps<{ plate: Plate }>()
const pct = (f: number) => `${f * 100}%`

const CELL = 4
// The walk's pace in cells a second, and its longest run.
const PACE = 18
const LONGEST = 4.2
const root = ref<HTMLElement | null>(null)
const mark = ref<SVGSVGElement | null>(null)
let io: IntersectionObserver | null = null

onMounted(() => {
  const box = root.value
  const el = mark.value
  if (!box || !el || typeof IntersectionObserver === "undefined" || typeof el.animate !== "function") return
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
  // From the nearer side edge, just outside the sheet, in whole cells.
  const fromLeft = plate.mark[0] < 0.5
  const run = (fromLeft ? plate.mark[0] : 1 - plate.mark[0]) * box.clientWidth + 14
  const cells = Math.max(1, Math.round(run / CELL))
  const shift = cells * CELL * (fromLeft ? -1 : 1)
  const walk = el.animate(
    [{ transform: `translate(calc(-50% + ${shift}px), -50%)` }, { transform: "translate(-50%, -50%)" }],
    {
      duration: Math.min(LONGEST, cells / PACE) * 1000,
      delay: 800,
      easing: `steps(${cells}, end)`,
      fill: "backwards",
    },
  )
  // Held at the edge, out of sight, until the plate is in view.
  walk.pause()
  io = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      io?.disconnect()
      io = null
      walk.play()
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
    <svg
      ref="mark"
      viewBox="0 0 7 7"
      class="plate-mark"
      :style="{ left: pct(plate.mark[0]), top: pct(plate.mark[1]) }"
      focusable="false"
      shape-rendering="crispEdges"
    >
      <path :d="MARK" fill="currentColor" />
      <rect x="3" y="3" width="1" height="1" fill="var(--signal)" />
    </svg>
  </div>
</template>

<style scoped>
.plate {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 2.35;
  overflow: hidden;
  color: var(--ink);
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

.plate-mark {
  position: absolute;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
}
</style>
