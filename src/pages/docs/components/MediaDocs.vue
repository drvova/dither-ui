<script setup lang="ts">
import { reactive, ref } from "vue"
import { DitherBracket, DitherSchedule, DitherVideoPlayer, type BracketMatch } from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

/* Public-domain sample clip (MDN CC0) — swap for your own src. */
const VIDEO_SRC = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"

/* Bracket: picking a winner advances them into the next round. */
const rounds = reactive<BracketMatch[][]>([
  [
    { a: "Bayer", b: "Ordered" },
    { a: "Halftone", b: "Threshold" },
  ],
  [{ a: "—", b: "—" }],
])
function pick(r: number, m: number, side: "a" | "b") {
  const match = rounds[r][m]
  match.winner = side
  const winner = side === "a" ? match.a : match.b
  const next = rounds[r + 1]?.[Math.floor(m / 2)]
  if (next) {
    if (m % 2 === 0) next.a = winner
    else next.b = winner
  }
}
function resetBracket() {
  rounds[0].forEach((m) => delete m.winner)
  rounds[1][0] = { a: "—", b: "—" }
}

const scheduleNow = ref(13.5)

const API: Record<string, PropRow[]> = {
  video: [
    { prop: "src", type: "string — no src renders an honest empty face", default: "undefined" },
    { prop: "poster", type: "string", default: "undefined" },
    { prop: "label", type: "string — accessible name", default: '"Video"' },
    { prop: "color", type: "PixelColor — scrubber hue", default: '"blue"' },
  ],
  bracket: [
    { prop: "rounds", type: "{ a, b, winner? }[][] — columns left to right", default: "required" },
    { prop: "color", type: "PixelColor — winner accent", default: '"green"' },
    { prop: "interactive", type: "boolean — click a side to pick", default: "false" },
    { prop: "@pick", type: "(round, match, side) — consumer advances the data", default: "—" },
  ],
  schedule: [
    { prop: "events", type: "{ start, end, label, color? }[] — fractional hours", default: "required" },
    { prop: "from / to", type: "number — day window", default: "8 / 18" },
    { prop: "now", type: "number — draws the now line; omit to hide", default: "undefined" },
  ],
}

const SNIPPET_VIDEO = `<DitherVideoPlayer
  src="/clips/launch.mp4"
  label="Launch recap"
  color="blue"
/>
<!-- native <video> under dither chrome: play · dithered scrubber ·
     tabular time · mute · fullscreen. No src = honest empty face. -->`

const SNIPPET_BRACKET = `<DitherBracket :rounds="rounds" interactive @pick="pick" />

<script setup>
function pick(r, m, side) {          // you own the data — advance the winner
  const match = rounds[r][m]
  match.winner = side
  const next = rounds[r + 1]?.[Math.floor(m / 2)]
  if (next) m % 2 === 0 ? (next.a = win(match)) : (next.b = win(match))
}
<\\/script>`

const SNIPPET_SCHEDULE = `<DitherSchedule
  :events="[
    { start: 9, end: 10.5, label: 'Standup', color: 'blue' },
    { start: 11, end: 12.5, label: 'Design review', color: 'purple' },
    { start: 14, end: 16, label: 'Focus block', color: 'green' },
  ]"
  :from="8" :to="18" :now="13.5"
/>
<!-- fractional hours: 13.5 is half past one -->`
</script>

<template>
  <!-- Video player -->
  <section id="video-player" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Video player</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A native video under dither chrome — play, a dithered scrubber that
      really seeks, tabular time, mute, fullscreen. Without a source it shows
      an honest empty face instead of a broken box.
    </p>
    <DemoCard :code="SNIPPET_VIDEO">
      <div class="mx-auto max-w-md">
        <DitherVideoPlayer :src="VIDEO_SRC" label="Flower sample clip" color="blue" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.video" />
  </section>

  <!-- Bracket -->
  <section id="bracket" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Bracket</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A knockout bracket — winners carry the accent, losers strike through,
      connector rails bridge the rounds. This one is interactive: pick every
      winner and the final fills itself.
    </p>
    <DemoCard :code="SNIPPET_BRACKET">
      <div class="grid place-items-center gap-3">
        <DitherBracket :rounds="rounds" interactive color="green" @pick="pick" />
        <button
          type="button"
          class="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          @click="resetBracket"
        >
          Reset bracket
        </button>
      </div>
    </DemoCard>
    <PropsTable :rows="API.bracket" />
  </section>

  <!-- Schedule -->
  <section id="schedule" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Schedule</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A day timeline — events sit proportionally on the hour rail, each with
      its swatch rail, and the red now line slides as the day moves. Drag the
      hour to move time.
    </p>
    <DemoCard :code="SNIPPET_SCHEDULE">
      <div class="mx-auto max-w-md">
        <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
          now
          <input v-model.number="scheduleNow" type="range" min="8" max="18" step="0.25" class="w-40 accent-[var(--accent)]" />
          <span class="tabular-nums">{{ Math.floor(scheduleNow) }}:{{ String(Math.round((scheduleNow % 1) * 60)).padStart(2, "0") }}</span>
        </label>
        <DitherSchedule
          class="mt-3"
          :events="[
            { start: 9, end: 10.5, label: 'Standup', color: 'blue' },
            { start: 11, end: 12.5, label: 'Design review', color: 'purple' },
            { start: 14, end: 16, label: 'Focus block', color: 'green' },
            { start: 16.5, end: 17.5, label: 'Client call', color: 'orange' },
          ]"
          :from="8"
          :to="18"
          :now="scheduleNow"
        />
      </div>
    </DemoCard>
    <PropsTable :rows="API.schedule" />
  </section>
</template>
