<script setup lang="ts">
// Plays well with others: what the kit meets on the reader's side, three
// lists at reading size under the section's head. Their styling (each tool
// under its own mark), their agent (the bridge's harnesses, and any command
// besides) and their files (every model format the kit reads, named in the
// kit's order).
import { MODEL_FORMATS } from "@dither-kit/engine/models"
import { routePath } from "@/shared/lib"
import ToolMark from "@/shared/ui/ToolMark.vue"
import { HARNESSES, MODEL_NAMES, WORKS } from "./facts"
</script>

<template>
  <section id="works" aria-labelledby="works-h" class="sec">
    <div class="sec-head">
      <h2 id="works-h" class="section-title chrome-type">Plays well with others.</h2>
      <div class="sec-side">
        <p class="sec-lede">
          Bring the stack you already have. The kit speaks your styling, the bridge wakes the agent you are already
          signed in to, and the 3D surfaces read whatever model is lying around in your downloads.
        </p>
        <a :href="routePath('/docs/styling')" class="more-link">See the styling switch</a>
      </div>
    </div>
    <div class="works">
      <div>
        <h3 id="works-styling" class="works-h">Your styling</h3>
        <ul aria-labelledby="works-styling">
          <li v-for="t in WORKS" :key="t.id"><ToolMark :id="t.id" :size="18" />{{ t.name }}</li>
        </ul>
        <p class="works-more">and any app on its compiled stylesheet: UnoCSS, plain CSS or CSS-in-JS</p>
      </div>
      <div>
        <h3 id="works-agent" class="works-h">Your agent</h3>
        <ul aria-labelledby="works-agent">
          <li v-for="h in HARNESSES" :key="h.id"><ToolMark :id="h.id" :size="18" />{{ h.name }}</li>
        </ul>
        <p class="works-more">or any command you hand the bridge</p>
      </div>
      <div>
        <h3 id="works-files" class="works-h">Your models</h3>
        <ul aria-labelledby="works-files" class="files">
          <li v-for="f in MODEL_FORMATS" :key="f">{{ MODEL_NAMES[f] }}</li>
        </ul>
        <p class="works-more">and GLSL, pasted straight from Shadertoy</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Three lists at reading size, on the page width: each a quiet heading over
   its rows, a mark and a name, generous like a menu. Three columns down
   to a phone, then one (its rows two abreast). */
.works {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px 48px;
  padding: 28px 32px 32px;
  border-radius: 20px;
  background: var(--surface);
}

.works-h {
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 400;
  color: var(--ink-3);
}

.works ul {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 15px;
  color: var(--ink);
}

.works li {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* The models carry no mark: each a cell of the print before its name. */
.files li::before {
  content: "";
  flex: none;
  width: 6px;
  height: 6px;
  margin-inline: 6px;
  background: var(--signal);
}

.works-more {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}

@media (max-width: 899px) {
  .works {
    column-gap: 28px;
    padding-inline: 24px;
  }
}

@media (max-width: 639px) {
  .works {
    grid-template-columns: minmax(0, 1fr);
    padding: 24px 20px;
  }
  /* Each list two abreast, so the panel stays a screen or so tall. */
  .works ul {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
    font-size: 14px;
  }
}
</style>
