<script setup lang="ts">
// The component hub: a band with the docs catalog as a living night
// skyline (the catalog film — one window per section; the catalog plate is
// its stand-in), the hub window — the kit's own DitherTabs over shelves of
// cards that deep-link into the docs — and three numbered steps on how the
// kit is used: one import path, one protocol for agents, one file per film.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherAvatar, DitherClipboard, DitherIcon, DitherTabPanel, DitherTabs } from "@dither-kit"
import { routePath } from "@/shared/lib"
import ClayzoFilm from "./ClayzoFilm.vue"
import PixelPlate from "./PixelPlate.vue"
import { FAMILIES, SECTION_COUNT, SHELVES } from "./hub"
import { catalogPlate } from "./plates"

const CATALOG = catalogPlate(FAMILIES.map((f) => f.count))
const tab = ref("explore")
const TABS = SHELVES.map((s) => ({ value: s.value, label: s.label, badge: s.value === "explore" ? undefined : s.count }))

// The SFC the first cell shows (and copies): one import path, two kit
// components, one seed.
const SFC = `<script setup>
import { AreaChart, Area, DitherButton } from "@dither-kit"
const rows = [{ m: "Jan", v: 46 }, { m: "Feb", v: 52 }]
const config = { v: { label: "renders", color: "blue" } }
<\/script>

<template>
  <AreaChart :data="rows" :config="config" :seed="512">
    <Area data-key="v" />
  </AreaChart>
  <DitherButton color="blue">Ship it</DitherButton>
</template>`
const SFC_LINES = SFC.split("\n")

// The how-row plays once, the first time it nears the viewport (a latch,
// stripped by the prerender, so the static bytes show every line done).
const how = ref<HTMLElement | null>(null)
const live = ref(false)
let io: IntersectionObserver | null = null
onMounted(() => {
  if (typeof IntersectionObserver === "undefined" || !how.value) return
  io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      live.value = true
      io?.disconnect()
    },
    { threshold: 0.25 },
  )
  io.observe(how.value)
})
onBeforeUnmount(() => io?.disconnect())

/** Tokens for the SFC: tags and attributes in grey, strings ice, the
 * component names ember — enough to read, no highlighter shipped. */
function paint(line: string) {
  return line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/("[^"]*")/g, '<span class="tk-s">$1</span>')
    .replace(/\b(AreaChart|Area|DitherButton)\b/g, '<span class="tk-c">$1</span>')
    .replace(/\b(import|from|const)\b/g, '<span class="tk-k">$1</span>')
}
</script>

<template>
  <article id="hub" aria-labelledby="hub-h" class="chapter reveal">
    <div class="band band-tall">
      <div class="band-in">
        <h2 id="hub-h" class="band-h">
          Components<span class="dot">,</span> <span class="band-l">one cell for every section of the docs.</span>
        </h2>
        <div class="links">
          <a :href="routePath('/docs/area')" class="more">Browse components</a>
          <a :href="routePath('/docs/composition')" class="more more-quiet">Compose one</a>
        </div>
      </div>
      <ClayzoFilm
        film="catalog"
        chip
        :label="`The docs catalog as a night skyline: ${SECTION_COUNT} lit windows, one per section, in a tower per family; windows switch on and off, a beam sweeps the towers, and a new section falls onto the tallest roof.`"
        class="band-fig"
        :style="{ aspectRatio: `${CATALOG.w} / ${CATALOG.h}` }"
      >
        <template #fallback><PixelPlate :plate="CATALOG" motion="rise" fit="xMaxYMax meet" class="block size-full" /></template>
      </ClayzoFilm>
    </div>

    <div class="hub">
      <div class="hub-txt">
        <h3 class="hub-h">Component hub</h3>
        <p class="hub-p">
          {{ SECTION_COUNT }} sections, each a live demo with its props and copy-ready code. Every
          component is one file in one folder: read it, copy it, change it.
        </p>
        <a :href="routePath('/docs')" class="more">Explore the docs</a>
      </div>
      <div class="hub-frame">
        <div class="hub-win">
          <DitherTabs v-model="tab" :tabs="TABS" color="orange" class="hub-tabs">
            <DitherTabPanel v-for="s in SHELVES" :key="s.value" :value="s.value" class="hub-body">
              <p class="shelf-h">
                {{ s.value === "explore" ? "Featured" : `All ${s.label.toLowerCase()}` }}
                <span class="hub-n">{{ s.count }}</span>
                <a v-if="s.value !== 'explore'" :href="routePath(`/docs/${s.cards[0].id}`)" class="shelf-all">Show all</a>
              </p>
              <div class="cards">
                <a v-for="c in s.cards" :key="c.id" :href="routePath(`/docs/${c.id}`)" class="card">
                  <span class="card-top">
                    <span class="card-av" aria-hidden="true"><DitherAvatar :name="c.id" :size="28" :grid="6" :animate="false" color="blue" /></span>
                    <span class="card-cat">{{ c.family }}</span>
                  </span>
                  <span class="card-name">{{ c.label }}</span>
                  <span class="card-desc">{{ c.note ?? s.note }}</span>
                  <span class="card-foot">/docs/{{ c.id }}<span aria-hidden="true">›</span></span>
                </a>
              </div>
            </DitherTabPanel>
          </DitherTabs>
        </div>
      </div>
    </div>

    <div ref="how" class="cells three how" :data-live="live ? 'true' : undefined">
      <div class="cell how-cell">
        <p class="how-h"><span class="how-n">01</span>Write it<span class="how-k">Vue SFC</span></p>
        <div class="code">
          <DitherClipboard :value="SFC">
            <template #default="{ copied }">
              <button type="button" class="code-copy" :aria-label="copied ? 'Copied' : 'Copy the example'">
                <DitherIcon :name="copied ? 'Check' : 'Copy'" :size="13" :stroke-width="1.5" />
              </button>
            </template>
          </DitherClipboard>
          <ol class="code-lines">
            <!-- eslint-disable-next-line vue/no-v-html -- paint() escapes the static SFC above -->
            <li v-for="(l, i) in SFC_LINES" :key="i" v-html="paint(l) || ' '"></li>
          </ol>
        </div>
        <p class="cell-p how-p">One import path: every component is a file under <code>@dither-kit</code>.</p>
      </div>

      <div class="cell how-cell">
        <p class="how-h"><span class="how-n">02</span>Drive it<span class="how-k">ditherStudio.run</span></p>
        <div class="code term">
          <p class="t-line" style="--n: 46; --d: 0ms">
            <span class="t-p">›</span> run({ type: "chart.add", chart: "area" })
          </p>
          <p class="t-out" style="--d: 1500ms">{ ok: true, data: { id, kind: "area chart", … } }</p>
          <p class="t-line" style="--n: 40; --d: 1900ms">
            <span class="t-p">›</span> run({ type: "code.get", id, styling: "css" })
          </p>
          <p class="t-out" style="--d: 3300ms">{ ok: true, data: "&lt;script setup&gt;…" }</p>
          <p class="t-line" style="--n: 40; --d: 3700ms">
            <span class="t-p">›</span> run({ type: "video.export", id, fps: 30 })
          </p>
          <p class="t-out" style="--d: 5100ms">{ ok: true, data: { index, assets } }</p>
          <p class="t-line t-last" style="--n: 0; --d: 5500ms"><span class="t-p">›</span><span class="t-caret"></span></p>
        </div>
        <p class="cell-p how-p">One protocol: the same commands from the page, a DOM event, or your agent.</p>
      </div>

      <div class="cell how-cell">
        <p class="how-h"><span class="how-n">03</span>Ship it<span class="how-k">video.export</span></p>
        <ol class="code steps">
          <li class="step" style="--d: 0ms">
            <DitherIcon name="Image" :size="14" :stroke-width="1.5" class="step-ic" />
            <span class="step-txt"><span class="step-l">Frame</span><span class="step-v">a1 · 1040×600</span></span>
            <i class="step-dot" aria-hidden="true"></i>
          </li>
          <li class="step" style="--d: 700ms">
            <DitherIcon name="Code" :size="14" :stroke-width="1.5" class="step-ic" />
            <span class="step-txt"><span class="step-l">Composition</span><span class="step-v">video/a1/index.html</span></span>
            <i class="step-dot" aria-hidden="true"></i>
          </li>
          <li class="step" style="--d: 1400ms">
            <DitherIcon name="Play" :size="14" :stroke-width="1.5" class="step-ic" />
            <span class="step-txt"><span class="step-l">Rendered</span><span class="step-v">npx hyperframes render</span></span>
            <i class="step-dot" aria-hidden="true"></i>
          </li>
        </ol>
        <p class="cell-p how-p">One file per frame; a deterministic MP4 anywhere.</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* The hub row: words left, the window right at the golden split. */
.hub {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.618fr);
  background: #000;
}

@media (max-width: 899px) {
  .hub {
    grid-template-columns: minmax(0, 1fr);
  }
}

.hub-txt {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: clamp(1.5rem, 3.4vw, 2.125rem);
}

.hub-h {
  margin: 0;
  font-size: clamp(1.375rem, 2.2vw, 1.75rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--color-foreground);
}

.hub-p {
  max-width: 24em;
  margin: 13px 0 26px;
  font-size: clamp(0.95rem, 1.4vw, 1.0625rem);
  line-height: 1.6;
  color: var(--color-muted-foreground);
  text-wrap: pretty;
}

.hub-frame {
  min-width: 0;
  padding-top: 46px;
  overflow: hidden;
}

@media (max-width: 899px) {
  .hub-frame {
    padding-top: 0;
  }
}

.hub-win {
  height: 100%;
  background: #070707;
  border-top: 1px solid #262626;
  border-left: 1px solid #262626;
}

.hub-tabs :deep([role="tablist"]) {
  padding: 0 13px;
  border-bottom: 1px solid #202020;
  overflow-x: auto;
  scrollbar-width: none;
}

.hub-body {
  padding: 18px 0 28px 21px;
}

.shelf-h {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--color-foreground);
}

.hub-n {
  padding: 0 5px;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: #9c9c9c;
  background: #1d1d1d;
}

.shelf-all {
  font-size: 12px;
  color: #8a8a8a;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.shelf-all:hover {
  color: var(--color-foreground);
}

/* Cards: a horizontal shelf that snaps and runs off the window's edge;
   each card is one docs section — its seeded identicon (the kit's own
   avatar, from the section id), family, name, a line on it, its path. */
.cards {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 260px;
  gap: 8px;
  padding-right: 21px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.cards::-webkit-scrollbar {
  display: none;
}

.card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 172px;
  padding: 16px;
  scroll-snap-align: start;
  background: #0d0d0d;
  box-shadow: inset 0 0 0 1px #202020;
  transition: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  box-shadow: inset 0 0 0 1px #3a3a3a;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-av {
  display: block;
  width: 28px;
  height: 28px;
}

.card-cat {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #7d7d7d;
}

.card-name {
  margin-top: 14px;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #fff;
}

.card-desc {
  display: -webkit-box;
  margin-top: 3px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 12px;
  line-height: 18px;
  color: #9c9c9c;
}

.card-foot {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  font-size: 11px;
  color: #6d6d6d;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover .card-foot {
  color: var(--swatch-orange);
}

/* The how-row: three numbered steps in the essay's index idiom (01–03, a
   verb, the API it uses), each a dark well and one line of prose. */
.how-cell {
  display: flex;
  flex-direction: column;
}

.how-h {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 0 0 18px;
  font-size: 15px;
  color: var(--color-foreground);
}

.how-n {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--swatch-orange);
}

.how-k {
  margin-left: auto;
  font-size: 11px;
  color: #7d7d7d;
}

.code {
  position: relative;
  min-height: 260px;
  padding: 18px 14px;
  font-size: 11.5px;
  line-height: 20px;
  background: #0d0d0d;
  color: #c6c6c6;
  overflow: hidden;
}

.how-p {
  margin-top: 20px;
}

.how-p code {
  color: var(--color-foreground);
}

.code-copy {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #7d7d7d;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.code-copy:hover {
  color: var(--color-foreground);
}

.code-lines {
  margin: 0;
  padding: 0 0 0 2.4em;
  list-style: none;
  counter-reset: ln;
  white-space: pre;
}

.code-lines li {
  position: relative;
  counter-increment: ln;
}

.code-lines li::before {
  content: counter(ln);
  position: absolute;
  left: -2.4em;
  width: 1.4em;
  text-align: right;
  color: #3a3a3a;
}

.code-lines :deep(.tk-s) {
  color: #9ec5ff;
}

.code-lines :deep(.tk-c) {
  color: var(--swatch-orange);
}

.code-lines :deep(.tk-k) {
  color: #8a8a8a;
}

/* The terminal: each command types on a steps() clock (its own length in
   characters), its result lands after it. Without the latch every line is
   simply there. */
.term p {
  margin: 0 0 6px;
  overflow: hidden;
  white-space: nowrap;
}

.t-p {
  color: var(--swatch-orange);
}

.t-out {
  padding-left: 1.2em;
  color: #7d7d7d;
}

.t-caret {
  display: inline-block;
  width: 7px;
  height: 13px;
  margin-left: 6px;
  vertical-align: -2px;
  background: #ededed;
}

/* The export steps: three rows on a lifted well; the first is the frame
   you are on, the rest light in turn. */
.steps {
  margin: 0;
  padding: 18px 14px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 58px;
  padding: 0 14px;
  background: #121212;
  box-shadow: inset 0 0 0 1px #262626;
}

.step-ic {
  flex: none;
  color: #8a8a8a;
}

.step-txt {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.step-l {
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8a8a8a;
}

.step-v {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #ededed;
}

.step-dot {
  width: 6px;
  height: 6px;
  margin-left: auto;
  flex: none;
  background: var(--swatch-orange);
}

@media (prefers-reduced-motion: no-preference) {
  .how[data-live] .t-line {
    width: 0;
    animation: type calc(var(--n) * 28ms) steps(var(--n), end) var(--d) forwards;
  }
  .how[data-live] .t-last {
    width: auto;
    opacity: 0;
    animation: land 1ms var(--d) forwards;
  }
  .how[data-live] .t-out {
    opacity: 0;
    animation: land 240ms var(--d) forwards;
  }
  .how[data-live] .t-caret {
    animation: blink 1s step-end infinite;
  }
  .how[data-live] .step {
    opacity: 0.35;
    animation: lit 300ms var(--d) forwards;
  }
  .how[data-live] .step .step-dot {
    opacity: 0;
    animation: land 1ms calc(var(--d) + 300ms) forwards;
  }
  @keyframes type {
    to {
      width: calc(var(--n) * 1ch + 1ch);
    }
  }
  @keyframes land {
    to {
      opacity: 1;
    }
  }
  @keyframes lit {
    to {
      opacity: 1;
    }
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
}
</style>
