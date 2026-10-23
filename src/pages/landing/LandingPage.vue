<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue"
import {
  DitherAvatar,
  DitherBadge,
  DitherButton,
  DitherGradient,
  DitherProgress,
  DitherSlider,
  DitherSwitch,
  Sparkline,
} from "@dither-kit"
import { assetPath, routePath } from "@/shared/lib"
import "./chapters.css"
import { version } from "../../../package.json"
import EngravedWordmark from "./EngravedWordmark.vue"
import EssayFigure from "./EssayFigure.vue"
import Hub from "./Hub.vue"
import InstallBlock from "./InstallBlock.vue"
import PixelWord from "./PixelWord.vue"
import Showcase from "./Showcase.vue"
import { createDitherField, type DitherField } from "./dither-field"
import { createPixelShake, type PixelShake } from "./pixel-shake"
import { FACTS } from "./facts"
import { seedFor } from "./genome"
import { SKY } from "./plates"

// The harnesses `bridge/dither-bridge.mjs` knows (its HARNESSES), in its order.
const HARNESSES = ["Claude Code", "Codex", "Gemini CLI", "Qwen Code", "oh-my-pi", "Goose", "OpenCode", "Auggie"]

// The hero's live components: one switch, one seed the slider drives and
// the badge wears, one series for the sparkline.
const dither = ref(true)
const seed = ref(512)
const SPARK = [46, 52, 49, 58, 64, 61, 72, 78, 74, 86, 92, 88]

// The footer's link columns.
const FOOTER = [
  {
    title: "Product",
    links: [
      { label: "Docs", href: routePath("/docs") },
      { label: "Studio", href: routePath("/studio") },
      { label: "Quick start", href: routePath("/docs/getting-started") },
      { label: "Charts", href: routePath("/docs/area") },
      { label: "Surfaces", href: routePath("/docs/aurora") },
    ],
  },
  {
    title: "Handbook",
    links: [
      { label: "Styling", href: routePath("/docs/styling") },
      { label: "Seeds", href: routePath("/docs/seeds") },
      { label: "Animation", href: routePath("/docs/motion") },
      { label: "Accessibility", href: routePath("/docs/accessibility") },
    ],
  },
  {
    title: "Agents",
    links: [
      { label: "Agent skill", href: assetPath("/agent/SKILL.md") },
      { label: "llms.txt", href: assetPath("/llms.txt") },
      { label: "GitHub", href: "https://github.com/drvova/dither-ui", external: true },
    ],
  },
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
// Memory: a returning visitor gets the settled page — the entrance
// choreography (reveals, grain fade-in) plays once
// per browser, then the page simply is. Figures that play on scroll-in
// (plates, wordmark) are unaffected: they are motion, not an entrance.
const SEEN_KEY = "dither-landing-seen"
const returning = ref(false)

const stageEls = ref<HTMLElement[]>([])
const softEls = ref<HTMLElement[]>([])
const pageEl = ref<HTMLElement | null>(null)
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
  try {
    returning.value = localStorage.getItem(SEEN_KEY) === "1"
    localStorage.setItem(SEEN_KEY, "1")
  } catch {
    returning.value = false
  }
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
      if (face) shakers.push(createPixelShake(face, img, { x: f.x, y: FACE_Y, w: f.w, h: FACE_H }, { radius: 18, amplitude: 6 }))
      if (emote) blit(emote, img, f.emote.x, f.emote.y, f.emote.w, f.emote.h)
    })
  }

  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

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

  // Scroll choreography (a rise, latched like the docs DemoCard): every .reveal block animates the first time it crosses into
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
  for (const sh of shakers) sh.destroy()
  shakers = []
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
    :data-returning="returning ? 'true' : undefined"
    class="landing flex min-h-screen flex-col bg-background text-foreground antialiased"
  >
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
         brand left, the page's pill nav centred, GitHub right. -->
    <header class="site-head relative z-10">
      <div class="head-row mx-auto w-full max-w-[var(--shell)] px-6">
        <a :href="routePath('/')" class="brand" aria-label="dither-ui home">
          <!-- The 7x7 dithered diamond with its ember core — crisp edges, so
               it stays a pixel shape at any zoom. -->
          <svg viewBox="0 0 7 7" width="18" height="18" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
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
          <span class="brand-name">dither-ui</span>
        </a>
        <nav class="pills" aria-label="Site">
          <a :href="routePath('/')" class="pill" aria-current="page">Home</a>
          <a :href="routePath('/docs')" class="pill">Docs</a>
          <a href="#directory" class="pill">Components</a>
          <a :href="routePath('/studio')" class="pill">Studio</a>
        </nav>
        <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="head-gh">
          GitHub<span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>

    <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
      <!-- Hero: the kit as itself — live components floating at slight
           tilts (real controls: the slider re-seeds the badge) — over one
           centred statement, its lede, two keys and the facts line. -->
      <section aria-labelledby="hero-h" class="hero mx-auto w-full px-6">
        <div class="field reveal" role="group" aria-label="Live kit components">
          <div class="float" style="--x: 6%; --y: 50%; --r: -6deg; --d: 0s">
            <DitherButton color="blue" variant="gradient">Deploy</DitherButton>
          </div>
          <div class="float tile" style="--x: 15%; --y: 8%; --r: -3deg; --d: -2s">
            <DitherSwitch v-model="dither" label="Dither" />
            <span class="tile-l">Dither</span>
          </div>
          <div class="float" style="--x: 45%; --y: 2%; --r: 4deg; --d: -4s">
            <DitherBadge :seed="seed">seed {{ seed }}</DitherBadge>
          </div>
          <div class="float tile" style="--x: 74%; --y: 6%; --r: 6deg; --d: -1s">
            <DitherAvatar name="dither-ui" :size="40" :grid="8" color="blue" />
          </div>
          <div class="float tile" style="--x: 36%; --y: 36%; --r: -2deg; --d: -3s">
            <span class="tile-l">Renders</span>
            <Sparkline :data="SPARK" color="blue" class="spark" />
          </div>
          <div class="float tile slider" style="--x: 63%; --y: 42%; --r: 3deg; --d: -5s">
            <DitherSlider v-model="seed" :min="0" :max="999" label="Seed" />
          </div>
          <div class="float" style="--x: 82%; --y: 74%; --r: -4deg; --d: -6s">
            <DitherButton color="orange" variant="solid">New frame</DitherButton>
          </div>
          <div class="float tile" style="--x: 24%; --y: 76%; --r: -4deg; --d: -2.5s">
            <span id="hero-build" class="tile-l">Build</span>
            <DitherProgress :value="64" aria-labelledby="hero-build" class="progress" />
          </div>
        </div>
        <h1 id="hero-h" class="hero-h reveal" style="--reveal-delay: 60ms">A dithered UI toolkit for Vue.</h1>
        <p class="hero-lede reveal" style="--reveal-delay: 120ms">
          Charts, controls and surfaces, rendered pixel by pixel from one seeded palette —
          for Vue 3 or Svelte 5, in Tailwind, CSS, CSS Modules or StyleX.
        </p>
        <div class="hero-keys reveal" style="--reveal-delay: 180ms">
          <a :href="routePath('/studio')" class="btn btn-primary">Open the studio</a>
          <a :href="routePath('/docs')" class="btn">Read the docs</a>
        </div>
        <p class="hero-facts reveal" style="--reveal-delay: 220ms">
          <template v-for="(f, i) in FACTS" :key="f.label"><span v-if="i" aria-hidden="true"> · </span>{{ "text" in f ? f.text : f.value }} {{ f.label }}</template>
        </p>
      </section>

      <!-- Install: the docs install story on one line. -->
      <InstallBlock class="install" />


      <!-- Inside the kit: the films, the 3D raster, a chart and the
           portraits in framed previews. Six moods in the last frame — hover a
           face: her pixels scatter under the cursor and settle, and her
           emote answers. Then the directory. -->
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

      <!-- The essay: six numbered statements that light up as you scroll.
           The index rail (01–06) turns ember and takes a rule on the in-focus one. -->
      <section aria-label="What the kit does" class="essay-wrap mx-auto w-full max-w-5xl px-6 pb-[var(--section)]">
        <!-- The figure: a 24x24 lattice that re-dithers itself into the
             active statement's scene, sticky beside the column at lg. -->
        <div class="essay-fig">
          <EssayFigure :stage="activeIdx" />
        </div>
        <div class="essay-col">
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
        </div>
      </section>

      <!-- The works-with strip: the agent harnesses the bridge knows, as
           the Studio's own harness picker shows them (a chip with its LED)
           over the dot sea — every one drives the Studio as the user's own
           signed-in process. -->
      <section class="bleed" aria-labelledby="harness-h">
        <canvas ref="bandCanvas" aria-hidden="true" class="band-field"></canvas>
        <div class="harness mx-auto w-full max-w-[var(--shell)] px-6">
          <h2 id="harness-h" class="harness-h">Drives with your agent</h2>
          <ul class="harness-list">
            <li v-for="h in HARNESSES" :key="h" class="harness-chip"><i aria-hidden="true"></i>{{ h }}</li>
          </ul>
          <a :href="assetPath('/agent/SKILL.md')" class="harness-a">Agent skill<span aria-hidden="true">›</span></a>
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
        class="soft mx-auto w-full max-w-[var(--shell)] px-6 pt-14 pb-6 text-[13px] text-muted-foreground"
      >
        <div class="foot">
          <div class="foot-brand">
            <PixelWord text="DITHER-UI" :cell="3" :seam="1 / 3" class="mb-6 text-foreground" />
            <p class="foot-h">A dithered UI toolkit for Vue.</p>
            <p class="mt-2 max-w-[24rem] leading-[1.6]">Charts, controls and surfaces, pixel by pixel, from one seeded palette.</p>
          </div>
          <nav v-for="col in FOOTER" :key="col.title" class="foot-col" :aria-label="col.title">
            <p class="foot-t">{{ col.title }}</p>
            <ul>
              <li v-for="l in col.links" :key="l.label">
                <a
                  :href="l.href"
                  class="foot-a"
                  v-bind="l.external ? { target: '_blank', rel: 'noreferrer' } : {}"
                  >{{ l.label }}<span v-if="l.external" aria-hidden="true">↗</span></a
                >
              </li>
            </ul>
          </nav>
        </div>
        <p class="foot-meta">
          <span>dither-ui.com</span><span aria-hidden="true">·</span>
          <span>© {{ new Date().getFullYear() }}</span><span aria-hidden="true">·</span>
          <span class="tabular-nums">v{{ version }} · MIT</span><span aria-hidden="true">·</span>
          <a href="https://clayzo.com" target="_blank" rel="noreferrer" class="transition-colors hover:text-foreground"
            >Films made with Clayzo<span aria-hidden="true"> ↗</span></a
          >
        </p>
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
   first time they cross into view (a rise, latched like the DemoCard).
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

/* Returning visitors: no entrance. The reveal blocks sit visible from the
   first frame. */
.landing[data-returning] .reveal,
.landing[data-returning] .reveal:not([data-seen]) {
  animation: none;
  opacity: 1;
}

/* One shell width for header, stage, chapters and footer, and ONE vertical
   rhythm between sections — children read both through inheritance, so
   every gap on the page is the same breath (never a sum of two paddings). */
.landing {
  --shell: 72rem;
  --section: clamp(5rem, 9vw, 8rem);
  /* A soft near-black under the art; hairlines a step up. */
  --background: #0a0a0b;
  --border: #24262b;
}

/* The bar: brand left, the pill nav centred, GitHub right. The pills are
   the page's nav idiom — the page you are on sits in a soft pill. */
.head-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 72px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-self: start;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.pills {
  display: flex;
  gap: 2px;
}

.pill {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--ink-2);
  transition:
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.pill:hover {
  color: var(--ink);
}

.pill[aria-current="page"] {
  color: var(--ink);
  background: var(--surface-2);
}

.head-gh {
  display: inline-flex;
  gap: 4px;
  justify-self: end;
  font-size: 0.9375rem;
  color: var(--ink-2);
}

.head-gh:hover {
  color: var(--ink);
}

@media (max-width: 639px) {
  .brand-name,
  .head-gh {
    display: none;
  }
  .pill {
    padding: 0 9px;
    font-size: 0.875rem;
  }
}

/* The hero: the field of live components, then one centred statement. */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 60rem;
  padding-top: clamp(2.5rem, 6vw, 4.5rem);
  text-align: center;
}

/* The field: each component on its own spot and tilt (--x, --y, --r),
   bobbing on its own phase (--d). Under 700px the field is a wrapped row. */
.field {
  position: relative;
  width: 100%;
  height: 22rem;
}

.float {
  position: absolute;
  left: var(--x);
  top: var(--y);
  transform: rotate(var(--r));
}

@media (prefers-reduced-motion: no-preference) {
  .float {
    animation: bob 7s ease-in-out var(--d) infinite alternate;
  }
  @keyframes bob {
    to {
      transform: translateY(-7px) rotate(var(--r));
    }
  }
}

.tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface-2);
  box-shadow:
    inset 0 0 0 1px var(--line),
    0 14px 30px -12px rgb(0 0 0 / 0.8);
}

.tile-l {
  font-size: 0.8125rem;
  color: var(--ink-2);
}

.spark {
  width: 120px;
  height: 32px;
}

.slider {
  width: 13rem;
}

.slider > * {
  flex: 1;
}

.progress {
  width: 9rem;
}

@media (max-width: 699px) {
  .field {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 14px;
    height: auto;
    padding-bottom: 8px;
  }
  .float {
    position: static;
  }
}

.hero-h {
  margin: clamp(1.5rem, 4vw, 2.5rem) 0 0;
  font-size: clamp(2rem, 4.4vw, 2.75rem);
  font-weight: 500;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: var(--ink);
  text-wrap: balance;
}

.hero-lede {
  max-width: 34rem;
  margin: 14px 0 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ink-2);
  text-wrap: balance;
}

.hero-keys {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 26px;
}

.hero-facts {
  margin: 22px 0 0;
  font-size: 0.8125rem;
  color: var(--ink-3);
}

/* The install line under the hero, in the column. */
.install {
  max-width: calc(var(--column) + 3rem);
  margin-top: clamp(2.5rem, 6vw, 4rem);
}

/* The footer: the statement left, three link columns right; stacked on
   phones. Links keep 28px hit areas. */
.foot {
  display: grid;
  gap: 2.5rem 2rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.foot-brand {
  grid-column: 1 / -1;
}

@media (min-width: 900px) {
  .foot {
    grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  }
  .foot-brand {
    grid-column: auto;
  }
}

.foot-col ul {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.foot-a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.foot-a:hover {
  color: var(--color-foreground);
}

.foot-h {
  margin: 0;
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.foot-t {
  margin: 0 0 14px;
  font-size: 0.8125rem;
  color: var(--ink-3);
}

.foot-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin: 3.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--ink-3);
}

/* The essay. Values measured from the reference: line clamp 16→46px,
   -0.03em tracking, 1.05 leading, 0.52s lit transition with the
   cubic-bezier(0.22, 1, 0.36, 1) settle; index 10px, 0.1em tracking. The
   in-focus index turns ember and takes a 2px ember rule — a quiet mark,
   where the old 1.55x spring read playful against the calmer hero. */
/* Statements left, the figure right (sticky, centred in the viewport)
   from lg; stacked on narrow screens with the figure first, small. The
   statement column is its own size container so the type keeps sizing off
   the COLUMN (cqi), not the two-column wrap. */
.essay-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: start;
}

.essay-col {
  container-type: inline-size;
  min-width: 0;
}

.essay-fig {
  width: min(100%, 14rem);
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .essay-wrap {
    grid-template-columns: minmax(0, 1fr) 20rem;
  }
  .essay-fig {
    order: 1;
    width: 100%;
    margin: 0;
    position: sticky;
    top: calc(50vh - 11.5rem);
  }
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

/* The works-with strip: an elevated band with the dot sea breathing under
   one row — micro-caps label, the harness chips, one link. */
.bleed {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: #0f1012;
  border-block: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
}

.harness {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px 40px;
  min-height: 120px;
  padding-block: 28px;
}

.harness-h {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--ink);
}

.harness-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The Studio picker's chip: a square LED and the harness name on a soft
   pill, lifted so the dot sea never reads through the type. */
.harness-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.8125rem;
  color: var(--ink);
  background: var(--surface-2);
  box-shadow: inset 0 0 0 1px var(--line);
}

.harness-chip i {
  width: 6px;
  height: 6px;
  background: #7ba3ee;
}

.harness-a {
  display: inline-flex;
  gap: 8px;
  margin-left: auto;
  font-size: 13px;
  color: #7ba3ee;
}

.harness-a span {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.harness-a:hover span {
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .harness-a span {
    transition: none;
  }
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
