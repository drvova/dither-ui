<script setup lang="ts">
// The engine's anatomy: one real kit button pulled apart into the layers
// that draw it, each painted by the engine itself (the variant's tone ramp,
// the seed's 4x4 threshold matrix, the cells that pass it), under the live
// component, with a spec callout on a leader line for each layer. It plays
// a 10s loop in CSS (no timer): the layers burst apart, hold while a pulse
// climbs the stack from the tone to the component, ringing each layer and
// its leader's point, then fold back into the button; each fold builds the
// next one from a new seed (the loop's `animationiteration`). It runs only
// in view, its pause chip stops it apart, and under reduced motion it holds
// still, apart. The button rolls the seed by hand too.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { DitherButton, kitFromSeed, putRasterBuffer, renderDitherButton } from "@dither-kit"
import { pixelMatrixFromSeed } from "@dither-kit/engine/pixel"
import PauseChip from "./PauseChip.vue"

// One layer's size and cell, the button's own (`variant` gradient).
const CELL = 6
const W = 240
const H = 144
const COLS = W / CELL
const ROWS = H / CELL

const seed = ref(1984)
const hue = computed(() => kitFromSeed(seed.value).hue)
const matrix = computed(() => pixelMatrixFromSeed(seed.value))
// The gradient variant's tone per row, as the engine ramps it.
const tone = (y: number) => 0.25 + 0.75 * ((y + 0.5) / ROWS)

const toneEl = ref<HTMLCanvasElement | null>(null)
const matrixEl = ref<HTMLCanvasElement | null>(null)
const cellsEl = ref<HTMLCanvasElement | null>(null)

function grey(canvas: HTMLCanvasElement | null, value: (x: number, y: number) => number) {
  const ctx = canvas?.getContext("2d")
  if (!canvas || !ctx) return
  canvas.width = COLS
  canvas.height = ROWS
  const img = ctx.createImageData(COLS, ROWS)
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const v = Math.round(value(x, y) * 235)
      const i = (y * COLS + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

function paint() {
  grey(toneEl.value, (_, y) => tone(y))
  grey(matrixEl.value, (x, y) => matrix.value[y & 3][x & 3])
  const cells = cellsEl.value
  const ctx = cells?.getContext("2d")
  if (!cells || !ctx) return
  cells.width = COLS
  cells.height = ROWS
  putRasterBuffer(
    ctx,
    renderDitherButton({ width: W, height: H, color: hue.value, variant: "gradient", cell: CELL, seed: seed.value }),
  )
}

const figure = ref<HTMLElement | null>(null)
const playing = ref(true)
// Out of view the loop holds where it is; without an observer it just runs.
const away = ref(typeof IntersectionObserver !== "undefined")
let io: IntersectionObserver | null = null

onMounted(() => {
  paint()
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) playing.value = false
  if (!away.value || !figure.value) return
  io = new IntersectionObserver((entries) => (away.value = !entries.some((e) => e.isIntersecting)))
  io.observe(figure.value)
})
onBeforeUnmount(() => io?.disconnect())
watch(seed, paint)

// The loop's turn: the layers are folded, so the next button is built.
function turn(e: AnimationEvent) {
  if (e.target === e.currentTarget && e.animationName.includes("anat-cycle")) roll()
}
// The next seed whose hue is not red (the page's one warm light is the
// ember; red stays out).
function roll() {
  let next = seed.value
  do next = Math.floor(Math.random() * 1_000_000)
  while (Math.abs(((kitFromSeed(next).hue + 180) % 360) - 180) < 22)
  seed.value = next
}

// Top to bottom, as the callouts read.
const LAYERS = [
  { n: "04", name: "Component", note: "The button you ship: its label, focus ring and keys in the DOM." },
  { n: "03", name: "Cells", note: "Every cell lit where the tone passes its threshold, in the seed's hue." },
  { n: "02", name: "Threshold", note: "The seed's 4x4 Bayer matrix, jittered, tiled under every cell." },
  { n: "01", name: "Tone", note: "The variant's ramp: dim at the top, full at the foot." },
]
</script>

<template>
  <figure
    ref="figure"
    class="anat"
    :data-still="playing ? undefined : 'true'"
    :data-away="away ? 'true' : undefined"
    :style="{ '--w': `${W}px`, '--h': `${H}px` }"
    @animationiteration="turn"
  >
    <PauseChip v-model="playing" label="Pause the anatomy" class="anat-chip" />
    <div class="stack">
      <div class="layer" style="--i: 0" aria-hidden="true"><canvas ref="toneEl" /></div>
      <div class="layer" style="--i: 1" aria-hidden="true"><canvas ref="matrixEl" /></div>
      <div class="layer" style="--i: 2" aria-hidden="true"><canvas ref="cellsEl" /></div>
      <div class="layer top" style="--i: 3">
        <DitherButton
          :seed="seed"
          :color="hue"
          variant="gradient"
          :cell="CELL"
          bloom="off"
          class="anat-btn"
          @click="roll"
          >New seed</DitherButton
        >
      </div>
    </div>
    <figcaption class="callouts">
      <p v-for="(l, i) in LAYERS" :key="l.n" class="callout" :style="{ '--i': LAYERS.length - 1 - i }">
        <span class="leader" aria-hidden="true"></span>
        <span class="tag">
          <span class="speed-tag">{{ l.n }} {{ l.name }}</span>
          <span class="note">{{ l.note }}</span>
        </span>
      </p>
      <span class="spec-line"
        ><span>seed {{ seed }}</span
        ><span>{{ COLS }} × {{ ROWS }} cells</span><span>{{ CELL }}px each</span></span
      >
    </figcaption>
  </figure>
</template>

<style scoped>
/* How far the layers have parted (0 stacked, 1 apart) and how present the
   callouts are; both rest at 1, the still, readable state. */
@property --anat-spread {
  syntax: "<number>";
  inherits: true;
  initial-value: 1;
}

@property --anat-show {
  syntax: "<number>";
  inherits: true;
  initial-value: 1;
}

/* The figure: the stack left of centre, the callouts right of it, each on
   a leader line from its layer's right corner. A layer is set in an
   isometric plane (turned 45 degrees, tipped 60), so its right corner sits
   0.707 (w + h) / 2 right of its centre and 0.354 (h - w) / 2 below it. */
.anat {
  --gap: 62px;
  --cx: 30%;
  --cy: 64%;
  --dx: calc((var(--w) + var(--h)) * 0.3536);
  --dy: calc((var(--h) - var(--w)) * 0.1768);
  position: relative;
  height: 440px;
  margin: 0;
  overflow: hidden;
  border-radius: 20px;
  background: var(--shell-ground), color-mix(in oklab, var(--background) 94%, #a6abb1);
  border: 1px solid var(--line);
}

/* The loop, 10s: folded (0 to 8%), the burst (to 22%, settling; the
   callouts arrive once the layers have parted), apart with a breath while
   the pulse climbs (to 80%; the callouts leave first), the fold (to 94%).
   A layer's ring and its leader's ring fire 1s apart, the tone first. */
@media (prefers-reduced-motion: no-preference) {
  .anat {
    animation: anat-cycle 10s infinite;
  }
  .layer::after {
    animation: anat-ping 10s calc(var(--i) * 1s) infinite;
  }
  .leader::after {
    animation: anat-dot 10s calc(var(--i) * 1s) infinite;
  }
  .anat[data-away] {
    animation-play-state: paused;
  }
  .anat[data-away] .layer::after,
  .anat[data-away] .leader::after {
    animation-play-state: paused;
  }
  .anat[data-still],
  .anat[data-still] .layer::after,
  .anat[data-still] .leader::after {
    animation: none;
  }
}

@keyframes anat-cycle {
  0%,
  8% {
    --anat-spread: 0.06;
    --anat-show: 0;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  14% {
    --anat-show: 0;
  }
  22% {
    --anat-spread: 1;
    --anat-show: 1;
    animation-timing-function: ease-in-out;
  }
  51% {
    --anat-spread: 0.94;
    animation-timing-function: ease-in-out;
  }
  76% {
    --anat-show: 1;
  }
  80% {
    --anat-spread: 1;
    --anat-show: 0;
    animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
  }
  94%,
  100% {
    --anat-spread: 0.06;
    --anat-show: 0;
  }
}

/* The pulse: at 26% of its own turn (the delay staggers it by layer). */
@keyframes anat-ping {
  0%,
  23% {
    opacity: 0;
    scale: 1;
  }
  26% {
    opacity: 1;
  }
  34%,
  100% {
    opacity: 0;
    scale: 1.06;
  }
}

/* The leader's ring: from the point outward, then gone. */
@keyframes anat-dot {
  0%,
  23% {
    opacity: 0;
    scale: 0.6;
  }
  26% {
    opacity: 1;
  }
  36%,
  100% {
    opacity: 0;
    scale: 2.2;
  }
}

.anat-chip {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .anat-chip {
    display: none;
  }
}

.layer {
  position: absolute;
  left: var(--cx);
  top: var(--cy);
  width: var(--w);
  height: var(--h);
  margin: calc(var(--h) / -2) 0 0 calc(var(--w) / -2);
  transform: translateY(calc(var(--i) * var(--gap) * -1 * var(--anat-spread))) rotateX(60deg) rotateZ(-45deg);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--foreground) 22%, transparent),
    0 30px 40px -24px rgb(0 0 0 / 0.9);
}

/* A layer's ring: the signal's outline, lit as the pulse passes. */
.layer::after {
  content: "";
  position: absolute;
  inset: -3px;
  pointer-events: none;
  border-radius: 2px;
  box-shadow: 0 0 0 2px var(--signal);
  opacity: 0;
}

.layer canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.layer.top {
  box-shadow: none;
}

.anat-btn {
  width: 100%;
  height: 100%;
  font-size: 18px;
}

.callouts {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* A callout's leader meets the middle of its speed tag (10px down). */
.callout {
  position: absolute;
  left: calc(var(--cx) + var(--dx));
  right: 28px;
  top: calc(var(--cy) + var(--dy) - var(--i) * var(--gap) * var(--anat-spread));
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: 0;
  opacity: var(--anat-show);
  transform: translateY(-10px);
}

/* The leader: an ember point on the layer's corner, a hairline to the tag. */
.leader {
  position: relative;
  flex: 1;
  min-width: 32px;
  height: 1px;
  margin-top: 10px;
  background: color-mix(in oklab, var(--foreground) 30%, transparent);
}

/* The leader's point rings with its layer. */
.leader::after {
  content: "";
  position: absolute;
  left: -7px;
  top: -7px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--signal);
  opacity: 0;
}

.leader::before {
  content: "";
  position: absolute;
  left: -3px;
  top: -3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--signal);
}

.tag {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 17rem;
}

.note {
  font-size: 12px;
  line-height: 1.55;
  color: var(--ink-2);
}

/* The stack's spec, as separate items along the figure's foot. */
.spec-line {
  position: absolute;
  left: 20px;
  bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}

/* Narrower: the callouts' notes go, the tags stay on their leaders. */
@media (max-width: 1023px) {
  .tag {
    width: auto;
  }
  .note {
    display: none;
  }
}

/* On a phone the stack sits centred, a size down, and the callouts read as
   a list under it, no leaders. */
@media (max-width: 639px) {
  .anat {
    --gap: 46px;
    --cx: 50%;
    --cy: 230px;
    height: auto;
    padding: 330px 20px 20px;
  }
  .layer {
    scale: 0.78;
  }
  .callouts {
    position: static;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .callout {
    position: static;
    opacity: 1;
    transform: none;
  }
  .leader {
    display: none;
  }
  .note {
    display: block;
  }
  .spec-line {
    position: static;
    margin-top: 4px;
  }
}
</style>
