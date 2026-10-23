<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherClipboard, DitherIcon } from "@dither-kit"
import ToolMark from "@/shared/ui/ToolMark.vue"
import { RUNTIME_DEPS } from "./facts"

// The install strip: step picker (the site's segmented aria-pressed
// toggles, each under its mark: the kit's folder glyph, then npm, pnpm and
// Bun's own), the command (ember prompt, one line) and copy, whose success is
// choreographed in CSS: the line jolts, a beam crosses the frame drawing a
// hairline seal around it, the label rolls to "Copied", and the steps
// under the frame, each under its glyph, advance (copy done, paste now).
// The announcement is DitherClipboard's own live region.
const STEPS = [
  { id: "folder", label: "folder", cmd: "npx degit drvova/dither-ui/dither-kit src/dither-kit" },
  { id: "npm", label: "npm", cmd: `npm i ${RUNTIME_DEPS.join(" ")}` },
  { id: "pnpm", label: "pnpm", cmd: `pnpm add ${RUNTIME_DEPS.join(" ")}` },
  { id: "bun", label: "bun", cmd: `bun add ${RUNTIME_DEPS.join(" ")}` },
] as const

const active = ref(0)
// Latched on the first successful copy: the next step is pasting it.
const taken = ref(false)
const strip = ref<HTMLElement | null>(null)
const shown = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  // Decorative reveal only: without IO (jsdom) the strip is simply shown.
  if (typeof IntersectionObserver === "undefined") {
    shown.value = true
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        shown.value = true
        io?.disconnect()
        io = null
      }
    },
    { threshold: 0.35 },
  )
  if (strip.value) io.observe(strip.value)
})

onBeforeUnmount(() => {
  io?.disconnect()
  io = null
})
</script>

<template>
  <div ref="strip" class="wrap" :class="shown ? 'in' : ''">
    <!-- One hairline bar: the step picker on the left, the command, the
         copy. Phones wrap the picker above. -->
    <div class="bar">
      <div role="group" aria-label="Install steps" class="seg">
        <button
          v-for="(s, i) in STEPS"
          :key="s.id"
          type="button"
          :aria-pressed="active === i ? 'true' : 'false'"
          @click="active = i"
        >
          <DitherIcon v-if="s.id === 'folder'" name="Folder" :size="12" :stroke-width="1.5" />
          <ToolMark v-else :id="s.id" :size="12" />
          {{ s.label }}
        </button>
      </div>

      <div class="frame">
        <code class="cmd">
          <span class="prompt" aria-hidden="true">$</span
          ><span :key="active" class="typed">{{ STEPS[active].cmd }}</span
          ><span class="caret" aria-hidden="true">▌</span>
        </code>
        <DitherClipboard :value="STEPS[active].cmd" @copied="taken = true">
          <template #default="{ copied }">
            <button
              type="button"
              class="copy"
              :data-copied="copied ? 'true' : 'false'"
              :aria-label="copied ? 'Copied' : 'Copy command'"
            >
              <span class="swap" aria-hidden="true">
                <DitherIcon name="Copy" :size="13" :stroke-width="1.5" class="swap-a" />
                <DitherIcon name="Check" :size="13" :stroke-width="1.5" class="swap-b" />
              </span>
              <span class="roll" aria-hidden="true"
                ><span><span>Copy</span><span>Copied</span></span></span
              >
            </button>
          </template>
        </DitherClipboard>
        <!-- The seal: left edge drops, the beam crosses drawing top and bottom,
           the right edge closes it. -->
        <span class="seal" aria-hidden="true"><i /><i /><i /><i /><b /></span>
      </div>
    </div>

    <div class="under">
      <ol class="steps" aria-label="What happens next">
        <li :data-s="taken ? 'done' : 'now'">
          <span class="sep"><DitherIcon :name="taken ? 'Check' : 'Copy'" :size="11" :stroke-width="1.5" /></span>Copy
          the command
        </li>
        <li :data-s="taken ? 'now' : 'next'">
          <span class="sep"><DitherIcon name="Terminal" :size="11" :stroke-width="1.5" /></span>Paste it in a terminal
        </li>
        <li data-s="next">
          <span class="sep"><DitherIcon name="Code" :size="11" :stroke-width="1.5" /></span>Import from
          <code>@dither-kit</code>
        </li>
      </ol>
      <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="src">
        <ToolMark id="github" :size="13" />Source on GitHub<span class="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 10px;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px var(--line);
}

.bar .seg {
  flex: none;
}

/* Command frame: positioned and clipped — the sweep and the seal live
   inside it, so their parked end states can never widen the page. */
.frame {
  position: relative;
  overflow: hidden;
  container-type: inline-size;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 22rem;
  min-width: 0;
  height: 34px;
  padding: 0 0 0 6px;
  border-radius: 6px;
}

.cmd {
  position: relative;
  flex: 1;
  min-width: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}

.cmd::-webkit-scrollbar {
  display: none;
}

.prompt {
  color: var(--swatch-orange);
  margin-right: 10px;
}

.typed {
  color: var(--ink);
  animation: term-in 240ms cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes term-in {
  0% {
    opacity: 0;
    transform: translateX(-4px);
  }
}

.caret {
  margin-left: 2px;
  font-size: 11px;
  color: var(--swatch-orange);
  animation: blink 1.1s steps(2, jump-none) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* The measured lp-cl-jolt: an elastic sideways kick of the whole line on
   copy; :has() re-arms it on every fresh flag. */
.frame:has(.copy[data-copied="true"]) .cmd {
  animation: jolt 420ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes jolt {
  0%,
  100% {
    transform: translateX(0) skewX(0);
  }
  16% {
    transform: translateX(12px) skewX(-14deg);
  }
  48% {
    transform: translateX(-4px) skewX(5deg);
  }
  72% {
    transform: translateX(1px) skewX(-1deg);
  }
}

/* Copy: the site's hairline key. */
.copy {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
  height: 30px;
  padding: 0 11px 0 9px;
  border-radius: 6px;
  font-size: 11.5px;
  color: var(--ink-2);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--line) 100%, transparent);
  transition:
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 120ms cubic-bezier(0.4, 0, 0.2, 1);
}

.copy:hover {
  color: var(--ink);
  background: color-mix(in oklab, var(--foreground) 7%, transparent);
}

.copy:active {
  transform: scale(0.96);
}

.copy[data-copied="true"] {
  color: var(--ink);
}

/* Label roll: both words stacked in a one-line window; copy slides the
   column up with a little overshoot. The window keeps the button's width
   steady at the longer word. */
.roll {
  display: block;
  height: 1.3em;
  line-height: 1.3em;
  overflow: hidden;
}

.roll > span {
  display: block;
  transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Icon swap: both glyphs stay in the DOM, stacked; copy cross-fades them
   (scale 0.25→1, opacity 0→1, blur 4px→0) so the swap breathes with the
   label roll instead of popping between two mounted icons. */
.swap {
  position: relative;
  display: block;
  width: 13px;
  height: 13px;
}

.swap-b {
  position: absolute;
  inset: 0;
  opacity: 0;
  scale: 0.25;
  filter: blur(4px);
}

.swap-a,
.swap-b {
  transition:
    opacity 380ms cubic-bezier(0.2, 0, 0, 1),
    scale 380ms cubic-bezier(0.2, 0, 0, 1),
    filter 380ms cubic-bezier(0.2, 0, 0, 1);
}

.copy[data-copied="true"] .swap-a {
  opacity: 0;
  scale: 0.25;
  filter: blur(4px);
}

.copy[data-copied="true"] .swap-b {
  opacity: 1;
  scale: 1;
  filter: blur(0px);
}

.roll > span > span {
  display: block;
}

.copy[data-copied="true"] .roll > span {
  transform: translateY(-1.3em);
}

/* The seal. Edges are 1px ink lines
   drawn by scale from their origin; the beam is the pen that draws the long
   edges, so it shares their timing exactly. */
/* The seal is its own size container: the beam's 100cqw is then the frame's
   full padding box (the frame's content box is narrowed by its padding, and
   the beam would park inside the edge, over the button). */
.seal {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: none;
  container-type: inline-size;
  pointer-events: none;
}

.frame:has(.copy[data-copied="true"]) .seal {
  display: block;
}

.seal i,
.seal b {
  position: absolute;
  background: var(--ink);
}

.seal i:nth-child(1),
.seal i:nth-child(4) {
  top: 0;
  width: 1px;
  height: 100%;
  transform-origin: 50% 0;
  animation: seal-down 130ms cubic-bezier(0.35, 0, 0.5, 1) 135ms both;
}

.seal i:nth-child(1) {
  left: 0;
}

.seal i:nth-child(4) {
  right: 0;
  animation-delay: 430ms;
}

.seal i:nth-child(2),
.seal i:nth-child(3) {
  left: 0;
  width: 100%;
  height: 1px;
  transform-origin: 0 50%;
  animation: seal-across 420ms cubic-bezier(0.4, 0, 0.75, 0.4) 135ms both;
}

.seal i:nth-child(2) {
  top: 0;
}

.seal i:nth-child(3) {
  bottom: 0;
}

.seal b {
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  animation: seal-beam 420ms cubic-bezier(0.4, 0, 0.75, 0.4) 135ms both;
}

@keyframes seal-down {
  from {
    transform: scaleY(0);
  }
}

@keyframes seal-across {
  from {
    transform: scaleX(0);
  }
}

@keyframes seal-beam {
  from {
    transform: translateX(-6px);
  }
  to {
    transform: translateX(calc(100cqw + 6px));
  }
}

/* Under-row: steps advance on the first copy (done → now → next), source
   link sits quiet at the right. */
.under {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 20px;
  width: 100%;
  padding: 0 2px;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 22px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--ink-3);
}

.steps li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.steps li[data-s="now"] {
  color: var(--ink);
}

.steps li[data-s="done"] {
  color: var(--ink-3);
}

.steps .sep {
  display: inline-grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border-radius: 4px;
  color: var(--ink-3);
  box-shadow: inset 0 0 0 1px var(--line);
}

.steps li[data-s="now"] .sep {
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink-3);
}

.steps code {
  color: var(--ink);
}

.src {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  font-size: 12px;
  color: var(--ink-3);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.src:hover {
  color: var(--ink);
}

/* One-shot glint across the command when the strip first shows — clipped
   by the frame, so its parked end state never widens the page. */
.wrap.in .frame::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 36%;
  background: linear-gradient(100deg, transparent, rgb(255 255 255 / 0.1), transparent);
  animation: sweep 900ms cubic-bezier(0.4, 0, 0.2, 1) 380ms both;
  pointer-events: none;
}

@keyframes sweep {
  from {
    transform: translateX(-100%);
    opacity: 1;
  }
  to {
    transform: translateX(calc(100cqw + 100%));
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roll > span,
  .steps li,
  .swap-a,
  .swap-b {
    transition: none;
  }
  .caret,
  .typed,
  .frame:has(.copy[data-copied="true"]) .cmd {
    animation: none;
  }
  /* The seal still marks success — drawn whole, without travel. */
  .seal i,
  .seal b {
    animation: none;
  }
  .seal b,
  .wrap.in .frame::after {
    display: none;
  }
}
</style>
