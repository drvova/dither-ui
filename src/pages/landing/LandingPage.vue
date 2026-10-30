<script setup lang="ts">
// The landing, printed: one ink on bone paper inside a hairline frame, and
// everything the kit draws on it printed through the diagonal screen. The
// hero (the statement beside the stage, seated on a poster), then sections
// under a title with a lead beside it: a bento of live kit components, the
// screen an agent's ask makes, what's inside (the kit, the Studio, the
// bridge; the docs' families), the install, and the footer: a poster band,
// a grid of hairlines with numbered columns, the line-screen wordmark and
// the imprint. Michroma for display, mono for the rest; everything that
// moves is the kit.
import { onMounted, ref } from "vue"
import { DitherClipboard, DitherIcon, DitherPoster, DitherScreen, type DitherColor } from "@dither-kit"
import { assetPath, routePath } from "@/shared/lib"
import ToolMark from "@/shared/ui/ToolMark.vue"
import "@/shared/fonts/display.css"
import "./chapters.css"
import { version } from "../../../package.json"
import AgentStory from "./AgentStory.vue"
import Examples from "./Examples.vue"
import { DOCS_FAMILIES, SECTION_COUNT } from "./hub"
import InstallBlock from "./InstallBlock.vue"
import LineWordmark from "./LineWordmark.vue"
import PixelWord from "./PixelWord.vue"
import Showcase from "./Showcase.vue"

// What "Copy agent prompt" puts on the clipboard: the skill to read and the
// install to run, pointed at wherever this page is served from.
const prompt = ref("")
onMounted(() => {
  // The landing is paper in either theme: a dark theme toggled on the docs
  // or the Studio persists on <html> in this one SPA, so it is dropped here;
  // storage keeps the user's choice and the docs and the Studio re-read it.
  document.documentElement.classList.remove("dark")
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

// The posters' inks: the kit's palette, printed flat.
const POSTER_INKS: DitherColor[] = ["orange", "blue", "green", "pink", "purple"]
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
            <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="currentColor" />
            <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
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

    <!-- Everything the kit draws below prints through the diagonal screen. -->
    <DitherScreen screen="diagonal">
      <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
        <!-- The hero, our own: the statement beside the stage, seated in
           the kit's liquid chrome. -->
        <Showcase />

        <div class="page">
          <Examples />

          <!-- Ask: one agent session, played as the page scrolls past it. -->
          <section id="ask" aria-labelledby="ask-h" class="sec">
            <div class="sec-head">
              <h2 id="ask-h" class="section-title chrome-type">Your agent builds the screen.</h2>
              <div class="sec-side">
                <p class="sec-lede">
                  The agent skill teaches your harness the Studio's tools, so one sentence is enough. Every tool call
                  lands on the canvas as a frame of kit parts, and undo takes it back.
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

          <!-- The install, centred. -->
          <section id="install" aria-labelledby="install-h" class="sec install">
            <div class="install-head">
              <h2 id="install-h" class="section-title chrome-type">Copy one folder. Every pixel is yours.</h2>
              <p class="sec-lede">
                Copy the kit into your app, add its four packages and import from <code>@dither-kit</code>. Or paste the
                agent prompt and let your agent do all three.
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
          </section>
        </div>
      </main>

      <!-- Footer: a poster band, then a grid of hairlines: the brand beside
         the numbered link columns, the line-screen wordmark, the imprint. -->
      <footer class="foot">
        <div class="foot-poster" aria-hidden="true">
          <DitherPoster :seed="39" :inks="POSTER_INKS" :cell="3" render-mode="static" />
        </div>
        <div class="foot-in">
          <div class="foot-brand">
            <a :href="routePath('/')" class="foot-name"
              ><PixelWord text="DITHER-UI" :cell="2" :seam="1 / 2" decorative /><span class="sr-only"
                >dither-ui</span
              ></a
            >
            <p class="foot-line">A dithered UI toolkit with a Studio to compose it and a skill for your agent.</p>
            <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="foot-gh label"
              ><ToolMark id="github" :size="13" />GitHub<span class="sr-only"> (opens in a new tab)</span></a
            >
          </div>
          <nav v-for="(col, i) in COLUMNS" :key="col.title" class="foot-col" :aria-label="col.title">
            <h2 class="foot-h label">
              <span class="foot-no">{{ String(i + 1).padStart(2, "0") }} /</span> {{ col.title }}
            </h2>
            <a v-for="l in col.links" :key="l.label" :href="l.href" class="label"
              >{{ l.label
              }}<span v-if="l.n" class="foot-n"
                ><span class="sr-only">, </span>{{ l.n }}<span class="sr-only"> sections</span></span
              ></a
            >
          </nav>
        </div>
        <div aria-hidden="true" class="foot-mark">
          <LineWordmark />
        </div>
        <p class="foot-copy label">
          <span>© {{ new Date().getFullYear() }} dither-ui.com</span>
          <span>v{{ version }}</span>
          <span>MIT license</span>
        </p>
      </footer>
    </DitherScreen>
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

/* The footer, printed: inside the page's column, a poster band, then a
   grid ruled in hairlines (the brand's cell beside the three numbered
   link columns), the line-screen wordmark under all, and the imprint on
   the raised ground. Three columns under the brand under 900px, two under
   640px. */
.foot {
  width: min(100%, var(--page));
  margin-inline: auto;
  padding-inline: 1.5rem;
}

.foot-poster {
  position: relative;
  height: 160px;
  border-block: 1px solid var(--ink);
}

.foot-in {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--ink);
}

.foot-brand,
.foot-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 32px 24px 36px;
}

.foot-brand {
  gap: 12px;
  padding-left: 0;
}

.foot-col {
  gap: 2px;
  border-left: 1px solid var(--ink);
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
  color: var(--ink-3);
  transition: color 150ms var(--ease-settle);
}

.foot-h {
  margin: 0 0 10px;
  color: var(--ink-3);
}

.foot-no {
  font-variant-numeric: tabular-nums;
}

.foot-col a {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-height: 28px;
  padding-top: 6px;
  color: var(--ink);
  transition: color 150ms var(--ease-settle);
}

.foot-n {
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}

.foot-col a:hover,
.foot-gh:hover {
  color: var(--signal);
}

/* The wordmark: the column's full width, ruled off under it. */
.foot-mark {
  padding: 40px 0;
  border-bottom: 1px solid var(--ink);
}

/* The imprint: the copyright line on the raised ground at the foot. */
.foot-copy {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 28px;
  margin: 0 0 40px;
  padding: 12px 16px;
  color: var(--ink-3);
  background: var(--surface);
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
    border-bottom: 1px solid var(--ink);
  }
  .foot-col:nth-child(2) {
    border-left: 0;
    padding-left: 0;
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
  .foot {
    padding-inline: 16px;
  }
  .foot-in {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .foot-col:nth-child(4) {
    grid-column: 1 / -1;
    border-left: 0;
    padding-left: 0;
    border-top: 1px solid var(--ink);
  }
}
</style>
