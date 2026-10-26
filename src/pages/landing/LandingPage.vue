<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import {
  DitherButton,
  DitherClipboard,
  DitherHeading,
  DitherIcon,
  DitherLightRays,
  DitherSwitch,
  Sparkline,
} from "@dither-kit"
import { assetPath, routePath } from "@/shared/lib"
import ToolMark from "@/shared/ui/ToolMark.vue"
import "./chapters.css"
import { version } from "../../../package.json"
import EngravedWordmark from "./EngravedWordmark.vue"
import EssayFigure from "./EssayFigure.vue"
import Hub from "./Hub.vue"
import PauseChip from "./PauseChip.vue"
import PixelWord from "./PixelWord.vue"
import Showcase from "./Showcase.vue"
import { createPixelShake, type PixelShake } from "./pixel-shake"

// The harnesses `bridge/dither-bridge.mjs` knows (its HARNESSES: ids and
// names), in its order, each chip under the tool's own mark.
const HARNESSES = [
  { id: "claude", name: "Claude Code" },
  { id: "codex", name: "Codex" },
  { id: "gemini", name: "Gemini CLI" },
  { id: "qwen", name: "Qwen Code" },
  { id: "omp", name: "oh-my-pi" },
  { id: "goose", name: "Goose" },
  { id: "opencode", name: "OpenCode" },
  { id: "auggie", name: "Auggie" },
] as const
// The bridge: copy its folder, run it (one file, Node 20+). Shown as its
// two commands, copied as one line.
const BRIDGE_STEPS = ["npx degit drvova/dither-ui/bridge bridge", "node bridge/dither-bridge.mjs"]
const BRIDGE = BRIDGE_STEPS.join(" && ")
// What the third step's ask makes: a screen of real kit components, as the
// Studio's add_screen lays it out on its canvas.
const ASK = "a deploy panel with this week's deploys, an auto deploy switch and a deploy key"
const DEPLOYS = [4, 6, 5, 8, 7, 11, 9, 12, 10, 14, 13, 16]
const auto = ref(true)

// The close: the kit's light rays falling over the band. A hand on the
// keys (the pointer or focus) brightens them.
const reaching = ref(false)
const raysPlaying = ref(true)

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

// The principles: six statements read as one, each a link into the docs
// that covers it. Their words light as they rise through the viewport (CSS
// scroll timelines, `--p` = the word's place in its line), and the
// statement crossing the viewport's middle — or the one pointed at, by
// hover or focus — re-dithers the figure into its scene.
const PRINCIPLES = [
  { text: "Every pixel is placed on purpose.", href: routePath("/docs") },
  {
    text: "Each component draws its own pixels, so a chart and a button share one texture.",
    href: routePath("/docs/area"),
  },
  {
    text: "Seven hues in one palette. Fills, lines and sparkles all resolve from it.",
    href: routePath("/docs/palette"),
  },
  {
    text: "A seed replays a fill exactly, forever. An explicit prop always wins over it.",
    href: routePath("/docs/seeds"),
  },
  {
    text: "Layout, motion, text effects and 3D share one ordered-dither engine.",
    href: routePath("/docs/composition"),
  },
  {
    text: "Copy the folder and alias it. No package to update, no code you cannot read.",
    href: routePath("/docs/getting-started"),
  },
].map((p) => {
  const words = p.text.split(" ")
  return { ...p, words: words.map((w, i) => ({ w, p: words.length > 1 ? i / (words.length - 1) : 0 })) }
})
const principle = ref(0)
const principleEls = ref<HTMLElement[]>([])
const stageFig = ref<HTMLElement | null>(null)
let stageIO: IntersectionObserver | null = null
let phone: MediaQueryList | null = null

// The stage is the statement where the figure is. On a wide screen the
// figure sits at the viewport's middle, so it is the statement crossing
// the middle (a zero-height root line). On a phone the figure is a strip
// pinned to the top, so it is the statement sitting just under the strip:
// the topmost one at least half inside a band from the strip's foot to
// the middle. No scroll listener; the observer is made again when the
// layout flips.
function observeStage() {
  stageIO?.disconnect()
  stageIO = null
  if (typeof IntersectionObserver === "undefined") return
  const narrow = phone?.matches ?? false
  const foot = narrow ? Math.ceil(stageFig.value?.getBoundingClientRect().height ?? 0) : 0
  const inBand = new Set<number>()
  stageIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const i = principleEls.value.indexOf(e.target as HTMLElement)
        if (i < 0) continue
        if (narrow ? e.intersectionRatio >= 0.5 : e.isIntersecting) inBand.add(i)
        else inBand.delete(i)
      }
      if (inBand.size) principle.value = Math.min(...inBand)
    },
    narrow ? { rootMargin: `-${foot}px 0px -50% 0px`, threshold: [0, 0.5, 1] } : { rootMargin: "-50% 0px -50% 0px" },
  )
  for (const el of principleEls.value) stageIO.observe(el)
}
let facesIO: IntersectionObserver | null = null

onMounted(() => {
  // The landing is always-dark art (the stage, the wells and the organism
  // are ink). A light theme toggled on docs/studio persists on <html> and this is
  // one SPA — without re-asserting dark here, token text flips to near-black
  // over the hardcoded ink (measured 1.02:1 on the h1). Storage keeps the
  // user's choice; docs/studio re-read it on their own mount.
  document.documentElement.classList.add("dark")

  // The portraits sit far below the fold, so their sheet waits until they
  // are within a screen: it never counts toward the page's `load`.
  const loadFaces = () => {
    const img = new Image()
    img.src = assetPath("/faces.webp")
    img.onload = () => {
      FACES.forEach((f, i) => {
        const face = faceEls.value[i]
        const emote = emoteEls.value[i]
        if (face)
          shakers.push(
            createPixelShake(face, img, { x: f.x, y: FACE_Y, w: f.w, h: FACE_H }, { radius: 18, amplitude: 6 }),
          )
        if (emote) blit(emote, img, f.emote.x, f.emote.y, f.emote.w, f.emote.h)
      })
    }
  }
  const firstFace = faceEls.value[0]
  if (typeof IntersectionObserver === "undefined" || !firstFace) loadFaces()
  else {
    facesIO = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        facesIO?.disconnect()
        facesIO = null
        loadFaces()
      },
      { rootMargin: "100% 0px" },
    )
    facesIO.observe(firstFace)
  }

  phone = window.matchMedia("(max-width: 759px)")
  phone.addEventListener("change", observeStage)
  observeStage()
})

onBeforeUnmount(() => {
  phone?.removeEventListener("change", observeStage)
  stageIO?.disconnect()
  stageIO = null
  facesIO?.disconnect()
  for (const sh of shakers) sh.destroy()
  shakers = []
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

    <!-- Header: the docs header's twin (brand, the site's links, the
         "Open studio" pill, in sentence case here) so landing, docs and
         studio read as one site.
         relative + z-10 — main.relative isolates the page art, and a
         positioned sibling always paints above a static one; without this
         the art covered the header entirely (it painted zero pixels). -->
    <header class="site-head relative z-10">
      <div class="mx-auto flex h-14 w-full max-w-[var(--shell)] items-center justify-between px-6 text-xs">
        <a :href="routePath('/')" class="flex h-8 items-center gap-2.5 whitespace-nowrap tracking-tight">
          <!-- The brand mark: the 7x7 dithered diamond, ember core. -->
          <svg
            viewBox="0 0 7 7"
            width="13"
            height="13"
            aria-hidden="true"
            focusable="false"
            shape-rendering="crispEdges"
          >
            <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="currentColor" />
            <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
          </svg>
          dither-ui
        </a>
        <nav class="flex items-center text-muted-foreground" aria-label="Site">
          <a href="#directory" class="nav-a hidden sm:inline-flex">Components</a>
          <a :href="routePath('/docs')" class="nav-a">Docs</a>
          <a href="#agents" class="nav-a hidden sm:inline-flex">Agents</a>
          <a
            href="https://github.com/drvova/dither-ui"
            target="_blank"
            rel="noreferrer"
            class="nav-a hidden md:inline-flex"
            >GitHub<span class="sr-only"> (opens in a new tab)</span></a
          >
          <a :href="routePath('/studio')" class="nav-a nav-pill ml-2">Open studio</a>
        </nav>
      </div>
    </header>

    <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
      <!-- The portal: the full-bleed hero band (the stage), the statement,
           the install bar and the panel columns, with six moods in the
           portraits' well: hover a face, her pixels scatter under the
           cursor and settle, and her emote answers. Then, on the shell, the
           directory, the principles and the agents. -->
      <Showcase>
        <template #faces>
          <div
            role="img"
            aria-label="Pixel-art character portraits in six expressions. Hover a portrait: her pixels stir under the cursor and her reaction emote answers."
            class="grid grid-cols-3 gap-x-5"
          >
            <div v-for="(f, i) in FACES" :key="i" class="group relative flex justify-center pt-6">
              <!-- CSS size reserves layout (no CLS); blit paints the backing store at
                     device resolution so the portrait stays sharp on hi-DPI / 4K -->
              <canvas
                :ref="
                  (el) => {
                    if (el) faceEls[i] = el as HTMLCanvasElement
                  }
                "
                :style="{ width: `${f.w}px`, height: `${FACE_H}px` }"
              />
              <canvas
                :ref="
                  (el) => {
                    if (el) emoteEls[i] = el as HTMLCanvasElement
                  }
                "
                class="emote absolute top-0 left-1/2"
                :style="{ width: `${f.emote.w}px`, height: `${f.emote.h}px` }"
              />
            </div>
          </div>
        </template>
      </Showcase>
      <div class="box mx-auto w-full max-w-[var(--shell)] px-6">
        <Hub />

        <!-- The principles: the figure in a sticky well (a 24x24 lattice
             that re-dithers itself into the staged statement's scene)
             beside six numbered statements at a large size, each a link
             into its docs, their words lighting as they rise. -->
        <section aria-labelledby="principles-h" class="principles">
          <div class="section-head">
            <h2 id="principles-h" class="section-title">One rule under every pixel.</h2>
            <div class="head-side">
              <ul class="tags" aria-label="Built on">
                <li class="tag">Bayer 4x4</li>
                <li class="tag">7 seed hues</li>
                <li class="tag">One engine</li>
              </ul>
              <a :href="routePath('/docs/getting-started')" class="more-link">Read the quick start</a>
            </div>
          </div>
          <div class="panel principles-body">
            <div ref="stageFig" class="thumb principles-fig"><EssayFigure :stage="principle" /></div>
            <ol class="principles-list">
              <li v-for="(p, i) in PRINCIPLES" :key="p.href">
                <a
                  :ref="
                    (el) => {
                      if (el) principleEls[i] = el as HTMLElement
                    }
                  "
                  :href="p.href"
                  class="principle"
                  :data-active="principle === i ? 'true' : undefined"
                  @mouseenter="principle = i"
                  @focus="principle = i"
                >
                  <span class="principle-n" aria-hidden="true">{{ String(i + 1).padStart(2, "0") }}</span>
                  <span class="principle-t"
                    ><template v-for="(w, j) in p.words" :key="j"
                      ><span class="w" :style="{ '--p': w.p }">{{ w.w }}</span
                      >{{ j < p.words.length - 1 ? " " : "" }}</template
                    ></span
                  >
                </a>
              </li>
            </ol>
          </div>
        </section>

        <!-- The agents: how to hand the Studio to the agent you already use
             (three steps, each under its glyph: the bridge's command to
             copy under Node's mark, the harnesses it knows as hairline
             chips under their own marks, the ask) beside the screen it makes.
             Each harness runs as the user's own signed-in process. -->
        <section id="agents" class="agents" aria-labelledby="harness-h">
          <div class="section-head">
            <h2 id="harness-h" class="section-title">Your own agent drives the Studio.</h2>
            <div class="head-side">
              <ul class="tags" aria-label="Works with">
                <li class="tag">{{ HARNESSES.length }} harnesses</li>
                <li class="tag">ACP</li>
                <li class="tag">No keys</li>
              </ul>
              <a :href="assetPath('/agent/SKILL.md')" class="more-link">Read the agent skill</a>
            </div>
          </div>
          <div class="panel harness-panel">
            <ol class="agent-steps">
              <li>
                <span class="step-i"><ToolMark id="node" :size="14" /></span>
                <div class="step-b">
                  <p class="step-t">Run the bridge on your machine: one Node file, no dependencies.</p>
                  <div class="bridge">
                    <code class="bridge-cmd"
                      ><span>{{ BRIDGE_STEPS[0] }} &&</span><span>{{ BRIDGE_STEPS[1] }}</span></code
                    >
                    <DitherClipboard :value="BRIDGE">
                      <template #default="{ copied }">
                        <button type="button" class="bridge-copy" :aria-label="copied ? 'Copied' : 'Copy the command'">
                          <DitherIcon :name="copied ? 'Check' : 'Copy'" :size="13" :stroke-width="1.5" />
                        </button>
                      </template>
                    </DitherClipboard>
                  </div>
                </div>
              </li>
              <li>
                <span class="step-i"><DitherIcon name="Bot" :size="14" :stroke-width="1.5" /></span>
                <div class="step-b">
                  <p class="step-t">
                    Open the Studio's Agent panel and pick your harness. It lists the ones on your PATH.
                  </p>
                  <ul class="harness" aria-label="Harnesses the bridge starts">
                    <li v-for="h in HARNESSES" :key="h.id" class="harness-chip">
                      <ToolMark :id="h.id" :size="13" />{{ h.name }}
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <span class="step-i"><DitherIcon name="Sparkles" :size="14" :stroke-width="1.5" /></span>
                <p class="step-t step-b">
                  Ask for a screen. Each tool call lands on the canvas, and undo takes it back.
                </p>
              </li>
            </ol>
            <div class="harness-side">
              <!-- The ask and the screen it lands as: an artboard on the
                   Studio's dotted canvas, every part of it live. -->
              <div class="studio-stage">
                <p class="ask"><span aria-hidden="true">›</span> {{ ASK }}</p>
                <div class="board">
                  <span class="board-name">Deploys</span>
                  <div class="board-frame">
                    <DitherHeading level="3">Deploys</DitherHeading>
                    <div class="board-row">
                      <span class="board-n">16</span>
                      <span class="board-l">this week</span>
                      <Sparkline :data="DEPLOYS" color="blue" class="board-spark" />
                    </div>
                    <div class="board-switch">
                      <DitherSwitch v-model="auto" label="Auto deploy" />
                      <span aria-hidden="true">Auto deploy</span>
                    </div>
                    <DitherButton color="blue" variant="gradient" class="board-key">Deploy now</DitherButton>
                  </div>
                </div>
              </div>
              <p class="harness-note">Your harness keeps its own login. The Studio never asks for a key.</p>
            </div>
          </div>
        </section>
      </div>

      <!-- The close: a full-bleed band, the last line and its keys on the
           shell, then the kit's light rays across the band. -->
      <section class="dawn" aria-labelledby="dawn-h">
        <div class="dawn-in">
          <h2 id="dawn-h" class="section-title">Copy one folder. Every pixel is yours.</h2>
          <div
            class="dawn-keys"
            @pointerenter="reaching = true"
            @pointerleave="reaching = false"
            @focusin="reaching = true"
            @focusout="reaching = false"
          >
            <a :href="routePath('/docs/getting-started')" class="nav-a nav-pill key-primary">Read the quick start</a>
            <a :href="routePath('/studio')" class="nav-a nav-pill">Open the studio</a>
          </div>
        </div>
        <div class="dawn-art">
          <DitherLightRays
            :glow="reaching ? 2.4 : 1.5"
            :speed="0.3"
            :frame-rate="12"
            :paused="!raysPlaying"
            class="dawn-rays"
          />
          <PauseChip v-model="raysPlaying" label="Pause the light" class="dawn-chip" />
        </div>
      </section>
    </main>

    <!-- Footer: the wordmark and framework badges left, bar-separated
         links right, the copyright line under, then the engraved mark. -->
    <footer class="foot-wrap">
      <div class="mx-auto w-full max-w-[var(--shell)] px-6 pt-8 pb-6">
        <div class="foot-row">
          <div class="foot-left">
            <PixelWord text="DITHER-UI" :cell="2" :seam="1 / 2" class="text-foreground" />
            <span class="foot-badge"><ToolMark id="vue" :size="11" />Vue 3</span>
            <span class="foot-badge"><ToolMark id="svelte" :size="11" />Svelte 5</span>
          </div>
          <nav class="foot-links" aria-label="Footer">
            <a
              v-for="l in FOOTER"
              :key="l.label"
              :href="l.href"
              v-bind="l.external ? { target: '_blank', rel: 'noreferrer' } : {}"
              >{{ l.label }}<span v-if="l.external" class="sr-only"> (opens in a new tab)</span></a
            >
          </nav>
        </div>
        <p class="foot-copy">
          <span>© {{ new Date().getFullYear() }} dither-ui.com</span>
          <span>v{{ version }}</span>
          <span>MIT license</span>
        </p>
      </div>
      <div aria-hidden="true" class="foot-mark mx-auto px-6 pb-10">
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
  gap: calc(var(--rhythm) * 1.5);
  padding-top: calc(var(--rhythm) * 1.5);
  padding-bottom: calc(var(--rhythm) * 1.5);
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  font-size: 11px;
  border-radius: 999px;
  color: var(--ink-3);
  box-shadow:
    inset 0 0 0 1px var(--line),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
}

/* The links' padding is pulled back so, wrapped under the wordmark, the
   first one's text starts on the shell's edge. */
.foot-links {
  display: flex;
  flex-wrap: wrap;
  margin-left: -10px;
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
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px 18px;
  margin: 10px 0 0;
  font-size: 11px;
  color: var(--ink-3);
}

/* The engraved mark: centred under the shell on a wide screen, on the
   shell's own edges on a phone. */
.foot-mark {
  width: min(90vw, 56rem);
}

/* On a phone the links are a grid on the shell's edge: wrapped bar
   separators hung off the ends of rows, and the links' padding set them
   in from everything else. */
/* Below ~950px the links wrap under the wordmark, so the copyright line
   leaves the right edge too. */
@media (max-width: 949px) {
  .foot-copy {
    justify-content: flex-start;
  }
}

@media (max-width: 759px) {
  .foot-links {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    width: 100%;
    margin-left: 0;
  }
  .foot-links a,
  .foot-links a:last-child {
    min-height: 32px;
    padding: 0;
    box-shadow: none;
  }
  .foot-mark {
    width: 100%;
  }
}

/* The principles: the figure's well, sticky at the viewport's middle,
   beside six statements at a large size. The staged statement takes an
   ink index and a hairline rule. */
.principles,
.agents {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.principles-body {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 48px;
  align-items: start;
  padding: 28px;
}

.principles-fig {
  position: sticky;
  top: calc(50vh - 9.5rem);
  padding: 14px 14px 10px;
  container-type: inline-size;
}

/* On a phone the figure becomes a strip across the panel (its lattice
   beside its caption, see EssayFigure) pinned to the top of the screen
   while the statements pass under it, so the staged statement and its
   scene are always in view together. */
@media (max-width: 759px) {
  .principles-body {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    padding: 0;
  }
  .principles-fig {
    top: 0;
    z-index: 1;
    padding: 12px 16px;
    border-radius: 12px 12px 0 0;
    box-shadow:
      inset 0 0 0 1px var(--line),
      0 1px 0 var(--line);
  }
  .principle {
    gap: 14px;
    padding: 18px 16px;
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
  gap: 20px;
  padding: 22px 12px 22px 16px;
  view-timeline-name: --principle;
  box-shadow: inset 0 -1px 0 color-mix(in oklab, var(--line) 70%, transparent);
  transition: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.principle-n {
  flex: none;
  font-size: 11px;
  color: var(--ink-3);
}

.principle-t {
  font-size: clamp(1.2rem, 2.2vw, 2rem);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.035em;
  color: var(--ink-3);
  text-wrap: pretty;
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

/* The reveal (after MONOGRID): each word lights from the muted ink to the
   full ink over its own slice of its statement's rise — later words later —
   so a line reads itself in as it climbs to the middle. Both ends pass
   4.5:1, so a half-lit line is still text; with no scroll timelines or
   under reduced motion the words simply sit in their state. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .principle-t .w {
      animation: principle-word linear both;
      animation-timeline: --principle;
      animation-range: cover calc(6% + var(--p) * 26%) cover calc(14% + var(--p) * 26%);
    }
  }
  /* On a phone the stage is at the top, under the pinned strip, so a line
     finishes lighting as it arrives there rather than at the middle. */
  @media (prefers-reduced-motion: no-preference) and (max-width: 759px) {
    .principle-t .w {
      animation-range: cover calc(8% + var(--p) * 38%) cover calc(16% + var(--p) * 38%);
    }
  }
}

@keyframes principle-word {
  from {
    color: var(--ink-3);
  }
  to {
    color: var(--ink);
  }
}

/* The agents: the three steps on the left, each under its glyph; on the
   right, the screen the ask makes on the well with the note under it. */
/* A real border, not the panel's inset hairline: the well's background
   would paint over an inset shadow. */
.harness-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--line);
  box-shadow: none;
}

.agent-steps {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin: 0;
  padding: 26px 28px;
  list-style: none;
}

.agent-steps > li {
  display: flex;
  gap: 14px;
}

.step-i {
  display: inline-grid;
  flex: none;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--line);
}

.step-b {
  min-width: 0;
  flex: 1;
}

.step-t {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-2);
}

/* The bridge's command: its two lines in a well, copied in place as one. */
.bridge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 6px 6px 6px 12px;
  border-radius: 8px;
  background: var(--well);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--line) 80%, transparent);
}

.bridge-cmd {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  font-size: 11.5px;
  line-height: 1.7;
  overflow-wrap: anywhere;
  color: var(--ink);
}

.bridge-copy {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--ink-3);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.bridge-copy:hover {
  color: var(--ink);
}

.harness {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

/* The Studio picker's chip: the harness's own mark and its name on a
   hairline pill. */
.harness-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 11.5px;
  color: var(--ink-2);
  box-shadow: inset 0 0 0 1px var(--line);
}

.harness-side {
  display: flex;
  flex-direction: column;
  background: var(--well);
  box-shadow: inset 1px 0 0 var(--line);
}

/* The steps set the panel's height; the canvas takes what the well has
   above the note: the Studio's dots, the ask, then the artboard (its name
   over its frame, as the Studio draws one). */
.studio-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 22px 28px;
  background-image: radial-gradient(circle, color-mix(in oklab, var(--line) 90%, transparent) 1px, transparent 1.2px);
  background-size: 16px 16px;
}

.ask {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ink-2);
}

.ask span {
  color: var(--ink-3);
}

.board {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(100%, 20rem);
}

.board-name {
  font-size: 11px;
  color: var(--ink-3);
}

.board-frame {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 8px;
  background: var(--background);
  box-shadow: inset 0 0 0 1px var(--line);
}

.board-row {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  align-items: end;
  gap: 2px 14px;
}

.board-n {
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.board-l {
  grid-row: 2;
  font-size: 11px;
  color: var(--ink-3);
}

.board-spark {
  grid-row: 1 / 3;
  grid-column: 2;
  height: 3rem;
}

.board-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ink-2);
}

.board-key {
  align-self: flex-start;
}

.harness-note {
  margin: 0;
  padding: 12px 28px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-2);
  text-wrap: balance;
  background: var(--background);
  box-shadow:
    inset 1px 0 0 var(--line),
    inset 0 1px 0 var(--line);
}

@media (max-width: 759px) {
  .harness-panel {
    grid-template-columns: minmax(0, 1fr);
  }
  .agent-steps {
    padding: 20px;
  }
  .harness-side {
    box-shadow: inset 0 1px 0 var(--line);
  }
  .studio-stage {
    padding: 20px;
  }
  .harness-note {
    padding: 12px 20px;
    box-shadow: inset 0 1px 0 var(--line);
  }
}

/* The close: a full-bleed band between hairlines; the last line and its
   keys on the shell, the light rays under them, edge to edge up to 100rem. */
.dawn {
  overflow: hidden;
  background: var(--well);
  box-shadow:
    inset 0 1px 0 var(--line),
    inset 0 -1px 0 var(--line);
}

.dawn-in {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 32px;
  width: 100%;
  max-width: var(--shell);
  margin-inline: auto;
  padding: 44px 1.5rem 0;
}

.dawn-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* The rays fall across the band from its top edge's middle, up to
   100rem, their sides fading into the band past that. */
.dawn-art {
  position: relative;
  width: 100%;
  max-width: 100rem;
  height: clamp(12rem, 26vw, 24rem);
  margin-inline: auto;
}

/* The light comes from above the band: its top edge fades in. */
.dawn-rays {
  position: absolute;
  inset: 0;
  mask-image: linear-gradient(to bottom, transparent, #000 30%);
}

@media (min-width: 100rem) {
  .dawn-art {
    mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
  }
}

/* The pause chip lines up with the shell's right edge. */
.dawn-chip {
  position: absolute;
  right: max(8px, calc((100% - var(--shell)) / 2 + 1.5rem));
  bottom: 12px;
  z-index: 1;
}

/* Under reduced motion the rays are one still frame: nothing to pause. */
@media (prefers-reduced-motion: reduce) {
  .dawn-chip {
    display: none;
  }
}

@media (max-width: 759px) {
  .dawn-in {
    padding: 28px 1.5rem 0;
  }
  .dawn-chip {
    right: 1.5rem;
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
