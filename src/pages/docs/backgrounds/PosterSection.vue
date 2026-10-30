<script setup lang="ts">
import { ref } from "vue"
import { DitherIcon, DitherPoster, SCREEN_KINDS, type ScreenKind } from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

/* The poster on its own stage: roll a seed for a new composition, pick the
   disc's screen. */
const seed = ref(7)
const screen = ref<ScreenKind>("diagonal")
const roll = () => (seed.value = Math.floor(Math.random() * 100_000))

const CHIP = "rounded border px-2 py-1 text-[11px]"
const PICKED = "border-accent bg-accent/80 text-accent-foreground"
const UNPICKED = "border-border/60 text-muted-foreground hover:bg-accent/40"

const SNIPPET = `<DitherPoster :seed="7" screen="diagonal" :inks="['orange', 'blue', 'green', 'pink']" class="h-96" />

// on paper: the open cells of a field show the page, or a ground you name
<DitherPoster ground="#e4e1d8" />`

const API: PropRow[] = [
  {
    prop: "inks",
    type: "PixelColor[] (palette names, hues or hex)",
    default: "['orange', 'blue', 'green', 'pink', 'purple']",
  },
  { prop: "ground", type: "PixelColor | 'transparent'", default: "'transparent'" },
  {
    prop: "screen",
    type: "'bayer' | 'line' | 'diagonal' | 'dot' | 'cross'",
    default: "a DitherScreen's, else 'diagonal'",
  },
  { prop: "seed", type: "number (the composition)", default: "7" },
  { prop: "speed", type: "number (cells per second the hatch slides)", default: "2" },
  { prop: "cell", type: "number (px)", default: "2" },
  { prop: "paused", type: "boolean", default: "false" },
  { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  { prop: "dpr", type: "number", default: "devicePixelRatio" },
  { prop: "render-mode", type: '"live" | "static"', default: '"live"' },
]
</script>

<template>
  <section id="poster" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Poster</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Flat fields of ink, printed the way a screen print is. Bands of the palette run across it, each one ink or two
      inks met through the line screen, and a disc crosses them where every band turns to a hatch of another ink. The
      hatch slides along its lines; a seed lays out the bands, their inks and the disc.
    </p>
    <DemoCard :code="SNIPPET">
      <div class="flex w-full flex-col items-center gap-3">
        <div class="relative h-72 w-full overflow-hidden rounded-md bg-card">
          <DitherPoster :seed="seed" :screen="screen" />
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
            @click="roll"
          >
            <DitherIcon name="Dice" :size="12" :stroke-width="1.5" />Roll a seed
          </button>
          <button
            v-for="kind in SCREEN_KINDS"
            :key="kind"
            type="button"
            :class="[CHIP, screen === kind ? PICKED : UNPICKED]"
            :aria-pressed="screen === kind"
            @click="screen = kind"
          >
            {{ kind }}
          </button>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API" />
  </section>
</template>
