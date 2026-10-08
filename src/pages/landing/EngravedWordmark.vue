<script setup lang="ts">
// Ghost-style engraved wordmark. The four baked layers (rim, carve, hover
// bloom/core) ship as MARKUP STRINGS in wordmark-layers.ts and render INLINE
// via v-html — img-embedded svg rasterizes its filters in isolation (blocky
// artifacts at layer edges), inline svg renders in-document at page
// resolution with exact filter/mask coordinates. The layers are still masked
// to the glyph shapes by a shared objectBoundingBox clipPath; a cursor-driven
// specular sheen fills the letters on hover — purely event-driven, no timers,
// so it is reduced-motion safe by construction.
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue"
import {
  WORDMARK_GLYPH_PATH,
  WORDMARK_LETTERS,
  WORDMARK_LIGHT_BLOOM,
  WORDMARK_LIGHT_CORE,
  WORDMARK_RIM,
} from "./wordmark-layers"

// Ghost.ai's measured registration (DevTools): the rim bleeds 0.96% while the
// letter-detail layer sits LARGER (103.32%, shifted -1.66%/-3.47%) — convex
// light behind a magnified concave surface. The glyph mask compensates with
// the letters' exact transform so the sheen stays registered to the visible
// glyphs. viewBox is 1027x236; the container aspect matches it exactly.
const VB_W = 1027
const VB_H = 236
const RIM_SCALE = 1.0096
const LETTER_SCALE = 1.0332
const LETTER_DX = -0.0166
const LETTER_DY = -0.0347
const RIM_BOX = {
  width: `${RIM_SCALE * 100}%`,
  height: `${RIM_SCALE * 100}%`,
  left: `${((1 - RIM_SCALE) / 2) * 100}%`,
  top: `${((1 - RIM_SCALE) / 2) * 100}%`,
}
const LETTERS_BOX = {
  width: `${LETTER_SCALE * 100}%`,
  height: `${LETTER_SCALE * 100}%`,
  left: `${LETTER_DX * 100}%`,
  top: `${LETTER_DY * 100}%`,
}
// p' = translate + scale * (path * (1/vb))  — combines the unit-box
// normalization with the letters-layer compensation in one transform.
const MASK_SCALE_X = (1 / VB_W) * LETTER_SCALE
const MASK_SCALE_Y = (1 / VB_H) * LETTER_SCALE
const MASK_TRANSFORM = `translate(${LETTER_DX} ${LETTER_DY}) scale(${MASK_SCALE_X} ${MASK_SCALE_Y})`

const sheen = ref<HTMLElement | null>(null)
const lit = ref<HTMLElement | null>(null)
const bloom = ref<HTMLElement | null>(null)

// The self-engraving: the rim's contour stroke draws itself the first time
// the mark scrolls into view — pathLength normalizes the compound glyph path
// to one pen length, dashoffset 1→0 traces every contour in sequence. The
// draw recipe ships INSIDE the svg string (v-html children escape Vue's
// scoped styles); hiding is gated on the component's own data-armed so a
// no-JS visit renders the finished mark. Reduced motion: full rim, static.
const armed = ref(false)
const live = ref(false)
let io: IntersectionObserver | null = null

const RIM_DRAW = WORDMARK_RIM.replace(
  '" stroke="#D6EAFF"',
  ' pathLength="1" class="wm-pen" stroke="#D6EAFF"',
).replace(
  /(<svg[^>]*>)/,
  `$1<style>
    [data-armed]:not([data-live]) .wm-pen { stroke-dasharray: 1; stroke-dashoffset: 1; }
    [data-live] .wm-pen { stroke-dasharray: 1; stroke-dashoffset: 1; animation: wm-pen-draw 2s linear both; }
    @keyframes wm-pen-draw { to { stroke-dashoffset: 0; } }
    @media (prefers-reduced-motion: reduce) {
      [data-armed] .wm-pen, [data-live] .wm-pen { animation: none; stroke-dasharray: none; stroke-dashoffset: 0; }
    }
  </style>`,
)

onBeforeMount(() => {
  armed.value = true
})

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") {
    live.value = true
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        live.value = true
        io?.disconnect()
        io = null
      }
    },
    { threshold: 0.35 },
  )
  if (sheen.value) io.observe(sheen.value)
})

onBeforeUnmount(() => {
  io?.disconnect()
  io = null
})

// Cursor pool that reveals the lit letter light — a soft round pool resolved
// in EACH light layer's own box (they carry the letters' magnification, so
// the pool registers exactly under the hand). The focus sits up-left of the
// cursor: light ENTERS from that direction, so the reveal is asymmetric
// instead of a symmetric blob.
const POOL_MASK =
  "radial-gradient(13rem 10.5rem at calc(var(--px, 50%) - 1.1rem) calc(var(--py, 40%) - 0.5rem), black 0%, rgba(0, 0, 0, 0.72) 45%, transparent 72%)"

function onMove(e: MouseEvent) {
  const s = sheen.value
  const r = s?.getBoundingClientRect()
  if (s && r) {
    s.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`)
    s.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`)
  }
  for (const el of [lit.value, bloom.value]) {
    const lr = el?.getBoundingClientRect()
    if (el && lr) {
      el.style.setProperty("--px", `${((e.clientX - lr.left) / lr.width) * 100}%`)
      el.style.setProperty("--py", `${((e.clientY - lr.top) / lr.height) * 100}%`)
    }
  }
}
</script>

<template>
  <div
    aria-hidden="true"
    class="group relative w-full select-none"
    style="aspect-ratio: 1027 / 236"
    @mousemove="onMove"
  >
    <!-- Shared glyph mask, compensated by the letters-layer transform so the
         sheen stays registered with the magnified letter surface -->
    <svg width="0" height="0" focusable="false" style="position: absolute">
      <defs>
        <clipPath id="wordmark-letters" clipPathUnits="objectBoundingBox">
          <path :d="WORDMARK_GLYPH_PATH" :transform="MASK_TRANSFORM" />
        </clipPath>
      </defs>
    </svg>

    <!-- Rim lighting bleeds ~1% past the letters so the bevel glow escapes
         the glyph edges; the layer markup is injected INLINE (v-html) -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute"
      :style="RIM_BOX"
      :data-armed="armed ? 'true' : undefined"
      :data-live="live ? 'true' : undefined"
      v-html="RIM_DRAW"
    />
    <!-- Letter detail sits LARGER than the rim (ghost's convex-concave depth
         parallax). On hover the carve RECEDES to 45% — with the light pooling
         over it, the dark fill + inner shadows must not sit around the pool
         edge as a shadow plate; un-lit areas fall back to plain background -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute opacity-100 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-45"
      :style="LETTERS_BOX"
      v-html="WORDMARK_LETTERS"
    />

    <!-- Hover light, ghost's stacking: a BLOOM (heavier blur — the halation
         that bleeds past the letter edges) under a CORE (sharper ramp fill +
         grain). No glyph clip — like theirs, the light layer's own letterforms
         shape it; both are bounded only by the cursor pool (mask-image) -->
    <div
      :ref="(el) => { if (el) bloom = el as HTMLElement }"
      aria-hidden="true"
      class="pointer-events-none absolute opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100"
      :style="{
        ...LETTERS_BOX,
        maskImage: POOL_MASK,
        WebkitMaskImage: POOL_MASK,
        mixBlendMode: 'plus-lighter',
      }"
      v-html="WORDMARK_LIGHT_BLOOM"
    />
    <div
      :ref="(el) => { if (el) lit = el as HTMLElement }"
      aria-hidden="true"
      class="pointer-events-none absolute opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100"
      :style="{
        ...LETTERS_BOX,
        maskImage: POOL_MASK,
        WebkitMaskImage: POOL_MASK,
        mixBlendMode: 'plus-lighter',
      }"
      v-html="WORDMARK_LIGHT_CORE"
    />

    <!-- Faint halo bloom trailing the cursor (the lit bodies above carry the
         shape; this only bleeds a little light past their edges) -->
    <span
      :ref="(el) => { if (el) sheen = el as HTMLElement }"
      class="absolute inset-0 opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100"
      style="
        clip-path: url(#wordmark-letters);
        background: radial-gradient(
          24% 62% at var(--mx, 50%) var(--my, 40%),
          rgba(168, 204, 240, 0.07),
          transparent 58%
        );
        mix-blend-mode: screen;
      "
    />
  </div>
</template>
