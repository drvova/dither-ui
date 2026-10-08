<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { createDitherField, type Body, type DitherField } from "./dither-field"
import { SKY, SUN } from "./plates"

// The living sky: a dither organism breathing over the dawn plate's
// horizon, rendered by the vanilla `dither-field` engine — three seeded
// bodies drift on incommensurate clocks, ordered-dithered through the 8x8
// Bayer matrix onto the house SKY ramp; the cursor drops a fourth body that
// ignites into the SUN ramp at its core. Art yields to text: the stage copy's
// box is handed to the engine as a soft exclusion, so the creature can never
// sit behind the statement at any width (the old blob did, on phones).
//
// Budget: 24fps, 3px cells, DPR clamp 2, paused offscreen + on tab-hide,
// one static frame under reduced motion, scroll parallax 0.12.
const props = defineProps<{ avoid?: HTMLElement | null }>()

// Bodies anchor across the sky's right half (never behind the copy, never
// over the plate) and scale with the stage's short side so the creature
// reads at desktop width without flooding a narrow stage. Wide stages get
// a wider spread; narrow ones tuck the bodies into the band between the
// copy and the horizon.
function skyBodies(w: number, h: number, rand: () => number): Body[] {
  const narrow = w < 640
  // Narrow stages stack copy over horizon, so the creature lives in the
  // band between the action and the plate (y in stage fractions); wide
  // stages hang it in the upper-right sky (y in sky-band fractions).
  const skyH = narrow ? h : h * 0.62
  const dim = narrow ? w * 0.9 : Math.min(w, skyH * 2.2) * 0.72
  const anchors = narrow
    ? [
        { x: 0.3, y: 0.78, r: 0.24 },
        { x: 0.74, y: 0.8, r: 0.2 },
        { x: 0.52, y: 0.74, r: 0.14 },
      ]
    : [
        { x: 0.66, y: 0.4, r: 0.26 },
        { x: 0.8, y: 0.56, r: 0.21 },
        { x: 0.9, y: 0.42, r: 0.17 },
      ]
  return anchors.map((a, i) => ({
    x: a.x * w + (rand() - 0.5) * w * 0.04,
    y: a.y * skyH + (narrow ? 0 : skyH * 0.08),
    r: dim * a.r,
    fx: 0.1 + i * 0.043 + rand() * 0.01,
    fy: 0.08 + i * 0.037 + rand() * 0.01,
    px: i * 2.399 + rand(),
    py: i * 2.399 + 1.9 + rand(),
    // Peaks sit below the ramp's top: the brightest ice only ever appears
    // dithered into the body, never as a solid disc (the old creature's
    // cream core, measured as a flat plate at desktop width).
    w: (narrow ? 0.52 : 0.6) - i * 0.08,
  }))
}

// Vertical melt: full light in the sky band, gone before the plate seam.
function melt(_x: number, y: number, w: number, h: number): number {
  const narrow = w < 640
  const top = h * 0.08
  const bot = h * (narrow ? 0.84 : 0.68)
  if (y < top) return y / top
  if (y > bot) return Math.max(0, 1 - (y - bot) / (h * (narrow ? 0.1 : 0.14)))
  return 1
}

const canvas = ref<HTMLCanvasElement | null>(null)
let field: DitherField | null = null
let ro: ResizeObserver | null = null
let ticking = false

function measureAvoid() {
  const el = props.avoid
  const c = canvas.value
  if (!el || !c || !field) return
  // The copy block is a padded full-width band and its children are
  // full-width blocks too; the exclusion is the union of their CONTENTS
  // (a Range over each child measures the line boxes — the ink itself),
  // so the sky keeps everything right of the longest line.
  let l = Infinity
  let t = Infinity
  let r = -Infinity
  let btm = -Infinity
  const range = document.createRange()
  for (const child of Array.from(el.children)) {
    range.selectNodeContents(child)
    const a = range.getBoundingClientRect()
    if (a.width === 0 || a.height === 0) continue
    l = Math.min(l, a.left)
    t = Math.min(t, a.top)
    r = Math.max(r, a.right)
    btm = Math.max(btm, a.bottom)
  }
  const b = c.getBoundingClientRect()
  if (!Number.isFinite(l)) return field.setAvoid(null)
  field.setAvoid({ x: l - b.left, y: t - b.top, w: r - l, h: btm - t }, b.width < 640 ? 40 : 72)
}

// The copy block is a later sibling in the stage, so its ref lands after
// this component mounts: bind the exclusion whenever the element arrives.
watch(
  () => props.avoid,
  (el) => {
    ro?.disconnect()
    ro = null
    if (!el) return
    measureAvoid()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measureAvoid)
      ro.observe(el)
    }
  },
  { flush: "post" },
)

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    field?.setScroll(window.scrollY)
  })
}

onMounted(() => {
  const el = canvas.value
  if (!el) return
  field = createDitherField(el, {
    ramp: SKY,
    // Ember then pale — never the cream top of SUN, which read as a plate.
    hot: SUN.slice(0, 2),
    hotAt: 0.93,
    cell: 3,
    fps: 24,
    matrix: 8,
    seed: 7,
    pointer: 0.62,
    pointerRadius: 56,
    scroll: 0.12,
    sizzle: 0.5,
    bodies: skyBodies,
    mask: melt,
  })
  measureAvoid()
  window.addEventListener("scroll", onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll)
  ro?.disconnect()
  ro = null
  field?.destroy()
  field = null
})
</script>

<template>
  <canvas ref="canvas" aria-hidden="true" class="sky-organism"></canvas>
</template>

<style scoped>
.sky-organism {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  display: block;
}

@media (prefers-reduced-motion: no-preference) {
  .sky-organism {
    animation: organism-in 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: 200ms;
  }
  @keyframes organism-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
