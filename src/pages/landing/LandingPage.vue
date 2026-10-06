<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import {
  DitherDarkVeil,
  DitherButton,
  DitherGradient,
} from "@dither-kit"
import { assetPath, routePath } from "@/shared/lib"
import { version } from "../../../package.json"
import EngravedWordmark from "./EngravedWordmark.vue"

const openStudio = () => location.assign(routePath("/studio"))

// Portraits + their reaction emotes, cropped from faces.webp — a thin band
// sliced out of the source sheet (rows 766..900) so the landing loads ~70KB
// instead of the full 2MB sheet. Y boxes are relative to the band (source − 766).
const FACE_Y = 0
const FACE_H = 126
const FACES = [
  { x: 29, w: 97, emote: { x: 1503, y: 25, w: 51, h: 49 } }, // neutral → …
  { x: 147, w: 97, emote: { x: 1273, y: 27, w: 42, h: 38 } }, // smile → heart
  { x: 262, w: 95, emote: { x: 1270, y: 92, w: 36, h: 41 } }, // blush → sparkles
  { x: 378, w: 98, emote: { x: 1529, y: 98, w: 25, h: 27 } }, // wink → note
  { x: 497, w: 96, emote: { x: 1458, y: 24, w: 20, h: 47 } }, // surprised → !
  { x: 832, w: 94, emote: { x: 1334, y: 23, w: 40, h: 40 } }, // excited → star
]

const faceEls = ref<HTMLCanvasElement[]>([])
const emoteEls = ref<HTMLCanvasElement[]>([])

function blit(c: HTMLCanvasElement, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  c.getContext("2d")?.drawImage(img, x, y, w, h, 0, 0, c.width, c.height)
}

// The essay: statements light up as they cross the viewport, the in-focus one's
// index scales with a spring. A rAF-throttled scroll driver picks the lit set
// (a ratchet — anything whose top crossed 85% of the viewport, never un-lit)
// and the active one (the statement whose band is nearest the viewport middle).
const STAGES = [
  { lines: ["Every pixel is placed", "on purpose."], n: "01" },
  { lines: ["Charts, buttons, avatars", "and gradients — rendered", "pixel by pixel on canvas."], n: "02" },
  { lines: ["One palette: seven seeds;", "fill, line and sparkle hues", "resolve from the same source."], n: "03" },
  { lines: ["Every fill is deterministic —", "a seed replays it forever, and", "explicit props always win."], n: "04" },
  { lines: ["Layout, motion and text", "families compose from the", "same dither engine."], n: "05" },
  { lines: ["Copy the folder, alias it —", "no build step, no black box."], n: "06" },
]

const stageEls = ref<HTMLElement[]>([])
const softEls = ref<HTMLElement[]>([])
const litSet = ref<Set<number>>(new Set())
const activeIdx = ref(-1)
let ticking = false
let reduced = false

function updateEssay() {
  ticking = false
  const vh = window.innerHeight
  const focus = vh * 0.5
  // At max scroll the lower statements sit below the 0.5vh focus line but above
  // the fold; light anything whose top crossed 85% of the viewport (a ratchet:
  // once lit, stays lit — the essay reads as read), and pick the active one as
  // the statement whose band is nearest the focus line.
  const lightLine = vh * 0.85
  const lit = new Set<number>()
  let active = -1
  let bestDist = Infinity
  stageEls.value.forEach((el, i) => {
    const r = el.getBoundingClientRect()
    if (r.top < lightLine) lit.add(i)
    const dist = r.top > focus ? r.top - focus : r.bottom < focus ? focus - r.bottom : 0
    if (dist < bestDist) {
      bestDist = dist
      active = i
    }
  })
  litSet.value = lit
  activeIdx.value = active
}

function requestUpdate() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(updateAll)
  }
}

// Ghost-style soft focus: footer content rests blurred and resolves into focus
// as it scrolls into view. Measured from the reference: blur decays like
// 12px * (1-p)^6, sharpening slowly at first then snapping clean. The footer
// is the page's last block, so progress rides its scroll RUNWAY: the distance
// from "footer top enters the viewport" to max scroll. That guarantees it
// resolves to exactly 0 by the end of the page — a viewport-relative zone
// can't, because a short footer's resting top never rises past ~75% vh.
// --soft is 1 = fully blurred, 0 = sharp.
function updateSoft() {
  const footer = softEls.value[0]?.closest("footer")
  if (!footer) return
  const max = document.documentElement.scrollHeight - window.innerHeight
  const footerTop = footer.getBoundingClientRect().top + window.scrollY
  const start = Math.max(0, footerTop - window.innerHeight) // runway start
  const p = max > start ? Math.min(1, Math.max(0, (window.scrollY - start) / (max - start))) : 1
  const soft = (1 - p).toFixed(4)
  for (const el of softEls.value) el.style.setProperty("--soft", soft)
}

function updateAll() {
  updateEssay()
  updateSoft()
}

onMounted(() => {
  const img = new Image()
  img.src = assetPath("/faces.webp")
  img.onload = () => {
    FACES.forEach((f, i) => {
      const face = faceEls.value[i]
      const emote = emoteEls.value[i]
      if (face) blit(face, img, f.x, FACE_Y, f.w, FACE_H)
      if (emote) blit(emote, img, f.emote.x, f.emote.y, f.emote.w, f.emote.h)
    })
  }

  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (reduced) {
    litSet.value = new Set(STAGES.map((_, i) => i))
    // Soft focus is decorative: under reduced motion, everything is sharp.
    for (const el of softEls.value) el.style.setProperty("--soft", "0")
    return
  }
  updateAll()
  window.addEventListener("scroll", requestUpdate, { passive: true })
  window.addEventListener("resize", requestUpdate, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", requestUpdate)
  window.removeEventListener("resize", requestUpdate)
})

function setActive(i: number) {
  if (reduced) return
  activeIdx.value = i
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background font-mono text-foreground antialiased">
    <!-- Header -->
    <header class="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6 text-xs">
      <span class="tracking-tight">dither-ui</span>
      <nav class="flex items-center gap-5 text-muted-foreground">
        <a :href="routePath('/docs')" class="-m-3 p-3 transition-colors hover:text-foreground">docs</a>
        <a
          href="https://github.com/drvova/dither-ui"
          target="_blank"
          rel="noreferrer"
          class="-m-3 p-3 transition-colors hover:text-foreground"
          >github</a
        >
        <a :href="routePath('/studio')" class="-m-3 p-3 transition-colors hover:text-foreground">studio →</a>
      </nav>
    </header>

    <main class="relative isolate flex flex-1 flex-col">
      <!-- Page backdrop: one dithered dark veil behind the whole essay, the way
           the reference floats statements over a fixed cell canvas. -->
      <DitherDarkVeil
        :colors="['#05060a', '#0c1730', '#2f6fd0']"
        :scale="2.6"
        :speed="0.15"
        :intensity="1.5"
        :vignette="0.9"
        class="pointer-events-none fixed inset-0 -z-10"
      />

      <!-- Hero: one statement, one action, one visual. -->
      <section class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pt-24 pb-14 sm:pt-28">
        <h1
          class="reveal max-w-xl text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.15] tracking-tight text-balance"
        >
          A dithered UI toolkit for Vue.
        </h1>
        <p
          class="reveal mt-5 max-w-md text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]"
          style="--reveal-delay: 90ms"
        >
          Charts, buttons, avatars and gradients — rendered
          <em class="text-foreground/80">pixel by pixel</em> on canvas. Built in
          the
          <a :href="routePath('/studio')" class="text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60">studio</a>,
          documented in the
          <a :href="routePath('/docs')" class="text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60">docs</a>.
        </p>
        <div class="reveal mt-10" style="--reveal-delay: 180ms">
          <DitherButton
            color="blue"
            variant="gradient"
            class="px-6 py-3 text-[13px] transition-transform active:scale-[0.96]"
            @click="openStudio"
          >
            Open studio
          </DitherButton>
        </div>
      </section>

      <!-- Six moods, one row — hover a face and her emote answers -->
      <p
        class="reveal pb-6 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70"
        style="--reveal-delay: 260ms"
      >
        expressions
      </p>
      <div
        role="img"
        aria-label="Pixel-art character portraits in six expressions"
        class="reveal flex flex-wrap justify-center gap-7 pb-24"
        style="--reveal-delay: 300ms"
      >
        <div v-for="(f, i) in FACES" :key="i" class="group relative pt-10">
          <!-- CSS size reserves layout (no CLS); blit paints the backing store at
               device resolution so the portrait stays sharp on hi-DPI / 4K -->
          <canvas
            :ref="(el) => { if (el) faceEls[i] = el as HTMLCanvasElement }"
            :style="{ width: `${f.w}px`, height: `${FACE_H}px` }"
          />
          <canvas
            :ref="(el) => { if (el) emoteEls[i] = el as HTMLCanvasElement }"
            class="emote absolute top-0 left-1/2"
            :style="{ width: `${f.emote.w}px`, height: `${f.emote.h}px` }"
          />
        </div>
      </div>

      <!-- The essay: six numbered statements that light up as you scroll.
           The index rail (01–06) scales + springs on the in-focus one. -->
      <section aria-label="What the kit does" class="mx-auto w-full max-w-4xl px-6 pb-16 sm:pb-24">
        <ol class="essay mx-auto flex list-none flex-col p-0" style="--m-essay: 42rem">
          <li
            v-for="(s, i) in STAGES"
            :key="s.n"
            :ref="(el) => { if (el) stageEls[i] = el as HTMLElement }"
            class="statement"
            :class="litSet.has(i) ? 'is-lit' : ''"
            :data-n="s.n"
            :data-active="activeIdx === i ? 'true' : 'false'"
            @mouseenter="setActive(i)"
            @focusin="setActive(i)"
          >
            <span v-for="line in s.lines" :key="line" class="block">{{ line }}</span>
          </li>
        </ol>
      </section>

      <!-- Closing band: full-bleed elevated surface, one display line, one CTA. -->
      <section class="bleed">
        <div class="mx-auto flex w-full flex-col items-center gap-9 px-6 py-24 text-center">
          <h2 class="display max-w-xl text-[clamp(1.875rem,4.2vw,3.375rem)] font-normal leading-[1.08] tracking-[-0.032em]">
            Pixel by pixel,<br />on canvas.
          </h2>
          <div class="flex flex-wrap justify-center gap-3">
            <DitherButton
              color="blue"
              variant="gradient"
              class="px-6 py-3 text-[13px] transition-transform active:scale-[0.96]"
              @click="openStudio"
            >
              Open studio
            </DitherButton>
            <DitherButton
              color="grey"
              variant="dotted"
              class="px-6 py-3 text-[13px] transition-transform active:scale-[0.96]"
            >
              <a :href="routePath('/docs')">Read the docs</a>
            </DitherButton>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer: soft-focus like the ghost reference — blurred at rest, the
         whole footer resolves into focus as it scrolls into view. -->
    <footer class="relative isolate overflow-hidden border-t border-border/60">
      <DitherGradient
        from="blue"
        to="transparent"
        direction="up"
        :opacity="0.2"
        :cell="4"
        render-mode="static"
        class="-z-10"
      />
      <div
        :ref="(el) => { if (el) softEls[0] = el as HTMLElement }"
        class="soft mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6 text-[11px] text-muted-foreground"
      >
        <span>© {{ new Date().getFullYear() }} dither-ui.com</span>
        <div class="flex items-center gap-4">
          <a
            href="https://github.com/drvova/dither-ui"
            target="_blank"
            rel="noreferrer"
            class="transition-colors hover:text-foreground"
            >GitHub</a
          >
          <span class="tabular-nums">v{{ version }} · MIT</span>
        </div>
      </div>
      <div
        :ref="(el) => { if (el) softEls[1] = el as HTMLElement }"
        aria-hidden="true"
        class="soft mx-auto w-[min(90vw,56rem)] px-6"
        style="margin-bottom: -5%"
      >
        <EngravedWordmark />
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* One orchestrated load: soft rise, staggered per chunk, once. */
.reveal {
  animation: reveal 700ms cubic-bezier(0.2, 0, 0, 1) both;
  animation-delay: var(--reveal-delay, 0ms);
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* The essay. Values measured from the reference: line clamp 16→46px,
   -0.03em tracking, 1.05 leading, 0.52s lit transition with the
   cubic-bezier(0.22, 1, 0.36, 1) settle; index 10px, 0.1em tracking,
   1.55× spring scale on the active one. */
.essay {
  --rail: clamp(2rem, 3.6vw, 3.5rem);
  --line: clamp(1rem, 5.3vw, 2.875rem);
  gap: clamp(2.375rem, 4.3vw, 3.875rem);
  padding-left: var(--rail);
  max-width: calc(42rem + var(--rail));
}

.statement {
  position: relative;
  font-size: var(--line);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--color-muted-foreground);
  text-wrap: pretty;
  transition: color 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.statement.is-lit {
  color: var(--color-foreground);
}

.statement::after {
  content: attr(data-n);
  position: absolute;
  top: 0.34em;
  left: calc(-1 * var(--rail));
  width: var(--rail);
  padding-right: 0.8125rem;
  text-align: right;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  line-height: 1;
  color: color-mix(in oklab, var(--color-muted-foreground) 40%, transparent);
  transform-origin: 100% center;
  transition:
    color 200ms ease,
    transform 620ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.statement.is-lit::after {
  color: color-mix(in oklab, var(--color-muted-foreground) 80%, transparent);
}

.statement[data-active="true"]::after {
  color: var(--swatch-orange);
  transform: scale(1.55);
}

/* Closing band: an elevated, slightly lighter surface than the page. */
.bleed {
  background: color-mix(in oklab, var(--color-foreground) 4%, transparent);
  border-block: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
  }
  .emote {
    transition: none;
  }
  .statement {
    transition: none;
  }
  .statement::after {
    transition: none;
  }
  .statement[data-active="true"]::after {
    transform: none;
  }
}

/* Ghost-style focus pull (measured from ghost.ai: .soft-focus whispers at
   blur(1px), resolves to blur(0), 300ms cubic-bezier(0.4, 0, 0.2, 1)):
   entering the essay softens the out-of-focus statements while the hovered
   one stays sharp — a camera focus pull across the text. */
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .statement {
    transition:
      filter 300ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .essay:hover .statement:not(:hover) {
    filter: blur(1px);
    opacity: 0.72;
  }
}

/* Ghost-style soft focus: --soft (1 = below the fold, 0 = in focus) drives a
   blur through filter only — the GPU-composited property, no will-change
   needed at two elements. The sixth power makes the sharpening accelerate
   near the end, matching the reference's measured curve. */
.soft {
  filter: blur(calc(var(--soft, 1) * var(--soft, 1) * var(--soft, 1) * var(--soft, 1) * var(--soft, 1) * var(--soft, 1) * 12px));
}

@media (prefers-reduced-motion: reduce) {
  .soft {
    filter: none;
  }
}

/* Reaction emote: rises out of her head on hover, same easing as the page. */
.emote {
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.8);
  transition:
    opacity 180ms cubic-bezier(0.2, 0, 0, 1),
    transform 180ms cubic-bezier(0.2, 0, 0, 1);
}

.group:hover .emote {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}
</style>
