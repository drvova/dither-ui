<script setup lang="ts">
// The stage's export scene: one snippet of kit components, rendered live
// on the left and written on the right in the picked styling system by the
// translator the docs and the Studio's export use (`restyle`), StyleX
// first. Its own chunk: the translator carries the compiled utility map.
import { computed, ref } from "vue"
import { DitherButton, DitherHeading } from "@dither-kit"
import { STYLINGS, STYLING_LABELS, restyle, type Styling } from "@/shared/lib/restyle"

// The snippet is the live card's own markup, so what is shown is what runs.
const SNIPPET = `<div class="flex flex-col gap-3 rounded-lg bg-background p-4">
  <DitherHeading level="4">Deploys</DitherHeading>
  <p class="text-xs text-muted-foreground">16 this week, none rolled back.</p>
  <DitherButton color="blue" class="w-full">Deploy now</DitherButton>
</div>`
const system = ref<Styling>("stylex")
const code = computed(() => restyle(SNIPPET, system.value))
</script>

<template>
  <div class="export">
    <div class="export-live">
      <div class="flex flex-col gap-3 rounded-lg bg-background p-4">
        <DitherHeading level="4">Deploys</DitherHeading>
        <p class="text-xs text-muted-foreground">16 this week, none rolled back.</p>
        <DitherButton color="blue" class="w-full">Deploy now</DitherButton>
      </div>
    </div>
    <div class="export-side">
      <div class="seg" role="group" aria-label="Styling system">
        <button v-for="s in STYLINGS" :key="s" type="button" :aria-pressed="system === s" @click="system = s">
          {{ STYLING_LABELS[s] }}
        </button>
      </div>
      <pre class="export-code" tabindex="0" aria-label="The card's code"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
/* The card on the left, its code on the right; stacked on a narrow stage. */
.export {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 16px;
  padding: 44px 16px 16px;
}

.export-live {
  display: grid;
  align-content: center;
}

.export-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.export-code {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  border-radius: 6px;
  font-size: 10.5px;
  line-height: 1.55;
  color: var(--ink-3);
  background: var(--background);
}

@container (max-width: 30rem) {
  .export {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }
  .export-live {
    display: none;
  }
}
</style>
