<script setup lang="ts">
import { ref } from "vue"
import {
  Area,
  AreaChart,
  DitherAvatar,
  DitherGradient,
  DitherScreen,
  SCREEN_KINDS,
  type DitherColor,
  type ScreenKind,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

/* One DitherScreen around three different surfaces: picking a screen
   reprints all of them, the chart's series included. */
const screen = ref<ScreenKind>("diagonal")
const LABELS: Record<ScreenKind, string> = {
  bayer: "Bayer",
  line: "Line",
  diagonal: "Hatch",
  dot: "Dot",
  cross: "Cross",
}
const ROWS = [12, 18, 15, 24, 21, 30, 27, 36].map((v, i) => ({ i, v, w: v * 0.55 + 4 }))
const CHART = {
  v: { label: "Sessions", color: "blue" as DitherColor },
  w: { label: "Signups", color: "orange" as DitherColor },
}

const CHIP = "rounded border px-2 py-1 text-[11px]"
const PICKED = "border-accent bg-accent/80 text-accent-foreground"
const UNPICKED = "border-border/60 text-muted-foreground hover:bg-accent/40"

const SNIPPET = `<DitherScreen screen="diagonal">
  <AreaChart :data="rows" :config="config">
    <Area data-key="sessions" />
  </AreaChart>
  <DitherGradient from="purple" />
</DitherScreen>

// or the matrices alone, for your own painter
import { screenMatrix } from "@dither-kit"
const m = screenMatrix("dot", seed) // 4x4 thresholds: m[y & 3][x & 3]`

const API: PropRow[] = [
  { prop: "screen", type: "'bayer' | 'line' | 'diagonal' | 'dot' | 'cross'", default: "'diagonal'" },
  { prop: "default slot", type: "content (every surface inside prints through the screen)", default: "" },
]
</script>

<template>
  <section id="print-screens" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Print screens</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Every surface thresholds its density through a 4x4 matrix, the Bayer one unless told otherwise.
      <code class="text-foreground/80">DitherScreen</code> swaps it for a printer's screen for everything inside it:
      lines, a falling hatch, clustered dots or a cross-hatch, charts included. A surface's seed still jitters whichever
      screen it prints through, and <code class="text-foreground/80">screenMatrix</code> hands the same thresholds to a
      painter of your own.
    </p>
    <DemoCard :code="SNIPPET">
      <div class="flex w-full flex-col gap-3">
        <DitherScreen :screen="screen">
          <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div class="h-36 rounded-md bg-card p-2">
              <AreaChart :data="ROWS" :config="CHART" class="h-full">
                <Area data-key="v" />
                <Area data-key="w" />
              </AreaChart>
            </div>
            <div class="flex items-center gap-3 sm:flex-col">
              <DitherAvatar name="print" :size="64" />
              <div class="relative h-16 w-28 overflow-hidden rounded-md">
                <DitherGradient from="purple" direction="right" />
              </div>
            </div>
          </div>
        </DitherScreen>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="kind in SCREEN_KINDS"
            :key="kind"
            type="button"
            :class="[CHIP, screen === kind ? PICKED : UNPICKED]"
            :aria-pressed="screen === kind"
            @click="screen = kind"
          >
            {{ LABELS[kind] }}
          </button>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API" />
  </section>
</template>
