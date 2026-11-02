<script setup lang="ts">
// The Quick start: the kit is a folder, so installing it is a few steps a
// reader takes one at a time, each with its own copy (`install.ts` holds
// them per framework and for the Vue kit on StyleX). Then the two questions
// a reader asks next, each under its own heading: the StyleX layer, and the
// kit without Tailwind.
import { computed } from "vue"
import { CodeBlock } from "@/shared/ui"
import { INSTALL_DEPS, INSTALL_STEPS, type InstallKind } from "../install"
import { docsFramework, docsStyling } from "../svelte"

const kind = computed<InstallKind>(() =>
  docsFramework.value === "svelte" ? "svelte" : docsStyling.value === "stylex" ? "stylex" : "vue",
)
const folder = computed(() => (kind.value === "svelte" ? "dither-kit-svelte" : "dither-kit"))
const COUNT = ["no", "one", "two", "three", "four", "five", "six"]
const deps = computed(() => COUNT[INSTALL_DEPS[kind.value].length] ?? String(INSTALL_DEPS[kind.value].length))
const already = computed(() =>
  kind.value === "svelte"
    ? "Svelte 5, and Tailwind if you use it"
    : kind.value === "stylex"
      ? "Vue 3 and StyleX"
      : "Vue 3, and Tailwind if you use it",
)

const ANY_STYLES = `<!-- No Tailwind? One plain stylesheet: the tokens, a base scoped to
     .dither-kit and every class the components use. -->
<link rel="stylesheet" href="https://dither-ui.com/kit/dither-kit.css">

<div class="dither-kit">
  <DitherButton class="cta">Ship</DitherButton>
</div>`

const THEME = `import { applyTheme, themeCss } from "@dither-kit"

applyTheme({ accent: "#3f8ff3", radius: "4px" })  // on <html>, returns the undo
themeCss({ background: "#000" }, ".dark")          // a rule for your stylesheet`

const LINK =
  "text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60"
const CODE = "text-foreground/80"
</script>

<template>
  <section id="getting-started" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Quick start</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The kit is a folder, not a package. Copy <code :class="CODE">{{ folder }}/</code> from the
      <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" :class="LINK"
        >GitHub repo<span class="sr-only"> (opens in a new tab)</span></a
      >, install {{ deps }} small runtime deps and alias it. You already have {{ already }}.
    </p>

    <ol class="mt-6 flex flex-col gap-6" aria-label="Install steps">
      <li v-for="(step, i) in INSTALL_STEPS[kind]" :key="step.title" class="qs-step">
        <span class="qs-n" aria-hidden="true">{{ i + 1 }}</span>
        <div class="min-w-0">
          <p class="text-[13px] text-foreground">{{ step.title }}</p>
          <p v-if="step.why" class="mt-0.5 text-[12px] text-muted-foreground">{{ step.why }}</p>
        </div>
        <div class="qs-code"><CodeBlock :code="step.code" /></div>
      </li>
    </ol>

    <template v-if="docsFramework === 'vue'">
      <h3 class="mt-10 text-[13px] text-foreground">On StyleX</h3>
      <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        The Vue kit has a StyleX layer, <code :class="CODE">dither-kit/stylex/</code>, generated from the Tailwind
        components so the two never drift. Alias <code :class="CODE">@dither-kit</code> to it and pass your own styles
        as <code :class="CODE">xstyle</code>. Pick StyleX in the header and these steps, the code tabs and Run all
        switch to it.
      </p>
    </template>

    <h3 class="mt-10 text-[13px] text-foreground">Without Tailwind</h3>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The kit brings its own stylesheet, in cascade layers so your styles win. Pick your system in the header and every
      snippet here, every Studio export and the agent's <code :class="CODE">code.get</code> come out as a scoped
      stylesheet, CSS Modules or StyleX.
    </p>
    <div class="mt-3"><CodeBlock :code="ANY_STYLES" /></div>
    <p class="mt-4 text-[13px] leading-relaxed text-muted-foreground">
      The tokens are plain custom properties, so theme from CSS, JS or any vars contract:
    </p>
    <div class="mt-3"><CodeBlock :code="THEME" /></div>

    <p class="mt-6 text-[12px] leading-relaxed text-muted-foreground">
      Prefer to read the source first? Every component lives under
      <a
        :href="`https://github.com/drvova/dither-ui/tree/master/${folder}`"
        target="_blank"
        rel="noreferrer"
        :class="LINK"
        >{{ folder }}/<span class="sr-only"> (opens in a new tab)</span></a
      >. No build step, no black box.
    </p>
  </section>
</template>

<style scoped>
/* A step: its number on a filled disc beside what it does and its code. */
.qs-step {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  column-gap: 14px;
  row-gap: 10px;
}

/* The code under the step's words; on a phone it takes the full width, as
   every character of a command counts there. */
.qs-code {
  grid-column: 2;
  min-width: 0;
}

@media (width < 640px) {
  .qs-code {
    grid-column: 1 / -1;
  }
}

.qs-n {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--foreground);
  background: color-mix(in oklab, var(--foreground) 10%, var(--background));
}
</style>
