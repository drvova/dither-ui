<script setup lang="ts">
// The landing, printed in the dark, always: one bone ink on obsidian, the
// kit's art the only colour on it. The hero (the statement beside the
// stage, seated on a poster the kit prints), then sections under a title
// with a lead beside it: a bento of live kit components, the screen an
// agent's ask makes, what's inside (the kit, the Studio, the bridge; the
// docs' families) and the install, with a plate of the brand small in a
// wide field between them, and a footer of the brand and link columns on the
// kit's light trails, the line-screen wordmark printed over them. Michroma for display, mono for the rest; everything
// that moves is the kit.
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue"
import {
  DitherAvatar,
  DitherCircuit,
  DitherClipboard,
  DitherGradient,
  DitherHeatTrail,
  DitherIcon,
  DitherReveal,
  DitherScreen,
  type PixelColor,
  type ScreenKind,
} from "@dither-kit"
import { assetPath, routePath, vRise } from "@/shared/lib"
import ToolMark from "@/shared/ui/ToolMark.vue"
import RiseWords from "./RiseWords.vue"
import "@/shared/fonts/display.css"
import "./chapters.css"
import { version } from "../../../package.json"
import AgentStory from "./AgentStory.vue"
import Examples from "./Examples.vue"
import { useDrive } from "./drive"
import { RUNTIME_DEPS, SPECS } from "./facts"
import { DOCS_FAMILIES, SECTION_COUNT } from "./hub"

// The five biggest families, biggest first (the footer keeps the docs' order).
const BIGGEST = [...DOCS_FAMILIES].sort((a, b) => b.count - a.count)
import InstallBlock from "./InstallBlock.vue"
import LineWordmark from "./LineWordmark.vue"
import PixelWord from "./PixelWord.vue"
import Plate from "./Plate.vue"
import WorksWith from "./WorksWith.vue"
import BrandBuild from "./BrandBuild.vue"
import { BUILD_CELLS } from "./build"
import { STAGINGS } from "./brand"
import BrandGather from "./BrandGather.vue"
import BrandMark from "@/shared/ui/BrandMark.vue"
import MascotCar from "@/shared/ui/MascotCar.vue"
import { SiteHeader } from "@/widgets/site-header"
import { PLATES, RAMP, STOCK, TRAIL } from "./plate"
import { ROAD, ROAD_SHADER, WORDMARK } from "./road"
import { CLOSE } from "./heat"
import HeatPrint from "./HeatPrint.vue"
import Showcase from "./Showcase.vue"

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

/** How long the bridge's board runs by itself as its card comes into view. */
const BOARD_DANCE = 3000

// What's inside: the kit, the Studio and the bridge, each a card headed by a
// strip the kit prints in its own ink through its own printer's screen
// (blue in Bayer cells, the ember in lines, bone in a halftone dot): a tone
// for the kit and the Studio, a circuit board for the bridge, its signals
// running between the tab and the agent in the ember; its own
// character (the kit's seeded avatar of its title, in its ink) standing on
// the strip's foot, its name in the pixel face, two lines and its link.
const INSIDE: {
  title: string
  name: string
  ink: PixelColor
  screen: ScreenKind
  /** What the strip prints: a tone from the ink, or a board in it. */
  art: "tone" | "circuit"
  text: string
  link: { label: string; href: string }
}[] = [
  {
    title: "The kit",
    name: "kit",
    ink: "blue",
    screen: "bayer",
    art: "tone",
    text: "Plain source you own, one engine of rasters and a seekable clock under every component. Change anything, it's yours.",
    link: { label: "Read the quick start", href: routePath("/docs/getting-started") },
  },
  {
    title: "The Studio",
    name: "studio",
    ink: "orange",
    screen: "line",
    art: "tone",
    text: "An infinite canvas to play with screens of kit parts. Export a frame as Vue, a PNG or an MP4, then go again.",
    link: { label: "Open the studio", href: routePath("/studio") },
  },
  {
    title: "The agent bridge",
    name: "bridge",
    ink: "#e4e1d8",
    screen: "dot",
    art: "circuit",
    text: "A SKILL.md teaches your agent the Studio, and one Node file starts the harness you already use, signed in as you.",
    link: { label: "Read the agent skill", href: assetPath("/agent/SKILL.md") },
  },
]

// The footer's ground (`road.ts`), loaded with it. It dances by itself for
// `ROAD.dance` as the road comes into view, once the footer's brand is home,
// then moves only while the reader moves the page (a scroll, a pointer
// across the footer) and settles as they stop: under five seconds on its
// own, so it carries no pause. It holds while the brand forms (one moving
// layer at a time).
const DitherShader = defineAsyncComponent(() => import("@dither-kit/tailwind/DitherShader.vue"))
const footStill = ref(true)
const { driven, drive, running } = useDrive()
const road = ref<HTMLElement | null>(null)
// The bridge's board (What's inside) runs the same way: its signals run as
// its card comes into view, then only while the reader moves the page.
const board = useDrive()
// The close's heat drifts as its band arrives, then only under the hand.
const heat = useDrive()
const closeBand = ref<HTMLElement | null>(null)
let closeSeen: IntersectionObserver | null = null
const boardCard = ref<HTMLElement | null>(null)
let boardInView = false
// A scroll drives only what is on screen: the road off screen stays still
// (driving it from anywhere ran the car's loop through the whole page).
let roadNear = false
const scrolled = () => {
  if (roadNear) drive()
  if (boardInView) board.drive()
}
// The dance, once per time the road comes into view, waiting for the brand.
let inView = false
let danced = false
function dance() {
  if (!inView || danced || !footStill.value) return
  danced = true
  drive(ROAD.dance)
}
// A brand that starts forming mid-dance takes the stage; the dance comes
// back once it is home.
function forming() {
  footStill.value = false
  if (running()) danced = false
}
function homed() {
  footStill.value = true
  dance()
}
// The mascot's car on the road: it drives exactly while the art moves (the
// dance, then the reader's scroll or pointer), so the reader drives it, and
// parks as the art settles; under reduced motion it stays parked. Its
// wheels stand on the wordmark's top; it leaves at the right of the
// wordmark's box and comes back in at its left.
const car = ref<HTMLElement | null>(null)
// One row of the wordmark's screen below its ink's top: the first rows are
// hairlines, so the wheels stand where the letters read solid.
const carBottom = (1 - (WORDMARK.TOP + (WORDMARK.BASE - WORDMARK.TOP) / WORDMARK.ROWS) / WORDMARK.H) * 100
const carX = ref(0)
const CAR_SPEED = 0.16 // px a ms
let carRaf = 0
let carLast = 0
// The road's width and the car's, kept by a ResizeObserver: read in the
// frame loop they forced a layout every frame of the drive.
let roadWidth = 0
let carWidth = 0
let carSizes: ResizeObserver | null = null
const carStill = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
function roll(now: number) {
  const dt = Math.min(64, now - carLast)
  carLast = now
  carX.value += dt * CAR_SPEED
  if (carX.value > roadWidth) carX.value = -carWidth
  carRaf = driven.value && footStill.value ? requestAnimationFrame(roll) : 0
}
watch(
  () => driven.value && footStill.value,
  (moving) => {
    if (!moving || carRaf || carStill()) return
    carLast = performance.now()
    carRaf = requestAnimationFrame(roll)
  },
)
let seen: IntersectionObserver | null = null
let boardSeen: IntersectionObserver | null = null
onMounted(() => {
  addEventListener("scroll", scrolled, { passive: true })
  if (typeof IntersectionObserver === "undefined") return
  if (boardCard.value) {
    boardSeen = new IntersectionObserver(
      ([entry]) => {
        const was = boardInView
        boardInView = !!entry?.isIntersecting
        if (boardInView && !was) board.drive(BOARD_DANCE)
      },
      { threshold: 0.5 },
    )
    boardSeen.observe(boardCard.value)
  }
  if (closeBand.value) {
    closeSeen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        heat.drive(CLOSE.drift)
        closeSeen?.disconnect()
      },
      { threshold: 0.25 },
    )
    closeSeen.observe(closeBand.value)
  }
  if (!road.value) return
  seen = new IntersectionObserver(
    ([entry]) => {
      roadNear = !!entry?.isIntersecting
      inView = roadNear && entry.intersectionRatio >= 0.5
      if (inView) dance()
      else danced = false
    },
    { threshold: [0, 0.5] },
  )
  seen.observe(road.value)
  if (car.value && typeof ResizeObserver !== "undefined") {
    const track = car.value.parentElement
    carSizes = new ResizeObserver(() => {
      roadWidth = track?.clientWidth ?? 0
      carWidth = car.value?.offsetWidth ?? 0
    })
    if (track) carSizes.observe(track)
    carSizes.observe(car.value)
  }
})
onBeforeUnmount(() => {
  cancelAnimationFrame(carRaf)
  removeEventListener("scroll", scrolled)
  seen?.disconnect()
  carSizes?.disconnect()
  boardSeen?.disconnect()
  closeSeen?.disconnect()
})

// The footer's columns.
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
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
    links: DOCS_FAMILIES.map((f) => ({ label: f.label, href: routePath(`/docs/${f.first}`) })),
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
  <div class="landing isolate flex min-h-screen flex-col bg-background text-foreground antialiased">
    <!-- The pointer prints on the whole page's ground, every section's:
         pinned to the viewport, the print scrolling with the page. -->
    <DitherHeatTrail pinned class="page-trail" v-bind="TRAIL" :cell="4" />
    <!-- Skip link: first focusable element, jumps to the single main landmark. -->
    <a
      href="#main"
      class="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-ring focus:bg-background focus:px-4 focus:py-2 focus:text-xs"
    >
      Skip to content
    </a>

    <SiteHeader current="landing" />

    <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
      <!-- The hero, our own: the statement beside the stage, seated on a
           poster the kit prints. -->
      <Showcase />

      <div class="page">
        <Examples />

        <Plate :plate="PLATES.afterExamples" />

        <!-- The build: the brand itself, cell by cell, raised by the world
             engine as the page scrolls past it. -->
        <section id="build" aria-labelledby="build-h" class="sec">
          <div v-rise class="sec-head">
            <h2 id="build-h" class="section-title"><RiseWords text="Built from the wire up." /></h2>
            <div class="sec-side">
              <p data-rise class="sec-lede">
                Our mark and name in {{ BUILD_CELLS }} cells, each one a block,
                <span class="lede-key">raised by the kit's world engine as you scroll</span>: the floor first, then each
                cell landing hot on it and cooling to metal. Keep going and it comes apart. Point at it and the cells
                lean away.
              </p>
              <a data-rise :href="routePath('/docs/world')" class="more-link">See the world engine</a>
            </div>
          </div>
          <BrandBuild />
        </section>

        <!-- Ask: one agent session, played as the page scrolls past it. -->
        <section id="ask" aria-labelledby="ask-h" class="sec">
          <div v-rise class="sec-head">
            <h2 id="ask-h" class="section-title"><RiseWords text="Your agent builds the screen." /></h2>
            <div class="sec-side">
              <p data-rise class="sec-lede">
                Hand your coding agent the skill file and ask for a screen.
                <span class="lede-key">Each tool call lands on the canvas as a frame of kit parts</span>, and undo takes
                it back when it gets ideas.
              </p>
              <a data-rise :href="assetPath('/agent/SKILL.md')" class="more-link">Read the agent skill</a>
            </div>
          </div>
          <AgentStory />
        </section>

        <!-- What's inside: the kit, the Studio, the bridge; then the docs'
             big families, each with its size and a line. -->
        <section id="inside" aria-labelledby="inside-h" class="sec">
          <div v-rise class="sec-head">
            <h2 id="inside-h" class="section-title"><RiseWords text="Three parts, one engine." /></h2>
            <div class="sec-side">
              <p data-rise class="sec-lede">
                A toolkit you copy into your repo, a Studio to play in, and a bridge to the coding agent you already
                trust. <span class="lede-key">No black boxes: all of it is code you can read.</span>
              </p>
            </div>
          </div>
          <ul v-rise class="inside">
            <li
              data-rise
              v-for="c in INSIDE"
              :key="c.title"
              :ref="(el) => c.art === 'circuit' && (boardCard = el as HTMLElement)"
            >
              <DitherScreen :screen="c.screen">
                <DitherReveal class="inside-art" :duration="0.72" easing="glide" aria-hidden="true">
                  <DitherCircuit
                    v-if="c.art === 'circuit'"
                    :ink="c.ink"
                    :seed="11"
                    :density="1"
                    :pitch="3"
                    :paused="!board.driven.value"
                  />
                  <DitherGradient v-else :from="c.ink" :to="STOCK" direction="down" :cell="4" />
                </DitherReveal>
              </DitherScreen>
              <span class="inside-who" aria-hidden="true"
                ><DitherAvatar :name="c.title" :color="c.ink" :size="56"
              /></span>
              <h3 class="inside-h">
                <PixelWord :text="c.name" :cell="5" /><span class="sr-only">{{ c.title }}</span>
              </h3>
              <p class="inside-p">{{ c.text }}</p>
              <a :href="c.link.href" class="more-link">{{ c.link.label }}</a>
            </li>
          </ul>
          <div v-rise class="families">
            <h3 data-rise class="families-h">{{ SECTION_COUNT }} docs sections, the five biggest families</h3>
            <ul class="families-list">
              <li v-for="f in BIGGEST" :key="f.label" data-rise>
                <a :href="routePath(`/docs/${f.first}`)" class="family-t"
                  ><span class="family-n">{{ f.count }}<span class="family-u"> sections</span></span
                  ><span class="family-l">{{ f.label }}</span></a
                >
                <p class="family-p">{{ f.note }}</p>
              </li>
            </ul>
          </div>
        </section>

        <!-- The second plate: the heat builds up through the page to the
             close (plate.ts). -->
        <Plate :plate="PLATES.afterParts" />

        <!-- What the kit meets on the reader's side. -->
        <WorksWith />
      </div>

      <!-- The close: the install in a clear field inside a print of heat,
           the footer's own ramp (close.ts), its foot cut flat where the
           footer rises into it through one tab. -->
      <section
        id="install"
        ref="closeBand"
        aria-labelledby="install-h"
        class="close"
        :style="{ '--reach': `${CLOSE.reach}px` }"
        @pointermove="heat.drive()"
      >
        <HeatPrint :paused="!heat.driven.value" />
        <div class="sec install">
          <div v-rise class="install-head">
            <h2 id="install-h" class="section-title"><RiseWords text="Copy one folder. Every pixel is yours." /></h2>
            <p data-rise class="sec-lede">
              Copy the kit into your app, add its {{ RUNTIME_DEPS.length }} packages and import from
              <code>@dither-kit</code>.
              <span class="lede-key">Or paste the agent prompt and your agent does all three.</span>
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
          <dl v-rise class="sheet" aria-label="The kit in brief">
            <div v-for="s in SPECS" :key="s.label" data-rise class="sheet-row">
              <dt>{{ s.label }}</dt>
              <dd>{{ s.value }}</dd>
            </div>
          </dl>
        </div>
        <span aria-hidden="true" class="close-tab" />
      </section>
    </main>

    <!-- Footer: on the kit's art, the brand and a line beside three link
         columns, the copyright line and the road the trails sweep across,
         the line-screen wordmark printed over its foot. -->
    <footer class="foot" @pointermove="drive()">
      <div class="foot-art">
        <div aria-hidden="true" class="foot-ground">
          <DitherShader
            :source="ROAD_SHADER"
            :colors="RAMP"
            :seed="3"
            :cell="ROAD.cell"
            :dpr="1"
            :interactive="false"
            :paused="!driven || !footStill"
            label="Light trails"
          />
        </div>
        <div class="foot-in">
          <div class="foot-brand">
            <a :href="routePath('/')" class="foot-name"
              ><BrandGather class="foot-lockup" :scene="STAGINGS.foot" @moving="forming" @settled="homed" /><span
                class="sr-only"
                >dither-ui</span
              ></a
            >
            <p class="foot-line">
              A dithered UI toolkit, a Studio to play in and a skill for your agent. Printed one cell at a time.
            </p>
            <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="foot-gh"
              ><ToolMark id="github" :size="13" />GitHub<span class="sr-only"> (opens in a new tab)</span></a
            >
          </div>
          <nav v-for="col in COLUMNS" :key="col.title" class="foot-col" :aria-label="col.title">
            <h2 class="foot-h">{{ col.title }}</h2>
            <a v-for="l in col.links" :key="l.label" :href="l.href">{{ l.label }}</a>
          </nav>
        </div>
        <p class="foot-copy">
          <span>© {{ new Date().getFullYear() }} dither-ui.com</span>
          <span>v{{ version }}</span>
          <span>MIT license</span>
        </p>
        <div ref="road" class="foot-road" :style="{ '--road': ROAD.aspect, '--road-narrow': ROAD.narrowAspect }">
          <BrandMark
            :size="84"
            class="road-mark"
            :style="{ left: `${ROAD.mark[0] * 100}%`, bottom: `${ROAD.mark[1] * 100}%` }"
          />
          <div aria-hidden="true" class="foot-mark">
            <div class="mark-box">
              <LineWordmark />
              <div ref="car" class="road-car" :style="{ translate: `${carX}px 0`, bottom: `${carBottom}%` }">
                <MascotCar :size="56" :driving="driven && footStill" class="road-car-art" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* The pointer's print, on the page's ground under every section: fixed to
   the viewport, painted only while something cools (the kit's heat trail,
   `pinned`). The landing is its own stacking context, so it lies over the
   ground and under everything else. */
.page-trail {
  position: fixed;
  inset: 0;
  z-index: -1;
}

/* One wide page width for the hero, the sections and the footer, one
   rhythm between sections. The page is the theme's own
   background. */
.landing {
  --page: 80rem;
  --rhythm: 40px;
  /* The header's height, read by whatever must sit clear of it. */
  --head: 64px;
}

/* The sections, on the page width with the rhythm between them. */
.page {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rhythm) * 3.5);
  width: min(100%, var(--page));
  margin-inline: auto;
  padding: calc(var(--rhythm) * 2) 24px 0;
}

.sec {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* What's inside: three cards, the raised ground like the bento's, each a
   tone strip over its title, two lines and its link. */
.inside {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.inside > li {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  overflow: hidden;
  padding: 0 24px 24px;
  border-radius: 20px;
  background: var(--surface);
}

/* The strip: flush to the card's top and sides. */
.inside-art {
  position: relative;
  align-self: stretch;
  height: 120px;
  margin: 0 -24px 8px;
}

.inside-art > :first-child {
  position: absolute;
  inset: 0;
}

/* The character: on the strip's foot, half over the card, like a mascot
   stepping out of its picture, on a plate of the card's ground so its own
   ink never melts into the strip's. */
.inside-who {
  position: absolute;
  top: calc(120px - 42px);
  right: 18px;
  padding: 6px;
  border-radius: 14px;
  background: var(--surface);
}

/* The name, chunky in the pixel face. */
.inside-h {
  display: flex;
  margin: 4px 0 0;
  color: var(--ink);
}

.inside-p {
  flex: 1;
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--ink-3);
  text-wrap: pretty;
}

/* The families: five columns, each its size as a big figure over its
   name (the docs link), a line. */
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
  flex-direction: column;
  gap: 4px;
  color: var(--ink);
  transition: color 150ms var(--ease-settle);
}

.family-t:hover {
  color: var(--signal);
}

.family-n {
  font-size: 2.4rem;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* The figure's unit beside it: these count docs sections, not the kit's
   components (the bento's figure). */
.family-u {
  font-size: 12px;
  font-weight: 400;
  color: var(--ink-3);
}

.family-l {
  font-size: 13px;
}

.family-p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
  text-wrap: pretty;
}

/* The close: a full-width band, its foot padded by the heat's reach
   (`--reach`, `CLOSE.reach`) plus air so no ink lands under a word; the
   heat its ground, open at the top where the page runs into it. */
.close {
  position: relative;
  isolation: isolate;
  padding: calc(var(--rhythm) * 4) 24px calc(var(--reach) + var(--rhythm) * 1.5);
}

/* The one joint: the footer's ground rises into the heat's flat foot as a
   tab on the page's axis, its shoulders rounded and its base flowing into
   the ground through two concave fillets. */
.close-tab {
  --r: 16px;
  position: absolute;
  bottom: 0;
  left: 50%;
  width: clamp(120px, 28vw, 224px);
  height: 40px;
  translate: -50% 0;
  border-radius: var(--r) var(--r) 0 0;
  background: var(--background);
}

.close-tab::before,
.close-tab::after {
  content: "";
  position: absolute;
  bottom: 0;
  width: var(--r);
  height: var(--r);
}

.close-tab::before {
  right: 100%;
  background: radial-gradient(circle at 0 0, transparent var(--r), var(--background) calc(var(--r) + 0.5px));
}

.close-tab::after {
  left: 100%;
  background: radial-gradient(circle at 100% 0, transparent var(--r), var(--background) calc(var(--r) + 0.5px));
}

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
  width: min(100%, 52rem);
  margin: 8px auto 0;
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
  white-space: nowrap;
}

/* The footer: the brand (the lockup, a line, GitHub) beside three
   link columns, the copyright line, the line-screen wordmark under all.
   Three columns under the brand under 900px, two under 640px. */
.foot {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

/* The art under the whole footer: the shader fills it, behind everything
   in it, the wordmark included. A container, so the road tells the narrow
   layout by the same width the shader does. */
.foot-art {
  position: relative;
  container-type: inline-size;
}

.foot-ground {
  position: absolute;
  inset: 0;
  z-index: -1;
}

/* The road: the footer's width, its height a share of it (`ROAD.aspect`),
   from the copyright line to the page's foot; the diamond standing where
   the shader runs the trails through, the wordmark printed over its foot
   with the trails sweeping behind it. */
.foot-road {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / var(--road);
  margin-top: 24px;
}

/* `ROAD.narrow`, held to it by tests/landing-facts.spec.ts. */
@container (width < 640px) {
  .foot-road {
    aspect-ratio: 1 / var(--road-narrow);
  }
}

.road-mark {
  position: absolute;
  width: clamp(42px, 6cqi, 92px);
  height: auto;
  translate: -50% 50%;
  color: var(--ink);
}

/* The mascot's car runs along the wordmark's top, its wheels on the
   letters' ink (`WORDMARK.TOP` of the word's own box). */
.mark-box {
  position: relative;
}
.road-car {
  position: absolute;
  left: 0;
  color: var(--ink);
}
.road-car-art {
  display: block;
  height: clamp(48px, 6.4cqi, 104px);
  width: auto;
}

/* Positioned: the brand's field is the page's column. */
.foot-in {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  gap: 32px;
  width: 100%;
  max-width: var(--page);
  margin-inline: auto;
  /* Clear of the floating header where the page comes to rest, the
     footer's top row at the viewport's top. */
  padding: calc(var(--head) + 40px) 1.5rem 24px;
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

.foot-lockup {
  position: relative;
}

/* The footer's words lie on the page's own ground, so the art's grain
   passes behind them whole and no speck lands on a letter (as the
   wordmark lies on its word). Unseen: the ground is the page's. */
.foot-line,
.foot-gh,
.foot-h,
.foot-col a,
.foot-copy > span {
  background: var(--background);
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

/* The wordmark: the page's full width, on its edges, at the road's foot. */
.foot-mark {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  max-width: var(--page);
  margin-inline: auto;
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
  /* A lone last family takes the whole row: no dead cell beside it. */
  .families-list li:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
  .inside-art {
    height: 72px;
  }
  .inside-who {
    top: calc(72px - 42px);
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
    padding-inline: 16px;
  }
}
</style>
