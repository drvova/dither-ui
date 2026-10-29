<script setup lang="ts">
import { ref } from "vue"
import { routePath } from "@/shared/lib"
import { DitherIcon } from "@dither-kit"
import ToolMark from "@/shared/ui/ToolMark.vue"
import type { MarkId } from "@/shared/ui/marks"
import HeroStage from "./HeroStage.vue"
import TrailerDialog from "./TrailerDialog.vue"
import { COMPONENT_COUNT, RUNTIME_DEPS } from "./facts"
import { SECTION_COUNT } from "./hub"

// The hero, our own (its scale after the dither winners on Awwwards, its
// voice the site's): a full-bleed band the first screen tall, the statement
// beside the stage (the kit by hand, one real component at a time, seated
// in a form of the kit's liquid chrome). Every surface on it is the kit
// itself; the film is a key away.
const film = ref(false)

// The statement's numbers, each one recounted by a test.
const FACTS = [
  { icon: "Grid", value: COMPONENT_COUNT, label: "Components" },
  { icon: "Book", value: SECTION_COUNT, label: "Docs sections" },
  { icon: "Package", value: RUNTIME_DEPS.length, label: "Dependencies" },
] as const

// The spec bar along the band's foot: what the kit runs on and what it is
// styled with, each under its own mark.
const RUNS: { label: string; tools: { id: MarkId; name: string }[] }[] = [
  {
    label: "Runs on",
    tools: [
      { id: "vue", name: "Vue 3" },
      { id: "svelte", name: "Svelte 5" },
    ],
  },
  {
    label: "Styled with",
    tools: [
      { id: "tailwind", name: "Tailwind" },
      { id: "stylex", name: "StyleX" },
      { id: "cssmodules", name: "CSS Modules" },
      { id: "css", name: "CSS" },
    ],
  },
]
</script>

<template>
  <section aria-labelledby="hero-h" class="hero">
    <!-- On the page width, the statement (the h1, the lede, the keys, the
         kit's numbers) beside the stage. -->
    <div class="hero-in">
      <div class="statement">
        <h1 id="hero-h" class="hero-h chrome-type">A dithered UI toolkit for Vue.</h1>
        <p class="hero-lede">
          Charts, GLSL shaders, controls, backgrounds and 3D, each drawn pixel by pixel from one seeded palette. Copy
          the folder into your Vue 3 or Svelte 5 app and every line is yours.
        </p>
        <div class="hero-keys">
          <a :href="routePath('/studio')" class="nav-a nav-pill key-chrome">Open the studio</a>
          <a :href="routePath('/docs')" class="nav-a nav-pill">Read the docs</a>
          <button type="button" class="nav-a nav-pill" @click="film = true">
            <DitherIcon name="Play" :size="12" :stroke-width="1.5" />Watch the film
          </button>
        </div>
        <dl class="facts">
          <div v-for="f in FACTS" :key="f.label" class="fact">
            <dt class="spec">{{ f.label }}</dt>
            <dd>
              <DitherIcon :name="f.icon" :size="16" :stroke-width="1.5" class="fact-i" /><span
                class="fact-n chrome-type"
                >{{ f.value }}</span
              >
            </dd>
          </div>
        </dl>
      </div>
      <div class="stage-col">
        <HeroStage />
      </div>
    </div>
    <dl class="runs">
      <div v-for="g in RUNS" :key="g.label" class="runs-g">
        <dt class="speed-tag">{{ g.label }}</dt>
        <dd v-for="t in g.tools" :key="t.id"><ToolMark :id="t.id" :size="14" />{{ t.name }}</dd>
      </div>
    </dl>
    <div class="ticks hero-ticks" aria-hidden="true"></div>
    <TrailerDialog v-model="film" />
  </section>
</template>

<style scoped>
/* The hero: a full-bleed band between hairlines, the first screen under
   the header; on the page width, the statement (left) beside the stage
   (right). Under 900px the statement comes first and the stage takes the
   band's width under it. */
.hero {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  align-items: center;
  min-height: clamp(34rem, calc(100svh - 64px), 52rem);
  overflow: hidden;
  background: var(--well);
  box-shadow:
    inset 0 1px 0 var(--line),
    inset 0 -1px 0 var(--line);
}

/* The spec bar: two machined groups on the page width, each a speed tag
   and its tools under their marks, split by hairlines. */
.runs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  width: 100%;
  max-width: var(--page);
  margin: 0 auto;
  padding: 0 1.5rem 34px;
}

.runs-g {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 4px;
  border-radius: 12px;
  background: color-mix(in oklab, var(--background) 60%, transparent);
  box-shadow: inset 0 0 0 1px var(--line);
}

.runs dt {
  margin: 0 8px 0 2px;
}

.runs dd {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  margin: 0;
  padding: 0 12px;
  font-size: 12px;
  color: var(--ink-2);
}

.runs dd + dd {
  box-shadow: inset 1px 0 0 var(--line);
}

@media (max-width: 639px) {
  .runs {
    padding-inline: 16px;
  }
}

/* The stage's column: the stage seats its own chrome form. */
.stage-col {
  min-width: 0;
}

/* The seam tape along the band's foot. */
.hero-ticks {
  position: absolute;
  inset: auto 0 1px;
  opacity: 0.8;
}

.hero-in {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  align-items: center;
  gap: 0 48px;
  width: 100%;
  max-width: var(--page);
  margin-inline: auto;
  padding: 0 1.5rem;
}

/* The statement: the h1 at display size, the lede, the keys, then the
   kit's numbers. */
.statement {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding: 36px 0;
}

/* The statement in the display face (extended, one weight) at display
   size: three short lines in its column on a wide screen. */
.hero-h {
  margin: 0;
  font-family: var(--display-face);
  font-size: clamp(2rem, 3.9vw, 3.5rem);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.01em;
  text-wrap: balance;
  color: var(--ink);
}

.hero-lede {
  margin: 0;
  max-width: 30rem;
  font-size: 14px;
  line-height: 1.65;
  color: var(--ink-2);
  text-wrap: pretty;
}

.hero-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* One strip of numbers: each fact its own element, its glyph beside the
   number, hairlines between. */
.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-self: stretch;
  margin: 6px 0 0;
  padding-top: 18px;
  box-shadow: inset 0 1px 0 var(--line);
}

.fact {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 6px;
  padding: 0 16px;
  box-shadow: inset 1px 0 0 var(--line);
}

.fact:first-child {
  padding-left: 0;
  box-shadow: none;
}

.fact dd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: clamp(1.4rem, 2.2vw, 1.85rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

/* The readout: chrome numerals leaning forward, as on a sportswear spec. */
.fact-n {
  display: inline-block;
  padding-right: 0.1em;
  transform: skewX(-9deg);
}

.fact-i {
  flex: none;
  color: var(--ink-3);
}

.fact dt {
  line-height: 1.55;
}

/* Between 900 and 1199px the columns share the width evenly, so the keys
   keep one row. */
@media (max-width: 1199px) {
  .hero-in {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 899px) {
  .hero-in {
    grid-template-columns: minmax(0, 1fr);
    padding: 0;
  }
  .statement {
    padding: 28px 1.5rem 8px;
  }
}

/* On a phone the page's gutter is 16px, as the sections' and the docs'. */
@media (max-width: 639px) {
  .statement {
    padding-inline: 16px;
  }
}

@media (max-width: 479px) {
  .fact {
    padding: 0 10px;
  }
  .fact dd {
    gap: 6px;
  }
}
</style>
