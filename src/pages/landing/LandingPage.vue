<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue"
import {
  DitherButton,
  DitherGradient,
} from "@dither-kit"
import { assetPath, routePath } from "@/shared/lib"
import { version } from "../../../package.json"
import EngravedWordmark from "./EngravedWordmark.vue"
import InstallBlock from "./InstallBlock.vue"
import PixelPlate from "./PixelPlate.vue"
import SkyOrganism from "./SkyOrganism.vue"
import { createDitherField, type DitherField } from "./dither-field"
import { dawnPlate, SKY } from "./plates"
import Showcase from "./Showcase.vue"

// DitherButton renders a <button>, so navigation rides its click — never an
// <a> nested inside it (two tab stops, dead padding, invalid content model).
const openStudio = () => location.assign(routePath("/studio"))
const openDocs = () => location.assign(routePath("/docs"))

// The hero's figure: built once at setup — deterministic markup, no runtime.
const DAWN = dawnPlate()

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

// The reveal choreography arms itself with JS: until this component's script
// runs, every .reveal block renders visible (no-JS visitors and the
// prerendered bytes get the complete page; the old html.js gate — a :global
// scoped rule — white-screened every browser and is banned).
const armed = ref(false)

const stageEls = ref<HTMLElement[]>([])
const softEls = ref<HTMLElement[]>([])
const pageEl = ref<HTMLElement | null>(null)
// The hero copy's box: handed to the living sky as its exclusion zone.
const copyEl = ref<HTMLElement | null>(null)
// The closing band's backdrop: a sparse seeded dot sea on the vanilla
// engine (12fps, 4px cells, navy-to-blue only, so the display line keeps
// its ink). Hovering the band thickens the dither — density is the hover
// state — and the cursor drags a soft body through it.
const bandCanvas = ref<HTMLCanvasElement | null>(null)
let bandField: DitherField | null = null
const litSet = ref<Set<number>>(new Set())
const activeIdx = ref(-1)
let ticking = false
let reduced = false
let revealIO: IntersectionObserver | null = null

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

// Arm before the first render so the very first painted frame already
// carries data-armed — no visible flash of unlatched content.
onBeforeMount(() => {
  armed.value = true
})

onMounted(() => {
  // The landing is always-dark art (the film stage, plates and organism are
  // ink). A light theme toggled on docs/studio persists on <html> and this is
  // one SPA — without re-asserting dark here, token text flips to near-black
  // over the hardcoded ink (measured 1.02:1 on the h1). Storage keeps the
  // user's choice; docs/studio re-read it on their own mount.
  document.documentElement.classList.add("dark")

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

  if (bandCanvas.value) {
    bandField = createDitherField(bandCanvas.value, {
      ramp: SKY.slice(0, 4),
      cell: 4,
      fps: 12,
      seed: 21,
      density: 0.42,
      hoverDensity: 0.64,
      pointer: 0.4,
      pointerRadius: 120,
      sizzle: 0.3,
      bodies: (w, h, rand) =>
        [0.18, 0.5, 0.82].map((fx, i) => ({
          x: fx * w,
          y: (0.3 + rand() * 0.4) * h,
          r: Math.max(h, w * 0.22) * 0.9,
          fx: 0.03 + i * 0.011,
          fy: 0.025 + i * 0.009,
          px: rand() * 6.28,
          py: rand() * 6.28,
          w: 0.62,
        })),
      // Fade to the band's hairline edges so the sea never meets a border.
      mask: (_x, y, _w, h) => Math.min(1, Math.min(y, h - y) / (h * 0.3)),
    })
  }

  // Scroll choreography (reference: rise / lp-in, latched like the docs
  // DemoCard): every .reveal block animates the first time it crosses into
  // view and then stays put. Without IO (jsdom) or under reduced motion
  // everything is seen immediately. The latch is a data attribute, never a
  // class: Vue rewrites className whenever a component re-renders its own
  // :class (InstallBlock's root does), which silently wiped a .seen class
  // and left the strip invisible after a slow scroll.
  const targets = Array.from(pageEl.value?.querySelectorAll<HTMLElement>(".reveal") ?? [])
  if (reduced || typeof IntersectionObserver === "undefined") {
    for (const el of targets) el.setAttribute("data-seen", "")
  } else {
    revealIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute("data-seen", "")
          revealIO?.unobserve(entry.target)
        }
      },
      { threshold: 0.12 },
    )
    for (const el of targets) revealIO.observe(el)
  }

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
  bandField?.destroy()
  bandField = null
  revealIO?.disconnect()
  revealIO = null
  window.removeEventListener("scroll", requestUpdate)
  window.removeEventListener("resize", requestUpdate)
})

function setActive(i: number) {
  if (reduced) return
  activeIdx.value = i
}
</script>

<template>
  <div
    ref="pageEl"
    :data-armed="armed ? 'true' : undefined"
    class="landing flex min-h-screen flex-col bg-background font-mono text-foreground antialiased"
  >
    <!-- Skip link: first focusable element, jumps to the single main landmark. -->
    <a
      href="#main"
      class="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-border focus:bg-background focus:px-4 focus:py-2 focus:text-xs"
    >
      Skip to content
    </a>

    <!-- Header: relative + z-10 — main.relative isolates the fixed veil, and
         a positioned sibling always paints above a static one; without this
         the veil covered the header entirely (it painted zero pixels). -->
    <header
      class="relative z-10 mx-auto flex h-16 w-full max-w-[var(--shell)] items-center justify-between px-6 text-xs"
    >
      <div class="flex w-full items-center justify-between">
        <span class="flex items-center gap-2.5 tracking-tight">
          <!-- Brand mark: a 7x7 dithered diamond with the ember core — crisp
               edges so it stays a pixel shape at any zoom. -->
          <svg
            viewBox="0 0 7 7"
            width="13"
            height="13"
            aria-hidden="true"
            focusable="false"
            shape-rendering="crispEdges"
          >
            <g fill="currentColor">
              <rect x="3" y="0" width="1" height="1" />
              <rect x="2" y="1" width="3" height="1" />
              <rect x="1" y="2" width="5" height="1" />
              <rect x="0" y="3" width="7" height="1" />
              <rect x="1" y="4" width="5" height="1" />
              <rect x="2" y="5" width="3" height="1" />
              <rect x="3" y="6" width="1" height="1" />
            </g>
            <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
          </svg>
          dither-ui
        </span>
        <nav class="flex items-center gap-1 text-muted-foreground" aria-label="Site">
          <a :href="routePath('/docs')" class="nav-a">docs</a>
          <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="nav-a">github</a>
          <a :href="routePath('/studio')" class="nav-a nav-pill ml-2">Open studio</a>
        </nav>
      </div>
    </header>

    <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
      <!-- Hero: a hairline STAGE — the statement and its one action hold the
           dark sky; the dawn plate owns the floor. The sky is alive: the
           SkyOrganism breathes the page's own dither rule over the horizon
           (bounded to the stage, 24fps, offscreen-paused), so the artwork
           demos the engine the way the reference's field does. Art yields to
           text: the horizon is lowest under the copy and crests right. -->
      <section aria-labelledby="hero-h" class="mx-auto w-full max-w-[var(--shell)] px-6 pt-2 pb-20">
        <div class="stage">
          <SkyOrganism :avoid="copyEl" />
          <div class="grain" aria-hidden="true"></div>
          <div ref="copyEl" class="stage-copy">
            <p class="reveal eyebrow" style="--reveal-delay: 0ms">
              <span class="led" aria-hidden="true"></span>
              Open source · Vue 3 · canvas
            </p>
            <h1
              id="hero-h"
              class="reveal mt-6 max-w-3xl text-[clamp(2.5rem,6.4vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.035em] text-balance"
              style="--reveal-delay: 60ms"
            >
              A dithered UI toolkit for Vue<span class="ember">.</span>
            </h1>
            <p
              class="reveal mt-7 max-w-[34rem] text-[clamp(1rem,1.6vw,1.2rem)] leading-[1.65] text-muted-foreground [text-wrap:pretty]"
              style="--reveal-delay: 140ms"
            >
              Charts, buttons, avatars and gradients — rendered
              <em class="text-foreground/80">pixel by pixel</em> on canvas, from one
              seeded palette. Copy the folder, alias it, ship.
            </p>
            <div class="reveal cta mt-10" style="--reveal-delay: 220ms">
              <DitherButton
                color="blue"
                variant="gradient"
                class="px-6 py-3 text-[13px] transition-transform active:scale-[0.96]"
                @click="openStudio"
              >
                Open studio
              </DitherButton>
              <a :href="routePath('/docs')" class="cta-quiet">Read the docs<span aria-hidden="true">→</span></a>
            </div>
          </div>
          <PixelPlate :plate="DAWN" fit="xMidYMax slice" class="stage-art" />
        </div>
      </section>

      <!-- Install strip: step tabs + command + copy (docs install story). -->
      <InstallBlock />

      <!-- Six moods, one row — hover a face and her emote answers -->
      <p
        class="reveal micro pt-[var(--section)] pb-6 text-center text-muted-foreground"
        style="--reveal-delay: 260ms"
      >
        expressions
      </p>
      <div
        role="img"
        aria-label="Pixel-art character portraits in six expressions — hover a portrait and her reaction emote answers"
        class="reveal flex flex-wrap justify-center gap-7"
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

      <!-- Three chapters — the kit showing itself, live. -->
      <Showcase />

      <!-- The essay: six numbered statements that light up as you scroll.
           The index rail (01–06) turns ember and takes a rule on the in-focus one. -->
      <section aria-label="What the kit does" class="essay-wrap mx-auto w-full max-w-4xl px-6 pb-[var(--section)]">
        <ol class="essay mx-auto flex list-none flex-col p-0">
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
        <canvas ref="bandCanvas" aria-hidden="true" class="band-field"></canvas>
        <div class="relative mx-auto flex w-full flex-col items-center gap-9 px-6 py-28 text-center">
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
              @click="openDocs"
            >
              Read the docs
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
        class="soft mx-auto flex h-16 w-full max-w-[var(--shell)] items-center justify-between px-6 text-[11px] text-muted-foreground"
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
        class="soft mx-auto w-[min(90vw,56rem)] px-6 pb-10"
      >
        <EngravedWordmark />
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Scroll choreography: blocks sit hidden until the IO sets [data-seen] the
   first time they cross into view (reference: rise / lp-in, DemoCard latch).
   The hide requires the component's own data-armed — set in onBeforeMount —
   so no-JS visitors and the prerendered bytes render the complete page. */
.landing[data-armed] .reveal:not([data-seen]) {
  opacity: 0;
}

.reveal[data-seen] {
  animation: reveal 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
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

@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
    opacity: 1;
  }
}

/* One shell width for header, stage, chapters and footer, and ONE vertical
   rhythm between sections — children read both through inheritance, so
   every gap on the page is the same breath (never a sum of two paddings). */
.landing {
  --shell: 72rem;
  --section: clamp(5rem, 9vw, 8rem);
}

/* (.nav-a / .nav-pill / .eyebrow / .led are the site voice in app/styles.css.) */

/* One primary action, one quiet way out: the docs link sits beside the
   button as text with an arrow that nudges on hover. */
.cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 22px;
}

.cta-quiet {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--color-muted-foreground);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-quiet span {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.cta-quiet:hover {
  color: var(--color-foreground);
}

.cta-quiet:hover span {
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .cta-quiet span {
    transition: none;
  }
}

/* The stage: a black film with a hairline edge (sharp corners — the pixel
   identity). The copy rides the top; the dawn plate is pinned to the floor
   and sliced from the bottom-centre, so cells stay square at every width and
   narrow screens crop the horizon's ends, never its crest. */
.stage {
  --art: clamp(13rem, 29vw, 25rem);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: clamp(34rem, calc(100svh - 6.5rem), 54rem);
  background: #05060a;
  border: 1px solid color-mix(in oklab, var(--color-border) 90%, transparent);
}

.stage-copy {
  position: relative;
  z-index: 1;
  padding: clamp(1.75rem, 5vw, 4rem);
  padding-bottom: calc(var(--art) * 0.62);
}

.stage-art {
  position: absolute;
  inset: auto 0 0;
  width: 100%;
  height: var(--art);
}

/* Film grain: the stage is a black film, so it carries film grain — a
   3.5%-opacity turbulence tile jittered on a steps() clock (never a smooth
   slide; grain jitters, it doesn't drift). Above the copy like the
   reference's page-level grain: at 3.5% it textures without touching the
   contrast math (17:1 text loses ~4% luminance, still >16:1). */
.grain {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation:
    grain-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both,
    grain-jitter 1.1s steps(4) 1.2s infinite;
}

@keyframes grain-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.035;
  }
}

@keyframes grain-jitter {
  0% {
    background-position: 0 0;
  }
  25% {
    background-position: -37px 21px;
  }
  50% {
    background-position: 19px -43px;
  }
  75% {
    background-position: -23px -17px;
  }
  100% {
    background-position: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .grain {
    animation: none;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .grain {
    opacity: 0;
  }
}

/* The headline's full stop takes the ember — the sun's own color answering
   the dawn plate's crest (reference: statement ink + signal punctuation).
   It ignites last in the hero's entrance: a one-shot scale pulse as the
   statement finishes landing, then it rests as plain ink. */
.ember {
  color: var(--swatch-orange);
}

@media (prefers-reduced-motion: no-preference) {
  .ember {
    animation: ember-ignite 700ms cubic-bezier(0.16, 1, 0.3, 1) 720ms both;
  }
  @keyframes ember-ignite {
    0% {
      scale: 0.4;
      opacity: 0;
    }
    60% {
      scale: 1.3;
      opacity: 1;
    }
    100% {
      scale: 1;
      opacity: 1;
    }
  }
}


/* The essay. Values measured from the reference: line clamp 16→46px,
   -0.03em tracking, 1.05 leading, 0.52s lit transition with the
   cubic-bezier(0.22, 1, 0.36, 1) settle; index 10px, 0.1em tracking. The
   in-focus index turns ember and takes a 2px ember rule — a quiet mark,
   where the old 1.55x spring read playful against the calmer hero. */
.essay-wrap {
  container-type: inline-size;
}

/* The statements are authored mono lines, the longest 30 characters. The
   type is sized off the column (cqi), not the viewport, so 31ch always fits
   beside the rail — an authored line can never wrap into an orphan. */
.essay {
  --rail: clamp(2rem, 3.6vw, 3.5rem);
  font-size: clamp(1rem, calc((100cqi - var(--rail)) / 19), 2.875rem);
  gap: clamp(2.375rem, 4.3vw, 3.875rem);
  padding-left: var(--rail);
  max-width: calc(31ch + var(--rail));
}

.statement {
  position: relative;
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
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
  text-decoration-color: transparent;
  transition:
    color 200ms ease,
    text-decoration-color 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.statement.is-lit::after {
  color: color-mix(in oklab, var(--color-muted-foreground) 80%, transparent);
}

.statement[data-active="true"]::after {
  color: var(--swatch-orange);
  text-decoration-color: var(--swatch-orange);
}

/* Closing band: an elevated, slightly lighter surface than the page, with
   the dot sea breathing under the display line. */
.bleed {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: color-mix(in oklab, var(--color-foreground) 4%, transparent);
  border-block: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
}

.band-field {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0.85;
}

@media (prefers-reduced-transparency: reduce) {
  .band-field {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .emote {
    transition: none;
  }
  .statement {
    transition: none;
  }
  .statement::after {
    transition: none;
  }
}

/* Ghost-style focus pull (measured from ghost.ai: .soft-focus whispers at
   blur(1px), resolves to blur(0), 300ms cubic-bezier(0.4, 0, 0.2, 1)):
   entering the essay softens the out-of-focus statements while the hovered
   one stays sharp — a camera focus pull across the text. Hover-gated so a
   touch tap can't leave the row stuck blurred. */
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

/* Reaction emote: rises out of her head on hover, same easing as the page.
   Hover-gated (touch has no hover to get stuck). */
.emote {
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.8);
  transition:
    opacity 180ms cubic-bezier(0.2, 0, 0, 1),
    transform 180ms cubic-bezier(0.2, 0, 0, 1);
}

@media (hover: hover) {
  .group:hover .emote {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .emote {
    transition: none;
  }
}
</style>
