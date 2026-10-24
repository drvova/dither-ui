<script setup lang="ts">
// The directory: the docs as a browsable shelf under a head (the title,
// one line and its link beside the catalog film: the docs as a skyline,
// one window per section), the kit's own DitherTabs (badges = family
// sizes) over a horizontal shelf of framed cards that deep-link into the
// docs, each with the section's seeded identicon (the kit's avatar, from
// the section id), its family, name, a line and its path; under the shelf,
// what every preview in the docs lets you do. The skyline is a map of the
// shelf: a tower rises under the pointer and while its family's tab is
// picked, and a click on a shelved family's tower picks its tab. The tab
// row (on a narrow screen) scrolls sideways under an edge fade and chevron;
// the shelf shows whole cards a view at a time and pages from the pager
// under it, so nothing ever lies over a card.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { DitherAvatar, DitherIcon, DitherTabPanel, DitherTabs, type IconName } from "@dither-kit"
import { routePath } from "@/shared/lib"
import ClayzoFilm from "./ClayzoFilm.vue"
import PixelPlate from "./PixelPlate.vue"
import { FAMILIES, SECTION_COUNT, SHELVES } from "./hub"
import { catalogLayout, catalogPlate } from "./plates"

const tab = ref("explore")

const COUNTS = FAMILIES.map((f) => f.count)
const LAYOUT = catalogLayout(COUNTS)
const PLATE = catalogPlate(COUNTS)
const CATALOG_ALT = `The docs catalog as a night skyline: ${SECTION_COUNT} lit windows, one per section, in a tower per family; windows switch on and off and a new section falls onto the tallest roof.`

// The film's handles: the picked tab's family by its index (-1 for
// Explore), and a click on a tower picks its family's tab when it has one.
const FAMILY_INDEX = new Map<string, number>(FAMILIES.map((f, i) => [f.title, i]))
const picked = computed(() => ({
  family: FAMILY_INDEX.get(SHELVES.find((s) => s.value === tab.value)?.label ?? "") ?? -1,
}))

function onTower(area: string) {
  const family = FAMILIES[Number(/^tower(\d+)-hit$/.exec(area)?.[1])]?.title
  const shelf = SHELVES.find((s) => s.label === family)
  if (shelf) tab.value = shelf.value
}

/** A sideways scroller's cue: which of its edges have more past them, its
 * height, and a page step (`step`, 80% of its width unless given). */
function rail(step = (el: HTMLElement) => el.clientWidth * 0.8) {
  const more = reactive({ start: false, end: false, height: 0 })
  let el: HTMLElement | null = null
  let ro: ResizeObserver | null = null
  const read = () => {
    more.start = !!el && el.scrollLeft > 1
    more.end = !!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    more.height = el?.offsetHeight ?? 0
  }
  return {
    more,
    bind(next: HTMLElement | null | undefined) {
      if (el !== (next ?? null)) {
        el?.removeEventListener("scroll", read)
        ro?.disconnect()
        el = next ?? null
        el?.addEventListener("scroll", read, { passive: true })
        if (el && typeof ResizeObserver !== "undefined") (ro = new ResizeObserver(read)).observe(el)
      }
      read()
    },
    page(dir: 1 | -1) {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (el) el.scrollBy({ left: dir * step(el), behavior: still ? "auto" : "smooth" })
    },
  }
}

const panel = ref<HTMLElement | null>(null)
const tabRail = rail()
// The shelf pages a whole view: the cards it shows and the gap after them.
const shelfRail = rail((el) => {
  const css = getComputedStyle(el)
  return el.clientWidth - parseFloat(css.paddingRight) + parseFloat(css.columnGap)
})
const shelves = new Map<string, HTMLElement>()

// The open shelf is the one the cue follows (the others are hidden).
function bindRails() {
  tabRail.bind(panel.value?.querySelector<HTMLElement>('[role="tablist"]'))
  shelfRail.bind(shelves.get(tab.value))
}

onMounted(bindRails)
watch(tab, () => nextTick(bindRails))
onBeforeUnmount(() => {
  tabRail.bind(null)
  shelfRail.bind(null)
})

// The docs' preview tools (the workbench and the source panel), each with
// the section that shows it best.
const TOOLS: { title: string; icon: IconName; text: string; link: { label: string; href: string } }[] = [
  {
    title: "Inspect",
    icon: "Crosshair",
    text: "Measure spacing, check contrast and the Tab order, annotate and record any preview.",
    link: { label: "Inspect the button", href: "/docs/button" },
  },
  {
    title: "Edit and run",
    icon: "Code",
    text: "Open the code as files, change the example or the kit's own source, and run it in place.",
    link: { label: "Edit the switch", href: "/docs/switch" },
  },
  {
    title: "Hand it to your agent",
    icon: "Bot",
    text: "Copy your notes as Markdown, or download the files with a prompt.md for a coding agent.",
    link: { label: "Open the area chart", href: "/docs/area" },
  },
]
const TABS = SHELVES.map((s) => ({
  value: s.value,
  label: s.label,
  badge: s.value === "explore" ? undefined : s.count,
}))
</script>

<template>
  <section id="directory" aria-labelledby="directory-h" class="directory">
    <div class="dir-head">
      <div class="dir-text">
        <h2 id="directory-h" class="section-title">{{ SECTION_COUNT }} sections, every one of them live.</h2>
        <p class="dir-p">
          Each section is a working demo with its props table and its code. Every component is one file in one folder,
          so what you read is what you ship.
        </p>
        <a :href="routePath('/docs')" class="more-link">Browse all sections</a>
      </div>
      <ClayzoFilm
        film="catalog"
        chip="Pause the catalog film"
        :label="CATALOG_ALT"
        :inputs="picked"
        class="dir-film"
        :style="{ aspectRatio: `${LAYOUT.w} / ${LAYOUT.h}` }"
        @hit="onTower"
      >
        <template #fallback>
          <PixelPlate :plate="PLATE" fit="xMidYMax meet" class="block size-full" />
        </template>
      </ClayzoFilm>
    </div>
    <div ref="panel" class="panel window">
      <span
        v-show="tabRail.more.start"
        class="edge edge-start tab-edge"
        :style="{ height: `${tabRail.more.height - 1}px` }"
        aria-hidden="true"
        ><span class="chev" @click="tabRail.page(-1)"
          ><DitherIcon name="ChevronLeft" :size="14" :stroke-width="1.5" /></span
      ></span>
      <span
        v-show="tabRail.more.end"
        class="edge edge-end tab-edge"
        :style="{ height: `${tabRail.more.height - 1}px` }"
        aria-hidden="true"
        ><span class="chev" @click="tabRail.page(1)"
          ><DitherIcon name="ChevronRight" :size="14" :stroke-width="1.5" /></span
      ></span>
      <DitherTabs v-model="tab" :tabs="TABS" color="grey" class="tabs">
        <DitherTabPanel v-for="s in SHELVES" :key="s.value" :value="s.value" class="shelf">
          <div class="rail">
            <div
              :ref="
                (el) => {
                  if (el) shelves.set(s.value, el as HTMLElement)
                }
              "
              class="cards"
            >
              <a v-for="c in s.cards" :key="c.id" :href="routePath(`/docs/${c.id}`)" class="thumb card">
                <span class="card-top">
                  <span class="card-av" aria-hidden="true"
                    ><DitherAvatar :name="c.id" :size="28" :grid="6" :animate="false" color="blue"
                  /></span>
                  <span class="card-family">{{ c.family }}</span>
                </span>
                <span class="card-name">{{ c.label }}</span>
                <span class="card-note">{{ c.note ?? s.note }}</span>
                <span class="card-path">/docs/{{ c.id }}</span>
              </a>
            </div>
          </div>
          <div class="shelf-foot">
            <a v-if="s.value === 'explore'" :href="routePath('/docs')" class="lead">All {{ SECTION_COUNT }} sections</a>
            <a v-else :href="routePath(`/docs/${s.cards[0].id}`)" class="lead">
              All {{ s.count }} {{ s.label.toLowerCase() }}
            </a>
            <div
              v-show="shelfRail.more.start || shelfRail.more.end"
              role="group"
              aria-label="Page the cards"
              class="pager"
            >
              <button
                type="button"
                aria-label="Earlier cards"
                :disabled="!shelfRail.more.start"
                @click="shelfRail.page(-1)"
              >
                <DitherIcon name="ChevronLeft" :size="14" :stroke-width="1.5" />
              </button>
              <button type="button" aria-label="More cards" :disabled="!shelfRail.more.end" @click="shelfRail.page(1)">
                <DitherIcon name="ChevronRight" :size="14" :stroke-width="1.5" />
              </button>
            </div>
          </div>
        </DitherTabPanel>
      </DitherTabs>
      <ul class="tools" aria-label="In every preview">
        <li v-for="t in TOOLS" :key="t.title">
          <h3 class="tool-h">
            <DitherIcon :name="t.icon" :size="15" :stroke-width="1.5" class="tool-i" />{{ t.title }}
          </h3>
          <p class="tool-p">{{ t.text }}</p>
          <a :href="routePath(t.link.href)" class="lead">{{ t.link.label }}</a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.directory {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* The head: the title, its line and its link on the left; the catalog
   film on the right, its skyline standing on the panel. One column under
   760px, the film under the text. */
.dir-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  align-items: end;
  gap: 20px 40px;
}

.dir-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding-bottom: 8px;
}

.dir-p {
  margin: 0;
  max-width: 34rem;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
}

.dir-film {
  width: 100%;
}

@media (max-width: 759px) {
  .dir-head {
    grid-template-columns: minmax(0, 1fr);
  }
}

.window {
  position: relative;
  overflow: hidden;
}

/* What lies past the tab row's edge on a narrow screen: a fade in the
   panel's own ground and a chevron that pages it, shown only on an edge
   with more. The chevron is the pointer's way (touch swipes; the keyboard
   moves focus, which scrolls), so it is hidden from assistive tech, and
   only it takes the pointer: a tab under the fade still takes a click. */
.edge {
  position: absolute;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  width: 56px;
  pointer-events: none;
}

.edge-start {
  left: 0;
  justify-content: flex-start;
  padding-left: 6px;
  background: linear-gradient(to right, var(--background) 35%, transparent);
}

.edge-end {
  right: 0;
  justify-content: flex-end;
  padding-right: 6px;
  background: linear-gradient(to left, var(--background) 35%, transparent);
}

/* On the tab row the chevron sits on the labels' line (the row's 12px top
   and the tabs' 8px floor), above the hairline. */
.tab-edge {
  padding-top: 12px;
  padding-bottom: 8px;
}

.chev {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  color: var(--ink-2);
  cursor: pointer;
  pointer-events: auto;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.chev:hover {
  color: var(--ink);
}

/* The tabs sit a step in from the panel's top: flush, their labels and
   badges ran into its hairline and read as clipped. */
.tabs :deep([role="tablist"]) {
  padding: 12px 14px 0;
  box-shadow: inset 0 -1px 0 var(--line);
  overflow-x: auto;
  scrollbar-width: none;
}

.shelf {
  padding: 14px 0 16px 14px;
}

/* A horizontal shelf that snaps a card at a time and shows whole cards: as
   many as its width holds (five, four, three), the scroller ending 14px in
   from the panel's edge so a view holds exactly them, and on a phone one
   card with the next one's edge running off the panel. */
.rail {
  container-type: inline-size;
}

.cards {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 74cqw;
  gap: 8px;
  padding-right: 14px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.cards::-webkit-scrollbar {
  display: none;
}

@container (min-width: 520px) {
  .cards {
    grid-auto-columns: calc((100cqw - 14px - 2 * 8px) / 3);
    margin-right: 14px;
    padding-right: 0;
  }
}

@container (min-width: 760px) {
  .cards {
    grid-auto-columns: calc((100cqw - 14px - 3 * 8px) / 4);
    margin-right: 14px;
    padding-right: 0;
  }
}

@container (min-width: 1000px) {
  .cards {
    grid-auto-columns: calc((100cqw - 14px - 4 * 8px) / 5);
    margin-right: 14px;
    padding-right: 0;
  }
}

.card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 180px;
  padding: 14px;
  scroll-snap-align: start;
  transition: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 22%, transparent);
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

.card-family {
  font-size: 11px;
  color: var(--ink-3);
}

.card-name {
  margin-top: 14px;
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ink);
}

.card-note {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-3);
}

.card-path {
  margin-top: auto;
  font-size: 11px;
  color: var(--ink-3);
}

/* Under the shelf: where the family goes on, and the pager (real,
   named buttons, each off at its end) when the shelf runs past a view. */
.shelf-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
  margin-top: 12px;
  padding-right: 14px;
}

.pager {
  display: flex;
  gap: 6px;
}

.pager button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: var(--ink-2);
  box-shadow: inset 0 0 0 1px var(--line);
  transition:
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.pager button:not(:disabled):hover {
  color: var(--ink);
  background: color-mix(in oklab, var(--foreground) 7%, transparent);
}

.pager button:disabled {
  color: var(--ink-3);
  opacity: 0.45;
}

/* What every preview offers: three columns under the shelf, split by
   hairlines (no boxes inside the panel). */
.tools {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
  box-shadow: inset 0 1px 0 var(--line);
}

.tools li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 18px 20px 20px;
}

.tools li + li {
  box-shadow: inset 1px 0 0 var(--line);
}

.tool-h {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.tool-i {
  flex: none;
  color: var(--ink-3);
}

.tool-p {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
  text-wrap: pretty;
}

@media (max-width: 759px) {
  .tools {
    grid-template-columns: minmax(0, 1fr);
  }
  .tools li + li {
    box-shadow: inset 0 1px 0 var(--line);
  }
}
</style>
