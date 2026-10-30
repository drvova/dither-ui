<script setup lang="ts">
// The landing, printed in the dark, always: one bone ink on obsidian
// inside a hairline frame, the kit's art the only colour on it. The hero (the statement beside the
// stage, seated on a poster the kit prints), then sections under a title
// with a lead beside it: a bento of live kit components, the screen an
// agent's ask makes, what's inside (the kit, the Studio, the bridge; the
// docs' families), a print plate with the diamond small in it, the
// install, and a footer of link columns over the line-screen wordmark. Michroma for display, mono for the rest; everything
// that moves is the kit.
import { onMounted, ref } from "vue"
import { DitherClipboard, DitherGradient, DitherIcon } from "@dither-kit"
import { assetPath, routePath } from "@/shared/lib"
import ToolMark from "@/shared/ui/ToolMark.vue"
import "@/shared/fonts/display.css"
import "./chapters.css"
import { version } from "../../../package.json"
import AgentStory from "./AgentStory.vue"
import Examples from "./Examples.vue"
import { RUNTIME_DEPS, SPECS } from "./facts"
import { DOCS_FAMILIES, SECTION_COUNT } from "./hub"
import InstallBlock from "./InstallBlock.vue"
import LineWordmark from "./LineWordmark.vue"
import PixelWord from "./PixelWord.vue"
import Showcase from "./Showcase.vue"

// The brand mark: the kit's 7x7 dithered diamond (its ember core drawn
// apart), in the header and small on the plate before the install.
const MARK = "M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z"
// The plate's stock: the raised ground (`--surface`) as a colour the kit
// prints with, so the open cells of its print are the plate itself, never
// a tint. `tests/landing-facts.spec.ts` holds it to the token's mix.
const STOCK = "#1c1e1f"

// What "Copy agent prompt" puts on the clipboard: the skill to read and the
// install to run, pointed at wherever this page is served from.
const prompt = ref("")
onMounted(() => {
  // The landing is always dark (the user's call): a light theme toggled on
  // the docs or the Studio persists on <html> in this one SPA, so dark is
  // re-asserted here; storage keeps the user's choice and the docs and the
  // Studio re-read it.
  document.documentElement.classList.add("dark")
  prompt.value = [
    `Read ${location.origin}${assetPath("/agent/SKILL.md")} and add dither-ui to this project:`,
    "copy the kit with `npx degit drvova/dither-ui/dither-kit src/dither-kit`,",
    "install d3-scale, d3-shape, clsx and tailwind-merge, alias @dither-kit to src/dither-kit/tailwind,",
    "then build what I ask from its components.",
  ].join(" ")
})

// The harnesses `bridge/dither-bridge.mjs` knows (its HARNESSES: ids and
// names), in its order, each under the tool's own mark.
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

// What's inside: the kit, the Studio and the bridge, each a paragraph and
// the link that leads on.
const INSIDE = [
  {
    title: "The kit",
    icon: "Grid",
    text: "Plain source you own: an engine of rasters, palettes and one seekable clock under every component, authored in Tailwind with a StyleX twin generated from it. Charts, controls, text, backgrounds, 3D and GLSL all dither through the same Bayer cells from one seed, pause offscreen and honour reduced motion. A Svelte 5 port ships beside it.",
    link: { label: "Read the quick start", href: routePath("/docs/getting-started") },
  },
  {
    title: "The Studio",
    icon: "Layout",
    text: "An infinite canvas for screens made of kit parts. Lay out charts, controls and whole screens, theme them from the palette, and export each frame as a Vue file, a PNG or an MP4. A reel of frames cuts into a film with its own score.",
    link: { label: "Open the studio", href: routePath("/studio") },
  },
  {
    title: "The agent bridge",
    icon: "Bot",
    text: "A SKILL.md teaches your coding agent to compose Studio documents. The bridge, one Node file, starts the harness you already use as your own signed-in process, so the Studio never asks for a key.",
    link: { label: "Read the agent skill", href: assetPath("/agent/SKILL.md") },
  },
] as const

// The footer's columns; the docs families carry their size.
const COLUMNS: { title: string; links: { label: string; href: string; n?: number }[] }[] = [
  {
    title: "Get started",
    links: [
      { label: "Quick start", href: routePath("/docs/getting-started") },
      { label: "Styling", href: routePath("/docs/styling") },
      { label: "Seeds", href: routePath("/docs/seeds") },
      { label: "Accessibility", href: routePath("/docs/accessibility") },
      { label: "Verification", href: routePath("/docs/verification") },
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
</script>

<template>
  <div class="landing flex min-h-screen flex-col bg-background text-foreground antialiased">
    <!-- Skip link: first focusable element, jumps to the single main landmark. -->
    <a
      href="#main"
      class="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-ring focus:bg-background focus:px-4 focus:py-2 focus:text-xs"
    >
      Skip to content
    </a>

    <!-- Header: a floating capsule on the raised ground, sticky over the
         page (brand, the site's links, GitHub under its mark, the chrome
         "Open studio" key).
         Sticky is positioned, and z-10 keeps it over main, which isolates
         the page art: a static header painted under the art, zero pixels. -->
    <header class="site-head sticky top-0 z-10">
      <div class="site-capsule text-xs">
        <a :href="routePath('/')" class="flex h-8 items-center gap-2.5 whitespace-nowrap pl-2">
          <!-- The brand mark: the 7x7 dithered diamond, ember core. -->
          <svg
            viewBox="0 0 7 7"
            width="13"
            height="13"
            aria-hidden="true"
            focusable="false"
            shape-rendering="crispEdges"
          >
            <path :d="MARK" fill="currentColor" />
            <rect x="3" y="3" width="1" height="1" fill="var(--signal)" />
          </svg>
          dither-ui
        </a>
        <nav class="flex items-center text-muted-foreground" aria-label="Site">
          <a href="#examples" class="nav-a hidden sm:inline-flex">Components</a>
          <a :href="routePath('/docs')" class="nav-a">Docs</a>
          <a href="#ask" class="nav-a hidden sm:inline-flex">Agents</a>
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
      <!-- The hero, our own: the statement beside the stage, seated on a
           poster the kit prints. -->
      <Showcase />

      <div class="page">
        <Examples />

        <!-- Ask: one agent session, played as the page scrolls past it. -->
        <section id="ask" aria-labelledby="ask-h" class="sec">
          <div class="sec-head">
            <h2 id="ask-h" class="section-title chrome-type">Your agent builds the screen.</h2>
            <div class="sec-side">
              <p class="sec-lede">
                Give your coding agent the skill file, then ask for a screen. Each tool call lands on the canvas as a
                frame of kit parts, and undo takes it back.
              </p>
              <a :href="assetPath('/agent/SKILL.md')" class="more-link">Read the agent skill</a>
            </div>
          </div>
          <AgentStory />
        </section>

        <!-- What's inside: the kit, the Studio, the bridge; then the docs'
             big families, each with its size and a line. -->
        <section id="inside" aria-labelledby="inside-h" class="sec">
          <div class="sec-head">
            <h2 id="inside-h" class="section-title chrome-type">Three parts, one engine.</h2>
            <div class="sec-side">
              <p class="sec-lede">
                A toolkit you copy into your repo, a Studio to compose with it, and a bridge that hands the Studio to
                the coding agent you already use. All of it is code you can read.
              </p>
            </div>
          </div>
          <ul class="inside">
            <li v-for="c in INSIDE" :key="c.title">
              <h3 class="inside-h"><DitherIcon :name="c.icon" :size="15" :stroke-width="1.5" />{{ c.title }}</h3>
              <p class="inside-p">{{ c.text }}</p>
              <ul v-if="c.title === 'The agent bridge'" class="marks" aria-label="Harnesses the bridge starts">
                <li v-for="h in HARNESSES" :key="h.id"><ToolMark :id="h.id" :size="13" />{{ h.name }}</li>
              </ul>
              <a :href="c.link.href" class="more-link">{{ c.link.label }}</a>
            </li>
          </ul>
          <div class="families">
            <h3 class="families-h">{{ SECTION_COUNT }} docs sections, the five biggest families</h3>
            <ul class="families-list">
              <li v-for="f in DOCS_FAMILIES" :key="f.label">
                <a :href="routePath(`/docs/${f.first}`)" class="family-t"
                  >{{ f.label }}<span class="family-n">{{ f.count }}</span></a
                >
                <p class="family-p">{{ f.note }}</p>
              </li>
            </ul>
          </div>
        </section>

        <!-- A print plate, the subject small in a wide field: on the raised
             ground, the bone ink's tone thinning from the top edge, a clear
             band where the kit's diamond stands, and the tone rising again
             to the foot. The quiet before the install. -->
        <div class="plate" :style="{ background: STOCK }" aria-hidden="true">
          <div class="plate-tone plate-sky">
            <DitherGradient from="#e4e1d8" :to="STOCK" direction="down" :cell="4" class="plate-ramp" />
          </div>
          <div class="plate-tone plate-ground">
            <DitherGradient from="#e4e1d8" :to="STOCK" direction="up" :cell="4" class="plate-ramp" />
          </div>
          <svg viewBox="0 0 7 7" class="plate-mark" focusable="false" shape-rendering="crispEdges">
            <path :d="MARK" fill="currentColor" />
            <rect x="3" y="3" width="1" height="1" fill="var(--signal)" />
          </svg>
        </div>

        <!-- The install, centred. -->
        <section id="install" aria-labelledby="install-h" class="sec install">
          <div class="install-head">
            <h2 id="install-h" class="section-title chrome-type">Copy one folder. Every pixel is yours.</h2>
            <p class="sec-lede">
              Copy the kit into your app, add its {{ RUNTIME_DEPS.length }} packages and import from
              <code>@dither-kit</code>. Or paste the agent prompt and your agent does all three.
            </p>
            <DitherClipboard :value="prompt">
              <template #default="{ copied }">
                <button type="button" class="key prompt-key" :aria-label="copied ? 'Agent prompt copied' : undefined">
                  <DitherIcon :name="copied ? 'Check' : 'Copy'" :size="12" :stroke-width="1.5" />{{
                    copied ? "Copied" : "Copy agent prompt"
                  }}
                </button>
              </template>
            </DitherClipboard>
          </div>
          <InstallBlock />
          <p class="install-note">
            On Svelte 5? The same kit ships as <code>dither-kit-svelte</code>, and the
            <a :href="routePath('/docs/getting-started')" class="lead">quick start</a> has its steps.
          </p>
          <dl class="sheet" aria-label="The kit in brief">
            <div v-for="s in SPECS" :key="s.label" class="sheet-row">
              <dt>{{ s.label }}</dt>
              <dd>{{ s.value }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>

    <!-- Footer: the pixel wordmark and a line beside three link columns, the
         copyright line, then the line-screen wordmark. -->
    <footer class="foot">
      <div class="foot-in">
        <div class="foot-brand">
          <a :href="routePath('/')" class="foot-name"
            ><PixelWord text="DITHER-UI" :cell="2" :seam="1 / 2" decorative /><span class="sr-only">dither-ui</span></a
          >
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
        <LineWordmark />
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* One wide page width for the hero, the sections and the footer, one
   rhythm between sections. The page is the theme's own
   background. */
.landing {
  --page: 80rem;
  --rhythm: 40px;
}

/* The header: a capsule on the raised ground floating over the page,
   centred, lifted by its shadow alone. */
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
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--float-shadow);
}

@media (forced-colors: active) {
  .site-capsule {
    border: 1px solid CanvasText;
  }
}

.studio-key {
  height: 34px;
  padding-inline: 16px;
}

/* The sections, on the page width with the rhythm between them. */
.page {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rhythm) * 3.5);
  width: min(100%, var(--page));
  margin-inline: auto;
  padding: calc(var(--rhythm) * 2) 24px calc(var(--rhythm) * 3);
}

.sec {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* What's inside: three columns. */
.inside {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 32px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.inside > li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.inside-h {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
}

.inside-h :deep(svg) {
  color: var(--signal);
}

.inside-p {
  flex: 1;
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--ink-3);
  text-wrap: pretty;
}

.marks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 11.5px;
  color: var(--ink-3);
}

.marks li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* The families: five columns, each the name and its size (the docs
   link), a line. */
.families {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 28px;
}

.families-h {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
}

.families-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.families-list li {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.family-t {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-height: 24px;
  font-size: 13px;
  color: var(--ink);
  transition: color 150ms var(--ease-settle);
}

.family-t:hover {
  color: var(--signal);
}

.family-n {
  font-size: 11px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

.family-p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
  text-wrap: pretty;
}

/* The plate: the page's width at 2.35:1, square cornered and flat like the
   hero's print. Each half shows only the thin end of its ramp (the sky
   runs 4x its depth, so it thins from a quarter of the ink at the top edge
   to nothing; the ground 3.33x, rising from nothing to three tenths at the
   foot), through the kit's Bayer screen like the hero's print; between
   them a clear band holds the mark, 28px (seven 4px cells). */
.plate {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 2.35;
  overflow: hidden;
  color: var(--ink);
}

.plate-tone {
  position: absolute;
  inset-inline: 0;
  overflow: hidden;
}

.plate-sky {
  top: 0;
  height: 38%;
}

.plate-ground {
  top: 62%;
  bottom: 0;
}

/* Both ramps are positioned on every side: the kit's own inset-0 would
   otherwise pin the ramp's top. */
.plate-sky .plate-ramp {
  inset: auto 0 0;
  height: 400%;
}

.plate-ground .plate-ramp {
  inset: 0 0 auto;
  height: 333%;
}

.plate-mark {
  position: absolute;
  left: 68%;
  top: 50%;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
}

/* The install: its head centred, the box under it. */
.install {
  width: min(100%, 64rem);
  margin-inline: auto;
}

.install-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.install-head .section-title {
  max-width: none;
}

.install-head .sec-lede {
  max-width: 34rem;
}

.prompt-key {
  height: 36px;
  padding-inline: 16px;
}

/* The spec sheet closing the install: label and value rows on the raised
   ground, two columns of rows from 640px, no rules between them. (Not
   `.spec`: that is the site voice's uppercase label, banned here.) */
.sheet {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 40px;
  margin: 8px 0 0;
  padding: 18px 24px;
  border-radius: 16px;
  background: var(--surface);
}

.sheet-row {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  gap: 12px;
  padding-block: 7px;
  font-size: 12px;
  line-height: 1.6;
}

.sheet-row dt {
  color: var(--ink-3);
}

.sheet-row dd {
  margin: 0;
  color: var(--ink);
}

.install-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
  color: var(--ink-3);
}

.landing code {
  color: var(--ink);
}

/* The footer: the brand (the pixel wordmark, a line, GitHub) beside three
   link columns, the copyright line, the line-screen wordmark under all.
   Three columns under the brand under 900px, two under 640px. */
.foot {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.foot-in {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  gap: 32px;
  width: 100%;
  max-width: var(--page);
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
  max-width: var(--page);
  margin: 0 auto;
  padding: 0 1.5rem;
  font-size: 11px;
  color: var(--ink-3);
}

/* The wordmark: the page's full width, on its edges. */
.foot-mark {
  width: 100%;
  max-width: var(--page);
  margin: 40px auto 0;
  padding: 0 1.5rem 40px;
}

@media (max-width: 1023px) {
  .families-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 24px;
  }
}

@media (max-width: 899px) {
  .inside {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 28px;
  }
  .foot-in {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .foot-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 639px) {
  .page {
    gap: calc(var(--rhythm) * 2.5);
    padding-inline: 16px;
  }
  .families-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .foot-in {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-inline: 16px;
  }
  .sheet {
    grid-template-columns: minmax(0, 1fr);
    padding: 12px 16px;
  }
  .foot-copy {
    padding-inline: 16px;
  }
  .foot-mark {
    width: 100%;
    padding-inline: 16px;
  }
}
</style>
