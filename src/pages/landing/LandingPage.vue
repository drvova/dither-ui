<script setup lang="ts">
// The landing: the portal (the statement beside the stage of real kit
// components, the install bar under it), the directory of the docs with
// its bento of live tiles, the principles, the three parts inside, the
// agents panel, the dawn close, and a footer of link columns over the
// engraved wordmark. Its look is the site's own (the Y2K materials,
// Michroma for display, mono for the rest); everything that moves is the kit.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherClipboard, DitherIcon, DitherLightRays, type IconName } from "@dither-kit"
import { assetPath, routePath } from "@/shared/lib"
import ToolMark from "@/shared/ui/ToolMark.vue"
import "@/shared/fonts/display.css"
import "./chapters.css"
import { version } from "../../../package.json"
import AgentAsks from "./AgentAsks.vue"
import { ASKS } from "./asks"
import EngravedWordmark from "./EngravedWordmark.vue"
import EssayFigure from "./EssayFigure.vue"
import { RUNTIME_DEPS } from "./facts"
import Hub from "./Hub.vue"
import { DOCS_FAMILIES } from "./hub"
import PauseChip from "./PauseChip.vue"
import PixelWord from "./PixelWord.vue"
import Showcase from "./Showcase.vue"

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
// The bridge: copy its folder, run it (one file, Node built-ins only).
// Shown as its two commands, copied as one line.
const BRIDGE_STEPS = ["npx degit drvova/dither-ui/bridge bridge", "node bridge/dither-bridge.mjs"]
const BRIDGE = BRIDGE_STEPS.join(" && ")
// The ask the agents' stage shows, picked under the third step.
const ask = ref(0)

// The close: the kit's light rays falling over the band. A hand on the
// keys (the pointer or focus) brightens them.
const reaching = ref(false)
const raysPlaying = ref(true)

// What "Copy agent prompt" puts on the clipboard: the skill to read and the
// install to run, pointed at wherever this page is served from.
const prompt = ref("")

// The three parts inside, each a numbered column of the panel: its glyph,
// a paragraph, its spec sheet (two rows) and the link that leads on.
const INSIDE: {
  title: string
  icon: IconName
  text: string
  spec: [string, string][]
  link: { label: string; href: string }
}[] = [
  {
    title: "The kit",
    icon: "Grid",
    text: "Plain source you own: an engine of rasters, palettes and one seekable clock under every component. Charts, controls, text, backgrounds, 3D and GLSL all dither through the same Bayer cells from one seed, pause offscreen and honour reduced motion.",
    spec: [
      ["Layers", "Engine, Tailwind, StyleX"],
      ["Ports", "Vue 3, Svelte 5"],
    ],
    link: { label: "Read the quick start", href: routePath("/docs/getting-started") },
  },
  {
    title: "The Studio",
    icon: "Layout",
    text: "An infinite canvas for screens made of kit parts. Lay out charts, controls and whole screens, theme them from the palette, and export each frame. A reel of frames cuts into a film with its own score.",
    spec: [
      ["Exports", "Vue file, PNG, MP4"],
      ["Reels", "Films with a score"],
    ],
    link: { label: "Open the studio", href: routePath("/studio") },
  },
  {
    title: "The agent bridge",
    icon: "Bot",
    text: "A SKILL.md teaches your coding agent to compose Studio documents. The bridge starts the harness you already use as your own signed-in process, so the Studio never asks for a key.",
    spec: [
      ["Speaks", "ACP and MCP"],
      ["Runs on", "Node, no dependencies"],
    ],
    link: { label: "Read the agent skill", href: assetPath("/agent/SKILL.md") },
  },
]

// The footer's columns; the docs families carry their size.
const COLUMNS: { title: string; links: { label: string; href: string; n?: number }[] }[] = [
  {
    title: "Get started",
    links: [
      { label: "Quick start", href: routePath("/docs/getting-started") },
      { label: "Styling", href: routePath("/docs/styling") },
      { label: "Seeds", href: routePath("/docs/seeds") },
      { label: "Accessibility", href: routePath("/docs/accessibility") },
    ],
  },
  {
    title: "Docs",
    links: DOCS_FAMILIES.map((f) => ({ label: f.label, href: routePath(`/docs/${f.first}`), n: f.count })),
  },
  {
    title: "For agents",
    links: [
      { label: "SKILL.md", href: assetPath("/agent/SKILL.md") },
      { label: "llms.txt", href: assetPath("/llms.txt") },
      { label: "Registry", href: assetPath("/agent/registry.json") },
      { label: "Studio", href: routePath("/studio") },
    ],
  },
]

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

onMounted(() => {
  // The landing is always-dark art (the stage, the wells and the shells
  // are ink). A light theme toggled on docs/studio persists on <html> and
  // this is one SPA, so dark is re-asserted here; storage keeps the user's
  // choice and docs/studio re-read it on their own mount.
  document.documentElement.classList.add("dark")
  prompt.value = [
    `Read ${location.origin}${assetPath("/agent/SKILL.md")} and add dither-ui to this project:`,
    "copy the kit with `npx degit drvova/dither-ui/dither-kit src/dither-kit`,",
    "install d3-scale, d3-shape, clsx and tailwind-merge, alias @dither-kit to src/dither-kit/tailwind,",
    "then build what I ask from its components.",
  ].join(" ")

  phone = window.matchMedia("(max-width: 759px)")
  phone.addEventListener("change", observeStage)
  observeStage()
})

onBeforeUnmount(() => {
  phone?.removeEventListener("change", observeStage)
  stageIO?.disconnect()
  stageIO = null
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

    <!-- Header: a floating capsule, sticky over the page (brand, the
         site's links, GitHub under its mark, the chrome "Open studio" key).
         Sticky is positioned, and z-10 keeps it over main, which isolates
         the page art: a static header painted under the art, zero pixels. -->
    <header class="site-head sticky top-0 z-10">
      <div class="capsule site-capsule text-xs">
        <a :href="routePath('/')" class="flex h-8 items-center gap-2.5 whitespace-nowrap pl-2 tracking-tight">
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
            ><ToolMark id="github" :size="13" />GitHub<span class="sr-only"> (opens in a new tab)</span></a
          >
        </nav>
        <a :href="routePath('/studio')" class="nav-a key-chrome studio-key">Open studio</a>
      </div>
    </header>

    <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
      <!-- The portal: the full-bleed hero band (the statement beside the
           stage) and the install bar. Then, on the shell, the directory,
           the principles, the parts inside and the agents. -->
      <Showcase />
      <div class="box mx-auto w-full max-w-[var(--shell)] px-6">
        <Hub />

        <!-- The principles: the figure in a sticky well (a 24x24 lattice
             that re-dithers itself into the staged statement's scene)
             beside six numbered statements at a large size, each a link
             into its docs, their words lighting as they rise. -->
        <section aria-labelledby="principles-h" class="principles">
          <div class="section-head">
            <h2 id="principles-h" class="section-title chrome-type">One rule under every pixel.</h2>
            <div class="head-side">
              <ul class="tags" aria-label="Built on">
                <li class="speed-tag">Bayer 4x4</li>
                <li class="speed-tag">7 seed hues</li>
                <li class="speed-tag">One engine</li>
              </ul>
              <a :href="routePath('/docs/getting-started')" class="more-link">Read the quick start</a>
            </div>
          </div>
          <div class="hardshell principles-body">
            <div ref="stageFig" class="gel principles-fig"><EssayFigure :stage="principle" /></div>
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

        <!-- Inside: the kit, the Studio and the bridge, three numbered
             columns of one panel split by hairlines, each with its spec. -->
        <section id="inside" aria-labelledby="inside-h" class="inside">
          <div class="section-head">
            <h2 id="inside-h" class="section-title chrome-type">Three parts, one engine.</h2>
            <div class="head-side">
              <ul class="tags" aria-label="Ships as">
                <li class="speed-tag">Plain source</li>
                <li class="speed-tag">MIT</li>
                <li class="speed-tag">{{ RUNTIME_DEPS.length }} deps</li>
              </ul>
              <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="more-link"
                >Read the source on GitHub<span class="sr-only"> (opens in a new tab)</span></a
              >
            </div>
          </div>
          <ol class="hardshell parts">
            <li v-for="(c, i) in INSIDE" :key="c.title" class="part">
              <div class="part-top">
                <span class="gel part-i"><DitherIcon :name="c.icon" :size="16" :stroke-width="1.5" /></span>
                <span class="spec" aria-hidden="true">Part {{ String(i + 1).padStart(2, "0") }}</span>
              </div>
              <h3 class="part-h">{{ c.title }}</h3>
              <p class="part-p">{{ c.text }}</p>
              <dl class="part-spec">
                <div v-for="[k, v] in c.spec" :key="k">
                  <dt class="spec">{{ k }}</dt>
                  <dd>{{ v }}</dd>
                </div>
              </dl>
              <a :href="c.link.href" class="lead">{{ c.link.label }}</a>
            </li>
          </ol>
        </section>

        <!-- The agents: how to hand the Studio to the agent you already use
             (three steps, each under its glyph: the bridge's command to
             copy under Node's mark, the harnesses it knows as hairline
             chips under their own marks, the ask) beside the screen it makes.
             Each harness runs as the user's own signed-in process. -->
        <section id="agents" class="agents" aria-labelledby="harness-h">
          <div class="section-head">
            <h2 id="harness-h" class="section-title chrome-type">Your own agent drives the Studio.</h2>
            <div class="head-side">
              <ul class="tags" aria-label="Works with">
                <li class="speed-tag">{{ HARNESSES.length }} harnesses</li>
                <li class="speed-tag">ACP</li>
                <li class="speed-tag">No keys</li>
              </ul>
              <a :href="assetPath('/agent/SKILL.md')" class="more-link">Read the agent skill</a>
            </div>
          </div>
          <div class="hardshell harness-panel">
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
                <div class="step-b">
                  <p class="step-t">Ask for a screen. Each tool call lands on the canvas, and undo takes it back.</p>
                  <div class="seg track ask-pick" role="group" aria-label="Asks" aria-controls="agent-ask">
                    <button v-for="(a, i) in ASKS" :key="a.id" type="button" :aria-pressed="ask === i" @click="ask = i">
                      {{ a.label }}
                    </button>
                  </div>
                </div>
              </li>
            </ol>
            <div class="harness-side">
              <AgentAsks :at="ask" />
            </div>
            <p class="harness-note">
              <DitherIcon name="Lock" :size="13" :stroke-width="1.5" class="harness-note-i" />Your harness keeps its own
              login. The Studio never asks for a key.
            </p>
          </div>
        </section>
      </div>

      <!-- The close: a full-bleed band, the last line and its keys on the
           shell, then the kit's light rays across the band. -->
      <section class="dawn" aria-labelledby="dawn-h">
        <div class="dawn-in">
          <h2 id="dawn-h" class="section-title chrome-type">Copy one folder. Every pixel is yours.</h2>
          <div
            class="dawn-keys"
            @pointerenter="reaching = true"
            @pointerleave="reaching = false"
            @focusin="reaching = true"
            @focusout="reaching = false"
          >
            <a :href="routePath('/docs/getting-started')" class="nav-a nav-pill key-chrome">Read the quick start</a>
            <DitherClipboard :value="prompt">
              <template #default="{ copied }">
                <button type="button" class="nav-a nav-pill" :aria-label="copied ? 'Agent prompt copied' : undefined">
                  <DitherIcon :name="copied ? 'Check' : 'Copy'" :size="12" :stroke-width="1.5" />{{
                    copied ? "Copied" : "Copy agent prompt"
                  }}
                </button>
              </template>
            </DitherClipboard>
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

    <!-- Footer: the pixel wordmark, the framework badges and a line beside
         three link columns, the copyright line, then the engraved mark. -->
    <footer class="foot">
      <div class="foot-in">
        <div class="foot-brand">
          <a :href="routePath('/')" class="foot-name"
            ><PixelWord text="DITHER-UI" :cell="2" :seam="1 / 2" decorative /><span class="sr-only">dither-ui</span></a
          >
          <p class="foot-badges">
            <span class="foot-badge"><ToolMark id="vue" :size="11" />Vue 3</span>
            <span class="foot-badge"><ToolMark id="svelte" :size="11" />Svelte 5</span>
          </p>
          <p class="foot-line">A dithered UI toolkit with a Studio to compose it and a skill for your agent.</p>
          <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="foot-gh"
            ><ToolMark id="github" :size="13" />GitHub<span class="sr-only"> (opens in a new tab)</span></a
          >
        </div>
        <nav v-for="col in COLUMNS" :key="col.title" class="foot-col" :aria-label="col.title">
          <h2 class="foot-h">{{ col.title }}</h2>
          <a v-for="l in col.links" :key="l.label" :href="l.href"
            >{{ l.label
            }}<span v-if="l.n" class="foot-n"
              ><span class="sr-only">, </span>{{ l.n }}<span class="sr-only"> sections</span></span
            ></a
          >
        </nav>
      </div>
      <p class="foot-copy">
        <span>© {{ new Date().getFullYear() }} dither-ui.com</span>
        <span>v{{ version }}</span>
        <span>MIT license</span>
      </p>
      <div aria-hidden="true" class="foot-mark">
        <EngravedWordmark />
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* One shell for the portal, the sections and the footer (the docs' own
   width, so the brand never jumps between pages) and one rhythm between
   the sections. The page is the theme's own background. */
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

/* The header: a capsule (the site voice's smoked polymer) floating on the
   page, centred on the shell. */
.site-head {
  padding: 8px 16px;
}

.site-capsule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: min(100%, 48rem);
  height: 48px;
  margin-inline: auto;
  padding: 0 7px 0 10px;
}

.studio-key {
  height: 34px;
  padding-inline: 16px;
}

/* The principles: the figure's well, sticky at the viewport's middle,
   beside six statements at a large size. The staged statement takes an
   ink index and a hairline rule. */
.principles,
.inside,
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

/* Inside: three numbered columns of one panel, split by hairlines (one
   column under 900px, split by rules). A column is its glyph in a gel chip
   beside its part number, the title, a paragraph, its spec sheet (two rows
   under hairlines, the label a spec) and its link. */
.parts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.part {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 24px 24px 26px;
}

.part + .part {
  box-shadow: inset 1px 0 0 var(--line);
}

.part-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  align-self: stretch;
}

.part-i {
  display: grid;
  place-items: center;
  width: 40px;
  height: 36px;
  color: var(--signal);
}

.part-h {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
}

.part-p {
  flex: 1;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--ink-3);
  text-wrap: pretty;
}

.part-spec {
  align-self: stretch;
  margin: 2px 0 4px;
}

.part-spec > div {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  align-items: baseline;
  gap: 12px;
  padding: 8px 0;
  box-shadow: inset 0 1px 0 color-mix(in oklab, var(--line) 80%, transparent);
}

.part-spec > div:last-child {
  box-shadow:
    inset 0 1px 0 color-mix(in oklab, var(--line) 80%, transparent),
    inset 0 -1px 0 color-mix(in oklab, var(--line) 80%, transparent);
}

.part-spec dd {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
}

@media (max-width: 899px) {
  .parts {
    grid-template-columns: minmax(0, 1fr);
  }
  .part + .part {
    box-shadow: inset 0 1px 0 var(--line);
  }
  .part {
    padding: 20px;
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

/* The stage sets the panel's height; the steps spread over it. */
.agent-steps {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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

.ask-pick {
  flex-wrap: wrap;
  margin-top: 12px;
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

/* The panel's foot, across both columns: the harness keeps its login. */
.harness-note {
  grid-column: 1 / -1;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 12px 28px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-2);
  background: var(--background);
  box-shadow: inset 0 1px 0 var(--line);
}

.harness-note-i {
  flex: none;
  margin-top: 3px;
  color: var(--ink-3);
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
  .harness-note {
    padding: 12px 20px;
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

/* The footer: the brand (the pixel wordmark, the framework badges, a line,
   GitHub) beside three link columns, the copyright line, the engraved
   wordmark under all. Three columns under the brand under 900px, two
   under 640px. */
.foot {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  box-shadow: inset 0 1px 0 color-mix(in oklab, var(--border) 70%, transparent);
}

.foot-in {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  gap: 32px;
  width: 100%;
  max-width: var(--shell);
  margin-inline: auto;
  padding: 48px 1.5rem 24px;
}

.foot-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.foot-name {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  color: var(--ink);
}

.foot-badges {
  display: flex;
  gap: 6px;
  margin: 0;
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

.foot-line {
  max-width: 22rem;
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
}

.foot-gh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  font-size: 12px;
  color: var(--ink-3);
  transition: color 150ms var(--ease-settle);
}

.foot-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-size: 12px;
}

.foot-h {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
}

.foot-col a {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-height: 28px;
  padding-top: 6px;
  color: var(--ink-3);
  transition: color 150ms var(--ease-settle);
}

.foot-n {
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}

.foot-col a:hover,
.foot-gh:hover {
  color: var(--ink);
}

.foot-copy {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  width: 100%;
  max-width: var(--shell);
  margin: 0 auto;
  padding: 0 1.5rem;
  font-size: 11px;
  color: var(--ink-3);
}

/* The engraved mark: centred under the shell on a wide screen, on the
   shell's own edges on a phone. */
.foot-mark {
  width: min(90vw, 56rem);
  margin: 24px auto 0;
  padding: 0 1.5rem 40px;
}

@media (max-width: 899px) {
  .foot-in {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .foot-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 639px) {
  .foot-in {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .foot-mark {
    width: 100%;
  }
}
</style>
