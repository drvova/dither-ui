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

    <!-- Header: the docs header's twin (brand, micro-caps links, the
         "Open studio" pill) so landing → docs → studio is one site.
         relative + z-10 — main.relative isolates the page art, and a
         positioned sibling always paints above a static one; without this
         the art covered the header entirely (it painted zero pixels). -->
    <header class="site-head relative z-10">
      <div class="mx-auto flex h-14 w-full max-w-[var(--shell)] items-center justify-between px-6 text-xs">
        <a :href="routePath('/')" class="flex h-8 items-center gap-2.5 whitespace-nowrap tracking-tight">
          <!-- The brand mark: the 7x7 dithered diamond, ember core. -->
          <svg viewBox="0 0 7 7" width="13" height="13" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
            <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="currentColor" />
            <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
          </svg>
          dither-ui
        </a>
        <nav class="flex items-center text-muted-foreground" aria-label="Site">
          <a href="#directory" class="nav-a hidden sm:inline-flex">Components</a>
          <a :href="routePath('/docs')" class="nav-a">Docs</a>
          <a href="#agents" class="nav-a hidden sm:inline-flex">Agents</a>
          <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="nav-a hidden md:inline-flex"
            >GitHub<span aria-hidden="true">↗</span></a
          >
          <a :href="routePath('/studio')" class="nav-a nav-pill ml-2">Open studio</a>
        </nav>
      </div>
    </header>

    <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
      <!-- The portal on the shell: the campaign stage (the films, the
           statement), the install bar and the panel columns — six moods in
           the portraits' well: hover a face, her pixels scatter under the
           cursor and settle, and her emote answers — then the directory,
           the principles and the agents strip. -->
      <div class="box mx-auto w-full max-w-[var(--shell)] px-6">
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
            <h2 id="principles-h" class="eyebrow">Principles</h2>
            <a :href="routePath('/docs/getting-started')" class="more-link">quick start →</a>
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
                  <span class="principle-t">{{ p.text }}</span>
                </a>
              </li>
            </ol>
          </div>
        </section>

        <!-- The agents strip: the harnesses the bridge knows, as hairline
             chips with their ember LED under an eyebrow, over the dot sea —
             every one drives the Studio as the user's own signed-in process. -->
        <section id="agents" class="panel agents" aria-labelledby="harness-h">
          <canvas ref="bandCanvas" aria-hidden="true" class="band-field"></canvas>
          <div class="harness">
            <h2 id="harness-h" class="eyebrow">Drives with your agent</h2>
            <ul class="harness-list">
              <li v-for="h in HARNESSES" :key="h" class="harness-chip"><i aria-hidden="true"></i>{{ h }}</li>
            </ul>
            <a :href="assetPath('/agent/SKILL.md')" class="lead harness-a">Agent skill</a>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer: the wordmark and framework badges left, bar-separated
         links right, the copyright line under — then the engraved mark. -->
    <footer class="foot-wrap">
      <div class="mx-auto w-full max-w-[var(--shell)] px-6 pt-8 pb-6">
        <div class="foot-row">
          <div class="foot-left">
            <PixelWord text="DITHER-UI" :cell="2" :seam="1 / 2" class="text-foreground" />
            <span class="micro foot-badge">Vue 3</span>
            <span class="micro foot-badge">Svelte 5</span>
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
/* One shell for the header, the portal and the footer — the docs' own
   width, so the brand never jumps between pages — and one rhythm between
   the portal's rows. The page is the theme's own background. */
.landing {
  --shell: 72rem;
  --rhythm: 40px;
}

.box {
  display: flex;
  flex-direction: column;
  gap: var(--rhythm);
  padding-top: 8px;
  padding-bottom: var(--rhythm);
}

/* The header: the docs chrome's scroll-edge hairline, no hard border. */
.site-head::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: 100%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    color-mix(in oklab, var(--border) 80%, transparent) 20%,
    color-mix(in oklab, var(--border) 80%, transparent) 80%,
    transparent
  );
}

/* The footer: the wordmark and framework badges left, bar-separated links
   right, the copyright line under it. */
.foot-wrap {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  box-shadow: inset 0 1px 0 color-mix(in oklab, var(--border) 70%, transparent);
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
  padding: 3px 6px;
  border-radius: 4px;
  color: var(--ink-3);
  box-shadow: inset 0 0 0 1px var(--line);
}

.foot-links {
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--ink-3);
}

.foot-links a {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  box-shadow: inset -1px 0 0 var(--line);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.foot-links a:last-child {
  padding-right: 0;
  box-shadow: none;
}

.foot-links a:hover,
.foot-copy a:hover {
  color: var(--ink);
}

.foot-copy {
  margin: 10px 0 0;
  text-align: right;
  font-size: 11px;
  color: var(--ink-3);
}

@media (max-width: 759px) {
  .foot-copy {
    text-align: left;
  }
}

/* The principles: the figure's well beside a numbered list; the pointed
   statement takes ink and a hairline rule. */
.principles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.principles-body {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  padding: 20px;
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
  gap: 16px;
  padding: 11px 12px;
  box-shadow: inset 0 -1px 0 color-mix(in oklab, var(--line) 70%, transparent);
  transition: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.principle-n {
  flex: none;
  font-size: 11px;
  color: var(--ink-3);
}

.principle-t {
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--ink-3);
  text-wrap: pretty;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.principle[data-active] {
  box-shadow:
    inset 2px 0 0 var(--ink),
    inset 0 -1px 0 color-mix(in oklab, var(--line) 70%, transparent);
}

.principle[data-active] .principle-n,
.principle[data-active] .principle-t {
  color: var(--ink);
}

/* The agents strip: a panel with the dot sea breathing under one row — an
   eyebrow, the harness chips, one link. */
.agents {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.harness {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 24px;
  min-height: 96px;
  padding: 22px 24px;
}

.harness-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The Studio picker's chip: a square ember LED and the harness name on a
   hairline pill. */
.harness-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 11.5px;
  color: var(--ink-2);
  background: color-mix(in oklab, var(--background) 70%, transparent);
  box-shadow: inset 0 0 0 1px var(--line);
}

.harness-chip i {
  width: 5px;
  height: 5px;
  background: var(--swatch-orange);
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
