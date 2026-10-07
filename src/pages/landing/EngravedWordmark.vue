<script setup lang="ts">
// Ghost-style engraved wordmark: lighting and texture live in two baked SVG
// layers (public/engraved-rim.svg bleeds ~1% past engraved-letters.svg), both
// masked to the glyph shapes by a shared objectBoundingBox clipPath. A
// cursor-driven specular sheen fills the letters on hover — purely
// event-driven, no timers, so it is reduced-motion safe by construction.
import { ref } from "vue"
import { assetPath } from "@/shared/lib"

const WORDMARK_PATH =
  "M36.224 34.375v110.352h-24.414v-110.352zM0 141.113v22.461h21.973v-22.461zM74.219 62.5v15.625h-9.766c-6.51 0-10.742 1.139-12.695 3.418-1.953 2.279-2.93 6.51-2.93 12.695v42.969c0 6.185.977 10.417 2.93 12.695 1.953 2.279 6.185 3.418 12.695 3.418h9.766v15.625h-15.625c-11.719 0-20.346-2.441-25.879-7.324-5.534-4.883-8.301-12.533-8.301-22.949v-46.875c0-10.417 2.767-18.066 8.301-22.949 5.533-4.883 14.16-7.324 25.879-7.324zM103.027 34.375v25.391h17.578v14.648h-17.578v67.383c0 3.906.488 6.51 1.465 7.812.976 1.303 2.766 1.954 5.371 1.954h10.742v15.625h-16.113c-8.464 0-14.323-1.791-17.578-5.372-3.255-3.58-4.883-10.091-4.883-19.531v-67.871h-13.184v-14.648h13.184v-25.391zM155.762 34.375v25.391h17.578v14.648h-17.578v67.383c0 3.906.488 6.51 1.465 7.812.977 1.303 2.766 1.954 5.371 1.954h10.742v15.625h-16.113c-8.464 0-14.323-1.791-17.578-5.372-3.255-3.58-4.883-10.091-4.883-19.531v-67.871h-13.184v-14.648h13.184v-25.391zM228.027 62.5c14.323 0 24.577 2.604 30.762 7.812 6.184 5.209 9.277 13.672 9.277 25.391v58.594h-24.414v-13.184c-3.906 5.534-8.463 9.44-13.672 11.719-5.208 2.279-11.881 3.418-20.02 3.418-10.416 0-18.066-2.115-22.949-6.348-4.883-4.232-7.324-10.905-7.324-20.02 0-9.765 2.685-16.927 8.056-21.484 5.371-4.557 13.999-6.836 25.879-6.836h25.391v-5.859c0-5.534-1.384-9.44-4.15-11.719-2.768-2.279-7.653-3.418-14.649-3.418h-33.203v-17.578zM233.887 115.723c-8.139 0-13.591 1.058-16.358 3.173-2.766 2.115-4.15 5.859-4.15 11.23 0 4.558 1.139 7.813 3.418 9.766s6.185 2.93 11.719 2.93c8.138 0 14.16-1.791 18.066-5.371 3.906-3.581 5.86-8.952 5.86-16.113v-5.615zM312.988 34.375h24.414v129.199h-24.414zM366.699 102.539v24.414h-24.414v-24.414zM371.582 34.375h24.414v129.199h-24.414zM475.098 62.5v15.625h-9.766c-6.51 0-10.742 1.139-12.695 3.418-1.953 2.279-2.93 6.51-2.93 12.695v42.969c0 6.185.977 10.417 2.93 12.695 1.953 2.279 6.185 3.418 12.695 3.418h9.766v15.625h-15.625c-11.719 0-20.346-2.441-25.879-7.324-5.533-4.883-8.3-12.533-8.3-22.949v-46.875c0-10.417 2.767-18.066 8.3-22.949 5.533-4.883 14.16-7.324 25.879-7.324zM509.766 62.5h15.136v20.02c2.93-7.487 7.487-12.858 13.672-16.114 6.185-3.255 14.16-4.883 23.926-4.883 14.323 0 24.577 2.604 30.762 7.813 6.184 5.208 9.277 13.672 9.277 25.39v58.594h-24.414v-52.734c0-8.464-1.546-14.242-4.638-17.334-3.093-3.093-8.952-4.639-17.578-4.639-8.952 0-15.136 1.953-18.555 5.86-3.418 3.906-5.127 10.905-5.127 20.996v47.851h-24.414v-48.34c0-8.463-1.547-14.241-4.639-17.333-3.092-3.093-8.952-4.639-17.578-4.639-8.952 0-15.136 1.953-18.555 5.859-3.418 3.907-5.127 10.906-5.127 20.997v47.851h-24.414v-92.285h15.137v19.043c2.93-7.161 7.242-12.288 12.939-15.381 5.696-3.092 13.264-4.638 22.705-4.638 10.091 0 17.822 1.7 23.193 5.097 5.371 3.398 8.708 8.708 10.01 15.918zM622.07 62.5h24.414v101.074h-24.414zM622.07 40.039h24.414v14.648h-24.414zM685.547 101.074c0-8.138.325-14.078.976-17.822.651-3.743 1.872-6.836 3.663-9.277 2.441-3.581 5.778-6.267 10.009-8.057 4.232-1.79 9.196-2.685 14.893-2.685h23.437v15.625h-13.671c-5.534 0-9.196.976-11.065 2.93-1.872 1.953-2.808 5.696-2.808 11.23v66.895h24.414v17.334h-24.414v29.785h-14.649v-29.785h-11.23v-17.334h11.23v-58.594h-10.785v-12.207zM802.246 34.375h24.414v129.199h-24.414zM855.957 62.5c14.323 0 24.577 2.604 30.762 7.812 6.184 5.209 9.277 13.672 9.277 25.391v58.594h-24.414v-13.184c-3.906 5.534-8.463 9.44-13.672 11.719-5.208 2.279-11.881 3.418-20.02 3.418-10.416 0-18.066-2.115-22.949-6.348-4.883-4.232-7.324-10.905-7.324-20.02 0-9.765 2.686-16.927 8.057-21.484 5.371-4.557 13.998-6.836 25.879-6.836h25.39v-5.859c0-5.534-1.383-9.44-4.15-11.719-2.766-2.279-7.652-3.418-14.648-3.418h-33.203v-17.578zM861.816 115.723c-8.138 0-13.59 1.058-16.357 3.173-2.767 2.115-4.15 5.859-4.15 11.23 0 4.558 1.139 7.813 3.418 9.766s6.185 2.93 11.719 2.93c8.138 0 14.16-1.791 18.066-5.371 3.906-3.581 5.859-8.952 5.859-16.113v-5.615z"
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
const lit = ref<HTMLImageElement | null>(null)

// Cursor pool that reveals the lit letter bodies — a soft round pool in the
// lit layer's own coordinate space.
const POOL_MASK =
  "radial-gradient(13rem 10rem at var(--px, 50%) var(--py, 40%), black 0%, rgba(0, 0, 0, 0.72) 52%, transparent 80%)"

function onMove(e: MouseEvent) {
  const s = sheen.value
  const r = s?.getBoundingClientRect()
  if (s && r) {
    s.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`)
    s.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`)
  }
  // the lit layer lives in the magnified letters' box — resolve the cursor in
  // ITS space so the pool centers exactly under the hand
  const l = lit.value
  const lr = l?.getBoundingClientRect()
  if (l && lr) {
    l.style.setProperty("--px", `${((e.clientX - lr.left) / lr.width) * 100}%`)
    l.style.setProperty("--py", `${((e.clientY - lr.top) / lr.height) * 100}%`)
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
          <path :d="WORDMARK_PATH" :transform="MASK_TRANSFORM" />
        </clipPath>
      </defs>
    </svg>

    <!-- Rim lighting bleeds ~1% past the letters so the bevel glow escapes
         the glyph edges; max-w-none defeats the preflight img cap that would
         silently clamp the bleed back to 100% -->
    <img
      :src="assetPath('/engraved-rim.svg')"
      alt=""
      class="pointer-events-none absolute max-w-none"
      :style="RIM_BOX"
    />
    <!-- Letter detail sits LARGER than the rim (ghost's convex-concave depth
         parallax) -->
    <img
      :src="assetPath('/engraved-letters.svg')"
      alt=""
      class="pointer-events-none absolute max-w-none"
      :style="LETTERS_BOX"
    />

    <!-- Lit letter bodies: the glyphs FILLED with glass light, bounded by the
         shared glyph mask and revealed only inside a cursor-driven pool
         (mask-image), so the light takes the letterforms' shape -->
    <img
      :ref="(el) => { if (el) lit = el as HTMLImageElement }"
      :src="assetPath('/engraved-lit.svg')"
      alt=""
      class="pointer-events-none absolute max-w-none opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100"
      :style="{
        ...LETTERS_BOX,
        clipPath: 'url(#wordmark-letters)',
        maskImage: POOL_MASK,
        WebkitMaskImage: POOL_MASK,
        mixBlendMode: 'plus-lighter',
      }"
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
          rgba(168, 204, 240, 0.12),
          transparent 70%
        );
        mix-blend-mode: screen;
      "
    />
  </div>
</template>
