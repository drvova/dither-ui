<script setup lang="ts">
import { ref } from "vue"
import { routePath } from "@/shared/lib"
import { DitherIcon } from "@dither-kit"
import ToolMark from "@/shared/ui/ToolMark.vue"
import type { MarkId } from "@/shared/ui/marks"
import HeroStage from "./HeroStage.vue"
import TrailerDialog from "./TrailerDialog.vue"

// The hero, our own: the first screen tall, the statement beside the stage
// (the kit by hand, one real component at a time, seated on a poster the
// kit prints). Every surface on it is the kit itself; the film is a key
// away.
const film = ref(false)

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
          Charts, GLSL shaders, controls, backgrounds and 3D, each drawn pixel by pixel from one seeded palette. Copy
          the folder into your Vue 3 or Svelte 5 app and every line is yours.
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
      </div>
      <div class="stage-col">
        <HeroStage />
      </div>
    </div>
    <TrailerDialog v-model="film" />
  </section>
</template>

<style scoped>
/* The hero: the first screen under the header; on the page width, the
   statement (left) beside the stage (right). Under 900px the statement
   comes first and the stage takes the width under it. */
.hero {
  position: relative;
  isolation: isolate;
  display: grid;
  align-items: center;
  min-height: clamp(34rem, calc(100svh - 64px), 52rem);
  overflow: hidden;
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

/* The stage's column: the stage seats its own poster. */
.stage-col {
  min-width: 0;
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
</style>
