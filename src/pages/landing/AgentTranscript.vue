<script setup lang="ts">
// The hero's left half (the reference's terminal beside its board): a
// Studio agent session in the Agent panel's own notation — `›` the prompt,
// `⚙ command · args` then `⎿ result` per Studio tool call, `⏺` prose —
// whose lines land on the hero film's beats (`hero-beats.ts`), so the
// transcript and the board tell one story. Commands are the protocol's
// real vocabulary. Every line is always in the DOM; while the film runs the
// root carries the `data-live` latch and lines still ahead of the film's
// moment are `data-pending` (hidden), so the log loops with the film. The
// prerender strips the latch: the static bytes show the whole session, as
// does no player, or reduced motion paused on the still.
import { computed, nextTick, ref, watch } from "vue"
import { STUDIO_TOOL_COUNT } from "./facts"
import { BEATS } from "./hero-beats"

const props = defineProps<{ time: number; live: boolean }>()

type Line =
  | { at: number; kind: "prompt"; text: string }
  | { at: number; kind: "tool"; cmd: string; args: string; out: string }
  | { at: number; kind: "prose"; text: string }

const LINES: Line[] = [
  { at: 0, kind: "prompt", text: "lay out a renders dashboard, then show me its layers" },
  { at: BEATS.tilt, kind: "tool", cmd: "chart.add", args: "area · renders · seed 512", out: "a1 · 1040×600" },
  { at: BEATS.exploded, kind: "tool", cmd: "component.add", args: "DitherSwitch · DitherButton", out: "on a1 · 4 paint layers" },
  { at: BEATS.reseed, kind: "tool", cmd: "artboard.update", args: "a1 · seed 512 → 513", out: "re-dithered" },
  { at: BEATS.flipOn, kind: "tool", cmd: "artboard.update", args: "switch · checked", out: "ok" },
  { at: BEATS.press, kind: "tool", cmd: "code.get", args: "a1 · tailwind", out: "a1.vue" },
  { at: BEATS.unseed, kind: "tool", cmd: "artboard.update", args: "a1 · seed 513 → 512", out: "ok" },
  { at: BEATS.fold, kind: "tool", cmd: "video.export", args: "a1 · 9.6s · 30 fps", out: "video/a1/index.html" },
  { at: BEATS.flat, kind: "prose", text: "One board, four paint layers, one dither rule." },
]

const pending = (at: number) => props.live && props.time < at
// The log reads top-down; when a narrow column overflows it, the newest
// line stays in view (the reference's terminal follows its tail).
const log = ref<HTMLElement | null>(null)
const shown = computed(() => LINES.filter((l) => !pending(l.at)).length)
watch(shown, () => nextTick(() => log.value && (log.value.scrollTop = log.value.scrollHeight)))
const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`
</script>

<template>
  <div
    class="term"
    :data-live="live ? 'true' : undefined"
    role="img"
    aria-label="A Studio agent session drives the board beside it: chart.add, component.add, artboard.update, code.get and video.export."
  >
    <p class="term-task">Compose the renders dashboard · <span class="term-dim">studio a1</span></p>
    <div class="term-ctx" aria-hidden="true">
      <p><span class="term-hi"># dither-studio</span> · Claude Code<span class="term-t tabular-nums">{{ clock(live ? time : 0) }}</span></p>
      <p class="term-dim">[bridge ws://127.0.0.1 · {{ STUDIO_TOOL_COUNT }} tools]</p>
      <p>studio=<span class="term-hi">CONNECTED</span></p>
    </div>
    <div ref="log" class="term-log">
      <div v-for="l in LINES" :key="l.at + l.kind" class="term-line" :data-pending="pending(l.at) ? '' : undefined">
        <p v-if="l.kind === 'prompt'"><span class="term-mark">›</span> <span class="term-hi">{{ l.text }}</span></p>
        <template v-else-if="l.kind === 'tool'">
          <p><span class="term-run">⚙ {{ l.cmd }}</span> <span class="term-dim">·</span> {{ l.args }}</p>
          <p class="term-out"><span class="term-dim">⎿</span> {{ l.out }}</p>
        </template>
        <p v-else><span class="term-run">⏺</span> {{ l.text }}</p>
      </div>
      <p class="term-line term-done" :data-pending="pending(BEATS.flat) ? '' : undefined">
        Done. <span class="chip">7 tools</span> in <span class="chip">8.0s</span><span class="term-t tabular-nums">0:08</span>
      </p>
    </div>
    <div class="term-input" aria-hidden="true">Ready<span class="caret"></span></div>
    <p class="term-status" aria-hidden="true">
      <span>claude-code (auto) · <span class="term-dim">← sessions</span></span>
      <span class="term-ok">Bridge</span>
    </p>
  </div>
</template>

<style scoped>
/* Measured from the reference's terminal half: 12/18 mono, a context
   block on a lifted ground, keywords ember, the rest in greys. */
.term {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 22px 24px 14px;
  font-size: 12px;
  line-height: 18px;
  color: #c6c6c6;
}

.term p {
  margin: 0;
}

.term-task {
  color: var(--swatch-orange);
}

.term-ctx {
  margin-top: 14px;
  padding: 10px 14px;
  background: #1c1d22;
}

.term-t {
  float: right;
  color: #7d7d7d;
}

.term-hi {
  color: #ededed;
}

.term-dim {
  color: #7d7d7d;
}

.term-mark {
  color: #7d7d7d;
}

.term-run {
  color: var(--swatch-orange);
  font-weight: 600;
}

.term-out {
  padding-left: 12px;
  color: #9c9c9c;
}

/* The log: top-down, its overflow hidden (the tail is kept in view). */
.term-log {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 0 12px;
  overflow: hidden;
  /* Lines that scroll off the top fade rather than cut. */
  mask-image: linear-gradient(to bottom, transparent, #000 14px);
}

.term-line {
  flex: none;
}

.term-done .chip {
  padding: 0 4px;
  color: #000;
  background: var(--swatch-orange);
}

.term-ok {
  color: #28c840;
}

.term-input {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 14px;
  color: #7d7d7d;
  background: #1c1d22;
}

.caret {
  width: 7px;
  height: 14px;
  margin-left: 6px;
  background: #ededed;
}

@media (prefers-reduced-motion: no-preference) {
  .caret {
    animation: blink 1s step-end infinite;
  }
  /* A line lands as it stops being pending: the selector starts matching,
     so the animation runs again on every loop. */
  .term[data-live] .term-line:not([data-pending]) {
    animation: line-in 360ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.term[data-live] .term-line[data-pending] {
  display: none;
}

@keyframes line-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.term-status {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  color: #9c9c9c;
  white-space: nowrap;
}
</style>
