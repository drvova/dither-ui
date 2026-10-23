<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { assetPath, routePath } from "@/shared/lib"
import "./chapters.css"
import { version } from "../../../package.json"
import EngravedWordmark from "./EngravedWordmark.vue"
import EssayFigure from "./EssayFigure.vue"
import Hub from "./Hub.vue"
import PixelWord from "./PixelWord.vue"
import Showcase from "./Showcase.vue"
import { createDitherField, type DitherField } from "./dither-field"
import { createPixelShake, type PixelShake } from "./pixel-shake"
import { seedFor } from "./genome"
import { SKY } from "./plates"

// The harnesses `bridge/dither-bridge.mjs` knows (its HARNESSES), in its order.
const HARNESSES = ["Claude Code", "Codex", "Gemini CLI", "Qwen Code", "oh-my-pi", "Goose", "OpenCode", "Auggie"]

// The footer's links, in one row.
const FOOTER = [
  { label: "Docs", href: routePath("/docs") },
  { label: "Studio", href: routePath("/studio") },
  { label: "Quick start", href: routePath("/docs/getting-started") },
  { label: "Styling", href: routePath("/docs/styling") },
  { label: "Accessibility", href: routePath("/docs/accessibility") },
  { label: "Agent skill", href: assetPath("/agent/SKILL.md") },
  { label: "llms.txt", href: assetPath("/llms.txt") },
  { label: "GitHub", href: "https://github.com/drvova/dither-ui", external: true },
]

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
// Each portrait is a pixel-shake surface: hovering her scatters the pixels
// under the cursor and they spring home when it leaves (vanilla module,
// no loop at rest). Emotes stay plain blits.
let shakers: PixelShake[] = []

function blit(c: HTMLCanvasElement, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  c.getContext("2d")?.drawImage(img, x, y, w, h, 0, 0, c.width, c.height)
}

// The principles: six statements, each a link into the docs that covers
// it. Pointing at one (hover or focus) re-dithers the figure into its scene.
const PRINCIPLES = [
  { text: "Every pixel is placed on purpose.", href: routePath("/docs") },
  { text: "Charts, buttons, avatars and gradients — rendered pixel by pixel on canvas.", href: routePath("/docs/area") },
  { text: "One palette: seven seeds; fill, line and sparkle hues resolve from the same source.", href: routePath("/docs/palette") },
  { text: "Every fill is deterministic — a seed replays it forever, and explicit props always win.", href: routePath("/docs/seeds") },
  { text: "Layout, motion and text families compose from the same dither engine.", href: routePath("/docs/composition") },
  { text: "Copy the folder, alias it — no build step, no black box.", href: routePath("/docs/getting-started") },
]
const principle = ref(0)

// The agents strip's backdrop: a sparse seeded dot sea on the vanilla
// engine (12fps, 4px cells, navy-to-blue only, so the chips keep their
// ink). Hovering the strip thickens the dither — density is the hover
// state — and the cursor drags a soft body through it.
const bandCanvas = ref<HTMLCanvasElement | null>(null)
let bandField: DitherField | null = null

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
      if (face) shakers.push(createPixelShake(face, img, { x: f.x, y: FACE_Y, w: f.w, h: FACE_H }, { radius: 18, amplitude: 6 }))
      if (emote) blit(emote, img, f.emote.x, f.emote.y, f.emote.w, f.emote.h)
    })
  }

  if (bandCanvas.value) {
    bandField = createDitherField(bandCanvas.value, {
      ramp: SKY.slice(0, 4),
      cell: 4,
      fps: 12,
      seed: seedFor("band"),
      density: 0.42,
      hoverDensity: 0.64,
      pointer: 0.4,
      pointerRadius: 120,
      sizzle: 0.3,
      bodies: (w, h, rand) =>
        [0.18, 0.5, 0.82].map((fx, i) => ({
          x: fx * w,
          y: (0.3 + rand() * 0.4) * h,
          // Keyed to the SHORT side so a tall phone band stays a sparse sea
          // (a radius keyed to height flooded it).
          r: Math.min(h * 0.9, w * 0.3),
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
})

onBeforeUnmount(() => {
  for (const sh of shakers) sh.destroy()
  shakers = []
  bandField?.destroy()
  bandField = null
})
</script>

<template>
  <div class="landing flex min-h-screen flex-col bg-background text-foreground antialiased">
    <!-- Skip link: first focusable element, jumps to the single main landmark. -->
    <a
      href="#main"
      class="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-border focus:bg-background focus:px-4 focus:py-2 focus:text-xs"
    >
      Skip to content
    </a>

    <!-- Header: relative + z-10 — main.relative isolates the page art, and
         a positioned sibling always paints above a static one; without this
         the art covered the header entirely (it painted zero pixels). The
         2009 portal's bar: the chrome mark left; right, a tiny grey utility
         row over the condensed-caps nav. -->
    <header class="site-head relative z-10">
      <div class="head-row mx-auto w-full max-w-[var(--shell)] px-6">
        <a :href="routePath('/')" class="brand" aria-label="dither-ui home">
          <!-- The 7x7 dithered diamond in chrome, its ember core — crisp
               edges, so it stays a pixel shape at any zoom. -->
          <svg viewBox="0 0 7 7" width="30" height="30" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
            <defs>
              <linearGradient id="brand-chrome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#f6f6f6" />
                <stop offset="0.48" stop-color="#a3a3a3" />
                <stop offset="0.52" stop-color="#5c5c5c" />
                <stop offset="1" stop-color="#dcdcdc" />
              </linearGradient>
            </defs>
            <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="url(#brand-chrome)" />
            <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
          </svg>
          <span class="display brand-name">dither-ui</span>
        </a>
        <div class="head-right">
          <nav class="util" aria-label="Utility">
            <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer">GitHub ↗</a>
            <a :href="assetPath('/agent/SKILL.md')">Agent skill</a>
            <a :href="assetPath('/llms.txt')">llms.txt</a>
            <span class="tabular-nums">v{{ version }} · MIT</span>
            <a :href="routePath('/docs')" class="util-search">Search the docs…</a>
          </nav>
          <nav class="mainnav" aria-label="Site">
            <a href="#directory" class="display">Components</a>
            <a :href="routePath('/docs')" class="display">Docs</a>
            <a :href="routePath('/studio')" class="display">Studio</a>
            <a href="#agents" class="display">Agents</a>
          </nav>
        </div>
      </div>
    </header>

    <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
      <!-- The box: the 2009 portal's one charcoal container on the black
           page. The campaign stage runs flush across its top (the films,
           the statement), then the install bar and the panel columns — six
           moods in the portraits' well: hover a face, her pixels scatter
           under the cursor and settle, and her emote answers — the
           directory, the principles and the agents strip. -->
      <div class="box mx-auto w-full max-w-[var(--shell)]">
        <Showcase>
          <template #faces>
            <div
              role="img"
              aria-label="Pixel-art character portraits in six expressions — hover a portrait: her pixels stir under the cursor and her reaction emote answers"
              class="grid grid-cols-3 gap-x-5"
            >
              <div v-for="(f, i) in FACES" :key="i" class="group relative flex justify-center pt-6">
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
          </template>
        </Showcase>
        <Hub />

        <!-- The principles: the figure in a framed well (a 24x24 lattice
             that re-dithers itself into the pointed statement's scene) beside
             six numbered statements, each a link into its docs. -->
        <section aria-labelledby="principles-h" class="principles">
          <div class="list-head">
            <h2 id="principles-h" class="tag">Principles</h2>
            <a :href="routePath('/docs/getting-started')" class="more-link">Quick start »</a>
          </div>
          <div class="panel principles-body">
            <div class="thumb principles-fig"><EssayFigure :stage="principle" /></div>
            <ol class="principles-list">
              <li v-for="(p, i) in PRINCIPLES" :key="p.href">
                <a
                  :href="p.href"
                  class="principle"
                  :data-active="principle === i ? 'true' : undefined"
                  @mouseenter="principle = i"
                  @focus="principle = i"
                >
                  <span class="principle-n" aria-hidden="true">{{ String(i + 1).padStart(2, "0") }}</span>
                  <span class="display principle-t">{{ p.text }}</span>
                </a>
              </li>
            </ol>
          </div>
        </section>

        <!-- The agents strip: the harnesses the bridge knows, as bevelled
             chips with their ember LED under a tag, over the dot sea — every
             one drives the Studio as the user's own signed-in process. -->
        <section id="agents" class="agents" aria-labelledby="harness-h">
          <canvas ref="bandCanvas" aria-hidden="true" class="band-field"></canvas>
          <div class="harness">
            <h2 id="harness-h" class="tag">Drives with your agent</h2>
            <ul class="harness-list">
              <li v-for="h in HARNESSES" :key="h" class="display harness-chip"><i aria-hidden="true"></i>{{ h }}</li>
            </ul>
            <a :href="assetPath('/agent/SKILL.md')" class="lead harness-a">Agent skill</a>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer: the period's row on the black page — the wordmark and
         framework badges left, bar-separated links right, the copyright line
         under — then the engraved mark. -->
    <footer class="foot-wrap">
      <div class="mx-auto w-full max-w-[var(--shell)] px-6 pt-8 pb-6">
        <div class="foot-row">
          <div class="foot-left">
            <PixelWord text="DITHER-UI" :cell="2" :seam="1 / 2" class="text-foreground" />
            <span class="display foot-badge">Vue 3</span>
            <span class="display foot-badge">Svelte 5</span>
          </div>
          <nav class="foot-links" aria-label="Footer">
            <a
              v-for="l in FOOTER"
              :key="l.label"
              :href="l.href"
              v-bind="l.external ? { target: '_blank', rel: 'noreferrer' } : {}"
              >{{ l.label }}<span v-if="l.external" aria-hidden="true"> ↗</span></a
            >
          </nav>
        </div>
        <p class="foot-copy">
          © {{ new Date().getFullYear() }} dither-ui.com · v{{ version }} · MIT ·
          <a href="https://clayzo.com" target="_blank" rel="noreferrer">Films made with Clayzo<span aria-hidden="true"> ↗</span></a>
        </p>
      </div>
      <div aria-hidden="true" class="mx-auto w-[min(90vw,56rem)] px-6 pb-10">
        <EngravedWordmark />
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* One shell width for the header, the box and the footer; inside the box,
   one gutter and one rhythm between its rows. The page is black, the box
   charcoal, hairlines a step up. */
.landing {
  --shell: 64rem;
  --gutter: 24px;
  --rhythm: 32px;
  --background: #0b0b0b;
  --border: #303030;
}

@media (max-width: 759px) {
  .landing {
    --gutter: 16px;
  }
}

/* The box: the stage flush across its top, its rows in the gutter, a soft
   corner at the floor. */
.box {
  display: flex;
  flex-direction: column;
  background: #151515;
  border-radius: 0 0 6px 6px;
  box-shadow:
    inset 1px 0 0 #232323,
    inset -1px 0 0 #232323,
    inset 0 -1px 0 #232323;
}

/* The bar: near-black under a faint lift, the chrome mark left; right, the
   tiny grey utility row over the condensed-caps nav. */
.site-head {
  background: linear-gradient(180deg, #1c1c1c 0%, #0b0b0b 100%);
  box-shadow: inset 0 -1px 0 #2a2a2a;
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 76px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
}

.brand-name {
  font-size: 1.375rem;
  letter-spacing: 0.08em;
  color: #e6e6e6;
}

.head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.util {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 2px 0;
  font-size: 0.75rem;
  color: #8f8f8f;
}

.util > * {
  padding: 0 9px;
  box-shadow: inset -1px 0 0 #3a3a3a;
}

.util > :nth-last-child(2) {
  box-shadow: none;
}

.util a:hover {
  color: var(--ink);
}

.util-search {
  margin-left: 6px;
  padding: 3px 10px;
  border-radius: 2px;
  color: #8a8a8a;
  background: #262626;
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.6), 0 0 0 1px #3a3a3a;
}

.mainnav {
  display: flex;
  gap: 22px;
}

.mainnav a {
  font-size: 1.0625rem;
  letter-spacing: 0.06em;
  color: #f0f0f0;
  text-shadow: 0 1px 0 #000;
}

.mainnav a:hover {
  color: #fff;
  text-decoration: underline;
  text-decoration-color: var(--mark);
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
}

.util a:focus-visible,
.mainnav a:focus-visible,
.brand:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

@media (max-width: 759px) {
  .util {
    display: none;
  }
  .brand-name {
    display: none;
  }
  .mainnav {
    gap: 14px;
  }
}

/* The footer: the wordmark and framework badges left, bar-separated links
   right, the copyright line under it. */
.foot-wrap {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.foot-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 24px;
}

.foot-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.foot-badge {
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  color: #cfcfcf;
  background: linear-gradient(180deg, #3a3a3a 0%, #262626 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.12), 0 0 0 1px #0c0c0c;
}

.foot-links {
  display: flex;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  color: #a0a0a0;
}

.foot-links a {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  box-shadow: inset -1px 0 0 #3a3a3a;
}

.foot-links a:last-child {
  padding-right: 0;
  box-shadow: none;
}

.foot-links a:hover,
.foot-copy a:hover {
  color: #fff;
}

.foot-copy {
  margin: 10px 0 0;
  text-align: right;
  font-size: 0.75rem;
  color: #8a8a8a;
}

@media (max-width: 759px) {
  .foot-copy {
    text-align: left;
  }
}

/* The principles: the figure's framed well beside a numbered list; the
   pointed statement takes a white index, white ink and a silver rule. */
.principles {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--rhythm) var(--gutter) 0;
}

.principles-body {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  padding: 18px;
}

.principles-fig {
  padding: 14px 14px 10px;
}

@media (max-width: 759px) {
  .principles-body {
    grid-template-columns: minmax(0, 1fr);
  }
  .principles-fig {
    width: min(100%, 15rem);
  }
}

.principles-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.principle {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 10px 12px;
  box-shadow: inset 0 -1px 0 #262626;
  transition:
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.principle-n {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--ink-3);
}

.principle-t {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--ink-2);
  text-wrap: pretty;
}

.principle[data-active] {
  background: linear-gradient(90deg, rgb(255 255 255 / 0.04), transparent 70%);
  box-shadow:
    inset 3px 0 0 var(--mark),
    inset 0 -1px 0 #262626;
}

.principle[data-active] .principle-n {
  color: #fff;
}

.principle[data-active] .principle-t {
  color: #fff;
}

.principle:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: -2px;
}

/* The agents strip: the box's floor — the dot sea breathing under one row:
   a tag, the harness chips, one link. */
.agents {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin-top: var(--rhythm);
  border-radius: 0 0 6px 6px;
  background: #101010;
  box-shadow:
    inset 0 1px 0 #262626,
    inset 1px 0 0 #232323,
    inset -1px 0 0 #232323,
    inset 0 -1px 0 #232323;
}

.harness {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 28px;
  min-height: 96px;
  padding: 22px var(--gutter);
}

.harness .tag {
  margin: 0;
}

.harness-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The Studio picker's chip as a bevelled period tab: a square LED and the
   harness name in display caps. */
.harness-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 11px;
  border-radius: 2px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #d8d8d8;
  background: linear-gradient(180deg, #3a3a3a 0%, #232323 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    0 0 0 1px #0c0c0c;
}

.harness-chip i {
  width: 6px;
  height: 6px;
  background: var(--ember);
}

.harness-a {
  margin-left: auto;
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
