<script setup lang="ts">
import { ref } from "vue"
import {
  DitherCountUp,
  DitherGlitchText,
  DitherGradientText,
  DitherRotatingText,
  DitherShinyText,
  DitherSplitText,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const splitReplay = ref(0)

const API: Record<string, PropRow[]> = {
  gradientText: [
    { prop: "colors", type: "string[] (hex)", default: "['#358ff3', '#7CFF67', '#358ff3']" },
    { prop: "speed", type: "number", default: "1" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "default slot", type: "text", default: "—" },
  ],
  shinyText: [
    { prop: "speed", type: "number", default: "1" },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "default slot", type: "text", default: "—" },
  ],
  glitchText: [
    { prop: "text", type: "string", default: '"GLITCH"' },
    { prop: "speed", type: "number", default: "1" },
    { prop: "class", type: "string", default: "undefined" },
  ],
  splitText: [
    { prop: "text", type: "string", default: '"Split text"' },
    { prop: "stagger", type: "number (ms/char)", default: "40" },
    { prop: "duration", type: "number (ms)", default: "600" },
    { prop: "replay-token", type: "number", default: "0" },
    { prop: "class", type: "string", default: "undefined" },
  ],
  rotatingText: [
    { prop: "texts", type: "string[]", default: "['Vue', 'canvas', 'dither']" },
    { prop: "interval", type: "number (ms)", default: "2000" },
    { prop: "class", type: "string", default: "undefined" },
  ],
  countUp: [
    { prop: "to", type: "number", default: "required" },
    { prop: "from", type: "number", default: "0" },
    { prop: "duration", type: "number (ms)", default: "1500" },
    { prop: "decimals", type: "number", default: "0" },
    { prop: "class", type: "string", default: "undefined" },
  ],
}

const SNIPPETS = {
  gradientText: `<DitherGradientText :colors="['#358ff3', '#7CFF67', '#358ff3']">
  Beautifully dithered
</DitherGradientText>`,
  shinyText: `<DitherShinyText>Shimmering headline</DitherShinyText>`,
  glitchText: `<DitherGlitchText text="MALFUNCTION" />`,
  splitText: `<DitherSplitText text="Split into characters" :replay-token="token" />`,
  rotatingText: `Built for <DitherRotatingText :texts="['Vue', 'canvas', 'the studio']" />`,
  countUp: `<DitherCountUp :to="1984" /> renders <!-- counts up when scrolled into view -->`,
}
</script>

<template>
  <!-- Gradient text -->
  <section id="gradient-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Gradient text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An animated gradient clipped to the text — the colour band drifts across
      the glyphs forever. Respects reduced motion.
    </p>
    <DemoCard :code="SNIPPETS.gradientText">
      <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
        <DitherGradientText>Beautifully dithered</DitherGradientText>
      </div>
    </DemoCard>
    <PropsTable :rows="API.gradientText" />
  </section>

  <!-- Shiny text -->
  <section id="shiny-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Shiny text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A bright highlight sweeps across dim text on a loop — a subtle sheen for
      headlines and labels.
    </p>
    <DemoCard :code="SNIPPETS.shinyText">
      <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
        <DitherShinyText>Shimmering headline</DitherShinyText>
      </div>
    </DemoCard>
    <PropsTable :rows="API.shinyText" />
  </section>

  <!-- Glitch text -->
  <section id="glitch-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Glitch text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Two RGB-split copies jitter and clip over the base text for a broken-signal
      effect. The base stays readable; the glitch layers hide under reduced motion.
    </p>
    <DemoCard :code="SNIPPETS.glitchText">
      <div class="flex min-h-24 items-center justify-center text-3xl font-medium tracking-tight">
        <DitherGlitchText text="MALFUNCTION" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.glitchText" />
  </section>

  <!-- Split text -->
  <section id="split-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Split text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Each character rises and settles on a stagger. Bump
      <code class="text-foreground/80">replay-token</code> to run it again; the
      whole word is still one labelled node for screen readers.
    </p>
    <DemoCard :code="SNIPPETS.splitText">
      <div class="grid min-h-24 place-items-center gap-4">
        <div class="text-3xl tracking-tight">
          <DitherSplitText text="Split into characters" :replay-token="splitReplay" />
        </div>
        <button
          type="button"
          class="rounded-md border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          @click="splitReplay++"
        >
          Replay
        </button>
      </div>
    </DemoCard>
    <PropsTable :rows="API.splitText" />
  </section>

  <!-- Rotating text -->
  <section id="rotating-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Rotating text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Cycles through a list of words, each sliding out as the next slides in —
      for a headline that says several things.
    </p>
    <DemoCard :code="SNIPPETS.rotatingText">
      <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
        <span>Built for&nbsp;</span>
        <DitherRotatingText :texts="['Vue', 'canvas', 'the studio']" class="text-foreground" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.rotatingText" />
  </section>

  <!-- Count up -->
  <section id="count-up" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Count up</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Eases a number from <code class="text-foreground/80">from</code> to
      <code class="text-foreground/80">to</code> when it scrolls into view —
      locale-formatted, tabular figures. Reduced motion jumps to the final value.
    </p>
    <DemoCard :code="SNIPPETS.countUp">
      <div class="flex min-h-24 items-center justify-center gap-8 text-4xl tracking-tight tabular-nums">
        <DitherCountUp :to="1984" />
        <DitherCountUp :to="99.9" :decimals="1" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.countUp" />
  </section>
</template>
