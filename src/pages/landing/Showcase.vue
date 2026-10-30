<script setup lang="ts">
import { ref } from "vue"
import { routePath } from "@/shared/lib"
import { DitherIcon, DitherPoster, DitherReveal, type PixelColor } from "@dither-kit"
import ToolMark from "@/shared/ui/ToolMark.vue"
import type { MarkId } from "@/shared/ui/marks"
import { COMPONENT_COUNT, MATRIX } from "./facts"
import { STAGINGS } from "./brand"
import BrandGather from "./BrandGather.vue"
import PauseChip from "./PauseChip.vue"
import TrailerDialog from "./TrailerDialog.vue"

// The hero, our own: the first screen tall, the statement beside a print
// the kit makes (a live DitherPoster: the palette as tone, the kit's
// diamond knocked out of it, its screen sliding inside the mark), on the
// obsidian like a print on black stock. The film is a key away.
const film = ref(false)

// The statement signs off with the brand (`STAGINGS.hero`), gathering out
// of the open field of the page's column under it (some of its cells from
// under the print) as the page opens. One moving layer at a time: the print
// holds its frame until the brand is home.
const gathered = ref(false)

// The print's inks: the kit's blue, the ember and the page's own bone ink.
// Its screen slides by itself, so it carries a pause (WCAG 2.2.2).
const INKS: PixelColor[] = ["blue", "orange", "#e4e1d8"]
const printing = ref(true)

// What the kit works with, each under its own mark.
const WORKS: { id: MarkId; name: string }[] = [
  { id: "vue", name: "Vue 3" },
  { id: "svelte", name: "Svelte 5" },
  { id: "tailwind", name: "Tailwind" },
  { id: "stylex", name: "StyleX" },
  { id: "cssmodules", name: "CSS Modules" },
  { id: "css", name: "CSS" },
]
</script>

<template>
  <section aria-labelledby="hero-h" class="hero">
    <div class="hero-in">
      <div class="statement">
        <h1 id="hero-h" class="hero-h chrome-type">A dithered UI toolkit for Vue.</h1>
        <p class="hero-lede">
          {{ COMPONENT_COUNT }} components, from charts and controls to GLSL and 3D, each printed cell by cell through
          one seeded {{ MATRIX }} matrix. Copy the folder into a Vue 3 or Svelte 5 app and change what you need.
        </p>
        <div class="hero-keys">
          <a :href="routePath('/studio')" class="nav-a key-chrome primary">Open the studio</a>
          <a :href="routePath('/docs')" class="key">Read the docs</a>
          <button type="button" class="key" @click="film = true">
            <DitherIcon name="Play" :size="12" :stroke-width="1.5" />Watch the film
          </button>
        </div>
        <div class="works">
          <span id="works-l">Works with</span>
          <ul aria-labelledby="works-l">
            <li v-for="t in WORKS" :key="t.id"><ToolMark :id="t.id" :size="13" />{{ t.name }}</li>
          </ul>
        </div>
        <BrandGather class="hero-brand" :scene="STAGINGS.hero" @settled="gathered = true" />
      </div>
      <div class="print-col">
        <div class="print">
          <DitherPoster :seed="5" :inks="INKS" :cell="4" :speed="1.5" :paused="!printing || !gathered" />
          <PauseChip v-model="printing" label="Pause the print" class="print-chip" />
          <!-- The print stands over its own reflection on the obsidian: the
               same print at the same moment, turned over and thinned through
               the kit's wipe to two-fifths, then a fifth, of its cells. A
               shadow cannot show on black; a floor of the print's own cells
               can, and it is never a tint. -->
          <DitherReveal class="print-floor" :progress="1 / 3" direction="down" :band="20" aria-hidden="true">
            <DitherPoster
              :seed="5"
              :inks="INKS"
              :cell="4"
              :speed="1.5"
              :paused="!printing || !gathered"
              class="print-mirror"
            />
          </DitherReveal>
        </div>
      </div>
    </div>
    <TrailerDialog v-model="film" />
  </section>
</template>

<style scoped>
/* The hero: the first screen under the header; on the page width, the
   statement (left) beside the print (right). Under 900px the statement
   comes first and the print takes the width under it, landscape. */
.hero {
  position: relative;
  isolation: isolate;
  display: grid;
  align-items: center;
  min-height: clamp(34rem, calc(100svh - 64px), 52rem);
  overflow: hidden;
}

/* Positioned: the brand's field is the page's column. */
.hero-in {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  align-items: center;
  gap: 0 48px;
  width: 100%;
  max-width: var(--page);
  margin-inline: auto;
  padding: 0 1.5rem;
}

/* The statement: the h1 at display size, the lede, the keys, then what
   the kit works with. */
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
  text-wrap: balance;
  color: var(--ink);
}

.hero-lede {
  margin: 0;
  max-width: 30rem;
  font-size: 14px;
  line-height: 1.65;
  color: var(--ink-3);
  text-wrap: pretty;
}

.hero-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.primary {
  padding-inline: 14px;
}

/* What it works with: a quiet line of marks and names. */
.works {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--ink-3);
}

.works ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.works li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

/* The brand at the statement's foot, its sign-off; its cells travel the
   page's column (`.hero-in`), the nearest positioned ancestor. */
.hero-brand {
  position: relative;
  margin-top: 20px;
}

/* The print: a portrait sheet set on the obsidian inside its column, square
   cornered and flat, never a panel run to the frame. Its pause sits on its
   top right corner. */
.print-col {
  display: grid;
  justify-items: end;
  min-width: 0;
  padding: 40px 0;
}

.print {
  position: relative;
  width: min(100%, 30rem);
  aspect-ratio: 4 / 5;
  container-type: inline-size;
}

/* The floor: 40px under the print (ten cells; the wipe's band runs twice
   that, so at a third of its travel only its two thinnest steps show),
   holding the print's mirror, as tall as the print and turned over so its
   foot meets the print's. */
.print-floor {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 40px;
  overflow: hidden;
  pointer-events: none;
}

.print-mirror {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 125cqw;
  transform: scaleY(-1);
}

.print-chip {
  position: absolute;
  top: 12px;
  right: 12px;
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
  .print-col {
    justify-items: stretch;
    padding: 16px 1.5rem 48px;
  }
  .print {
    width: 100%;
    aspect-ratio: 5 / 4;
  }
  .print-mirror {
    height: 80cqw;
  }
}

/* On a phone the page's gutter is 16px, as the sections' and the docs'. */
@media (max-width: 639px) {
  .statement,
  .print-col {
    padding-inline: 16px;
  }
}
</style>
