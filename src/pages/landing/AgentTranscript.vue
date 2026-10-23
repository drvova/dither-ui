<script setup lang="ts">
// The hero's left half: the Studio's own Agent panel (widgets/agent) in a
// session, worn as it is in the app — the head with its harness chip and
// LED, one transcript in the panel's notation (`›` the prompt, `⚙ tool ·
// args ⎿ result` per Studio tool call, `⏺` prose, `✻ working…` while the
// turn runs), the composer and the status line. Tool names are the real
// `STUDIO_TOOLS` a harness calls, and the lines land on the hero film's
// beats (`hero-beats.ts`), so the panel and the board tell one story.
// Every line is always in the DOM; while the film runs the root carries the
// `data-live` latch and lines still ahead of the film's moment are
// `data-pending` (hidden), so the session loops with the film. The
// prerender strips the latch: the static bytes show the whole session, as
// does no player, or reduced motion paused on the still.
import { computed, nextTick, ref, watch } from "vue"
import { STUDIO_TOOL_COUNT } from "./facts"
import { BEATS } from "./hero-beats"

const props = defineProps<{ time: number; live: boolean }>()

type Line =
  | { at: number; kind: "prompt"; text: string }
  | { at: number; kind: "tool"; name: string; args: string; out: string }
  | { at: number; kind: "prose"; text: string }

const LINES: Line[] = [
  { at: 0, kind: "prompt", text: "lay out a renders dashboard, then show me its layers" },
  { at: BEATS.tilt, kind: "tool", name: "add_chart", args: "area · renders", out: "a1 · 1040×600" },
  { at: BEATS.exploded, kind: "tool", name: "add_component", args: "DitherSwitch, DitherButton", out: "on a1 · 4 layers" },
  { at: BEATS.reseed, kind: "tool", name: "update_artboard", args: "a1 · seed 513", out: "re-dithered" },
  { at: BEATS.flipOn, kind: "tool", name: "update_artboard", args: "switch · checked", out: "ok" },
  { at: BEATS.press, kind: "tool", name: "get_code", args: "a1 · tailwind", out: "a1.vue" },
  { at: BEATS.unseed, kind: "tool", name: "update_artboard", args: "a1 · seed 512", out: "ok" },
  { at: BEATS.fold, kind: "tool", name: "export_video", args: "a1 · 30 fps", out: "video/a1/index.html" },
  { at: BEATS.flat, kind: "prose", text: "One board, four paint layers, one dither rule." },
]

const pending = (at: number) => props.live && props.time < at
const working = computed(() => props.live && props.time < BEATS.flat)
// The log reads top-down; when a narrow column overflows it, the newest
// line stays in view.
const log = ref<HTMLElement | null>(null)
const shown = computed(() => LINES.filter((l) => !pending(l.at)).length)
watch(shown, () => nextTick(() => log.value && (log.value.scrollTop = log.value.scrollHeight)))
const secs = (t: number) => `${t.toFixed(1)}s`
</script>

<template>
  <div
    class="panel"
    :data-live="live ? 'true' : undefined"
    role="img"
    aria-label="The Studio's Agent panel in a session: Claude Code calls add_chart, add_component, update_artboard, get_code and export_video on the board beside it."
  >
    <div class="head" aria-hidden="true">
      <span class="title">Agent</span>
      <span class="chip"><span class="led"></span>claude code</span>
      <span class="chip">default</span>
      <span class="head-t tabular-nums">{{ secs(live ? time : BEATS.flat) }}</span>
    </div>
    <div ref="log" class="log">
      <div v-for="l in LINES" :key="l.at + l.kind" class="entry" :data-kind="l.kind" :data-pending="pending(l.at) ? '' : undefined">
        <template v-if="l.kind === 'tool'">
          <span class="mark">⚙</span>
          <span class="text"><span class="name">{{ l.name }}</span> <span class="dim">{{ l.args }}</span> <span class="out">⎿ {{ l.out }}</span></span>
        </template>
        <template v-else>
          <span class="mark">{{ l.kind === "prompt" ? "›" : "⏺" }}</span>
          <span class="text">{{ l.text }}</span>
        </template>
      </div>
      <div v-if="working" class="entry" data-kind="system">
        <span class="mark spin">✻</span>
        <span class="text dim">working… {{ secs(time) }} <span class="faint">(esc to stop)</span></span>
      </div>
    </div>
    <div class="composer" aria-hidden="true">
      <span class="prompt-mark">›</span>
      <span class="placeholder">what should the studio build?</span>
      <span class="run">run</span>
    </div>
    <p class="status" aria-hidden="true">
      <span class="dim">claude code</span><span class="sep">·</span><span>{{ STUDIO_TOOL_COUNT }} studio tools</span><span class="sep">·</span><span class="dim">bridge on 127.0.0.1</span>
      <span class="auto">auto</span>
    </p>
  </div>
</template>

<style scoped>
/* The Agent panel's own measures (widgets/agent/AgentPanel.vue): 12px mono,
   a 36px head, hairline seams, chips on a 6% lift — square, as everything
   on the landing is. */
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  font-size: 12px;
  line-height: 1.55;
  color: var(--color-muted-foreground);
}

.panel p {
  margin: 0;
}

.head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 2.25rem;
  padding: 0 14px;
  font-size: 11px;
  border-bottom: 1px solid var(--border);
}

.title {
  margin-right: 4px;
  color: var(--color-foreground);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  font-size: 10.5px;
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
}

.chip .led {
  width: 6px;
  height: 6px;
  background: var(--swatch-green);
  animation: none;
}

.head-t {
  margin-left: auto;
}

.log {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  overflow: hidden;
  /* Lines that scroll off the top fade rather than cut. */
  mask-image: linear-gradient(to bottom, transparent, #000 14px);
}

.entry {
  display: grid;
  flex: none;
  grid-template-columns: 1.1rem minmax(0, 1fr);
  gap: 4px;
}

.mark {
  color: var(--color-muted-foreground);
}

.entry[data-kind="prompt"] .mark {
  color: var(--swatch-orange);
}

.entry[data-kind="prompt"] .text,
.entry[data-kind="prose"] .text,
.name {
  color: var(--color-foreground);
}

.dim {
  color: var(--color-muted-foreground);
}

.faint,
.out {
  color: color-mix(in oklab, var(--color-muted-foreground) 70%, transparent);
}

.composer {
  display: grid;
  flex: none;
  grid-template-columns: 1rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 8px 14px;
  border-top: 1px solid var(--border);
}

.prompt-mark {
  color: var(--swatch-orange);
}

.placeholder {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: color-mix(in oklab, var(--color-muted-foreground) 70%, transparent);
}

.run {
  padding: 2px 9px;
  font-size: 11px;
  color: var(--color-accent-foreground);
  background: var(--color-accent);
  opacity: 0.35;
}

.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 10px;
  white-space: nowrap;
  border-top: 1px solid var(--border);
}

.sep {
  opacity: 0.5;
}

.auto {
  margin-left: auto;
  color: var(--swatch-orange);
}

@media (prefers-reduced-motion: no-preference) {
  .spin {
    display: inline-block;
    animation: spin 1.6s steps(8) infinite;
  }
  /* A line lands as it stops being pending: the selector starts matching,
     so the animation runs again on every loop. */
  .panel[data-live] .entry:not([data-pending]) {
    animation: line-in 360ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.panel[data-live] .entry[data-pending] {
  display: none;
}

@keyframes line-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
