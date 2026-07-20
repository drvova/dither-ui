<script setup lang="ts">
import { ref } from "vue"
import {
  DitherBlurText,
  DitherCountUp,
  DitherDecryptedText,
  DitherFallingText,
  DitherGlitchText,
  DitherGradientText,
  DitherRotatingText,
  DitherScrambleText,
  DitherScrollFloat,
  DitherScrollReveal,
  DitherShinyText,
  DitherShuffle,
  DitherSplitText,
  DitherTextType,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const splitReplay = ref(0)
const shuffleReplay = ref(0)
const fallingReplay = ref(0)

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
  textType: [
    { prop: "texts", type: "string[]", default: "['Type this out.', 'Then this.']" },
    { prop: "typing-speed", type: "number (ms)", default: "60" },
    { prop: "deleting-speed", type: "number (ms)", default: "35" },
    { prop: "pause", type: "number (ms)", default: "1400" },
    { prop: "loop", type: "boolean", default: "true" },
    { prop: "cursor", type: "boolean", default: "true" },
  ],
  blurText: [
    { prop: "text", type: "string", default: '"Blur into focus"' },
    { prop: "by", type: '"words" | "chars"', default: '"words"' },
    { prop: "stagger", type: "number (ms)", default: "90" },
    { prop: "duration", type: "number (ms)", default: "600" },
  ],
  decryptedText: [
    { prop: "text", type: "string", default: '"DECRYPTED"' },
    { prop: "speed", type: "number", default: "1" },
    { prop: "trigger", type: '"view" | "hover"', default: '"view"' },
  ],
  scrambleText: [
    { prop: "text", type: "string", default: '"Hover to scramble"' },
    { prop: "speed", type: "number", default: "1" },
  ],
  shuffle: [
    { prop: "text", type: "string", default: '"Shuffle in"' },
    { prop: "stagger", type: "number (ms)", default: "55" },
    { prop: "duration", type: "number (ms)", default: "650" },
    { prop: "replay-token", type: "number", default: "0" },
  ],
  fallingText: [
    { prop: "text", type: "string", default: '"Falling text"' },
    { prop: "stagger", type: "number (ms)", default: "45" },
    { prop: "duration", type: "number (ms)", default: "700" },
    { prop: "replay-token", type: "number", default: "0" },
  ],
  scrollReveal: [
    { prop: "text", type: "string", default: "required" },
    { prop: "class", type: "string", default: "undefined" },
  ],
  scrollFloat: [
    { prop: "text", type: "string", default: "required" },
    { prop: "amount", type: "number", default: "1" },
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
  textType: `<DitherTextType :texts="['Charts, dithered.', 'Buttons, dithered.', 'Everything, dithered.']" />`,
  blurText: `<DitherBlurText text="Blur into focus" by="words" />`,
  decryptedText: `<DitherDecryptedText text="ACCESS GRANTED" />`,
  scrambleText: `<DitherScrambleText text="Hover to scramble" />`,
  shuffle: `<DitherShuffle text="Shuffled into place" :replay-token="token" />`,
  fallingText: `<DitherFallingText text="Falling into place" :replay-token="token" />`,
  scrollReveal: `<DitherScrollReveal text="These words reveal as you scroll them into view" />`,
  scrollFloat: `<DitherScrollFloat text="Floating up on scroll" />`,
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

  <!-- Text type -->
  <section id="text-type" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Text type</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A typewriter that types each string, pauses, deletes and moves to the next —
      with a blinking caret. Reduced motion shows the first line, no typing.
    </p>
    <DemoCard :code="SNIPPETS.textType">
      <div class="flex min-h-24 items-center justify-center text-2xl tracking-tight">
        <DitherTextType :texts="['Charts, dithered.', 'Buttons, dithered.', 'Everything, dithered.']" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.textType" />
  </section>

  <!-- Blur text -->
  <section id="blur-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Blur text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Words (or characters) blur into focus on a stagger the first time they enter
      the viewport. Still one labelled node for screen readers.
    </p>
    <DemoCard :code="SNIPPETS.blurText">
      <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
        <DitherBlurText text="Blur into focus" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.blurText" />
  </section>

  <!-- Decrypted text -->
  <section id="decrypted-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Decrypted text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Scrambled cipher characters resolve left-to-right into the real text when it
      scrolls into view. Monospace keeps the width steady.
    </p>
    <DemoCard :code="SNIPPETS.decryptedText">
      <div class="flex min-h-24 items-center justify-center text-3xl font-medium tracking-tight">
        <DitherDecryptedText text="ACCESS GRANTED" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.decryptedText" />
  </section>

  <!-- Scramble text -->
  <section id="scramble-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Scramble text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Hover to burst-scramble the characters, which then settle back to the real
      text. Repeatable on every hover.
    </p>
    <DemoCard :code="SNIPPETS.scrambleText">
      <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
        <DitherScrambleText text="Hover to scramble" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.scrambleText" />
  </section>

  <!-- Shuffle -->
  <section id="shuffle" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Shuffle</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Characters fly in from scattered offsets and rotations, settling into place
      on a stagger. Bump <code class="text-foreground/80">replay-token</code> to run it again.
    </p>
    <DemoCard :code="SNIPPETS.shuffle">
      <div class="grid min-h-24 place-items-center gap-4">
        <div class="text-3xl tracking-tight"><DitherShuffle text="Shuffled into place" :replay-token="shuffleReplay" /></div>
        <button type="button" class="rounded-md border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground" @click="shuffleReplay++">Replay</button>
      </div>
    </DemoCard>
    <PropsTable :rows="API.shuffle" />
  </section>

  <!-- Falling text -->
  <section id="falling-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Falling text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Characters drop in from above with a little overshoot bounce, staggered
      across the line.
    </p>
    <DemoCard :code="SNIPPETS.fallingText">
      <div class="grid min-h-24 place-items-center gap-4">
        <div class="text-3xl tracking-tight"><DitherFallingText text="Falling into place" :replay-token="fallingReplay" /></div>
        <button type="button" class="rounded-md border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground" @click="fallingReplay++">Replay</button>
      </div>
    </DemoCard>
    <PropsTable :rows="API.fallingText" />
  </section>

  <!-- Scroll reveal -->
  <section id="scroll-reveal" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Scroll reveal</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The words fade and de-blur word-by-word as the block travels up through the
      viewport — the reveal is tied to scroll position, not a one-shot. Scroll the page.
    </p>
    <DemoCard :code="SNIPPETS.scrollReveal">
      <div class="flex min-h-24 max-w-md items-center justify-center text-center text-xl leading-relaxed tracking-tight">
        <DitherScrollReveal text="These words reveal as you scroll them into view" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.scrollReveal" />
  </section>

  <!-- Scroll float -->
  <section id="scroll-float" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Scroll float</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Characters float up from an offset as the scroll progress reaches each one —
      a gentle parallax settle. Scroll the page.
    </p>
    <DemoCard :code="SNIPPETS.scrollFloat">
      <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
        <DitherScrollFloat text="Floating up on scroll" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.scrollFloat" />
  </section>
</template>
