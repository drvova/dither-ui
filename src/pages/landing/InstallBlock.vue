<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherClipboard, DitherIcon } from "@dither-kit"

// The install strip: step picker (aria-pressed pickers over a sliding
// slanted thumb) → command frame (prompt in ember, one line)
// → copy, whose success is choreographed in CSS: the line jolts, a beam
// crosses the frame drawing an ember seal around it, the label rolls to
// "Copied" — then the steps under the frame advance (Copy done → Paste now).
// The announcement is DitherClipboard's own live region.
const STEPS = [
  { id: "folder", label: "folder", cmd: "npx degit drvova/dither-ui/dither-kit src/dither-kit" },
  { id: "npm", label: "npm", cmd: "npm i d3-scale d3-shape clsx tailwind-merge" },
  { id: "pnpm", label: "pnpm", cmd: "pnpm add d3-scale d3-shape clsx tailwind-merge" },
  { id: "bun", label: "bun", cmd: "bun add d3-scale d3-shape clsx tailwind-merge" },
]

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
  <div
    ref="strip"
    class="wrap reveal mx-auto w-full max-w-[var(--shell)] px-6"
    :class="shown ? 'in' : ''"
    style="--reveal-delay: 220ms"
  >
    <!-- One soft bar: the step picker on the left (a segmented control),
         the command, the copy. Phones stack the picker above. -->
    <div class="bar">
    <!-- Equal columns make the thumb's travel pure arithmetic (index × its
         own width) — nothing is measured, so it cannot drift from the tabs. -->
    <div role="group" aria-label="Install steps" class="tabs" :style="{ '--i': active, '--n': STEPS.length }">
      <span class="thumb" aria-hidden="true" />
      <button
        v-for="(s, i) in STEPS"
        :key="s.id"
        type="button"
        :aria-pressed="active === i ? 'true' : 'false'"
        class="tab"
        @click="active = i"
      >
        {{ s.label }}
      </button>
    </div>

    <div class="frame">
      <code class="cmd">
        <span class="prompt" aria-hidden="true">$</span><span :key="active" class="typed">{{
          STEPS[active].cmd
        }}</span><span class="caret" aria-hidden="true">▌</span>
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
            <span class="roll" aria-hidden="true"><span><span>Copy</span><span>Copied</span></span></span>
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
          <DitherIcon v-if="taken" name="Check" :size="12" :stroke-width="1.5" class="tick" />Copy
        </li>
        <li :data-s="taken ? 'now' : 'next'">
          <span class="sep" aria-hidden="true">›</span>Paste in a terminal
        </li>
        <li data-s="next">
          <span class="sep" aria-hidden="true">›</span>Import from
          <code>@dither-kit</code>
        </li>
      </ol>
      <a
        href="https://github.com/drvova/dither-ui"
        target="_blank"
        rel="noreferrer"
        class="src"
      >
        <DitherIcon name="ExternalLink" :size="12" :stroke-width="1.5" /> Source on GitHub
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
  gap: 8px;
  padding: 6px;
  border-radius: 12px;
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--line);
}

.bar .tabs {
  flex: none;
}

/* Step picker: a segmented control — equal columns and one soft thumb
   that slides to the picked step. */
.tabs {
  position: relative;
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  padding: 3px;
  border-radius: 9px;
  background: var(--surface-2);
}

.thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / var(--n));
  transform: translateX(calc(var(--i) * 100%));
  border-radius: 6px;
  background: #2b2d33;
  transition: transform 280ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.tab {
  position: relative;
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink-3);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tab:hover {
  color: var(--color-foreground);
}

.tab[aria-pressed="true"] {
  color: var(--ink);
}

.tab:focus-visible {
  outline: 2px solid var(--swatch-blue);
  outline-offset: -2px;
}

/* Command frame: positioned and clipped — the sweep and the seal live inside
   it, so their parked end states can never widen the page. */
.frame {
  position: relative;
  overflow: hidden;
  container-type: inline-size;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 22rem;
  min-width: 0;
  height: 44px;
  padding: 0 0 0 12px;
}

.cmd {
  position: relative;
  flex: 1;
  min-width: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
  font-size: 15px;
  color: var(--color-muted-foreground);
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
  color: var(--color-foreground);
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

.copy {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
  height: 40px;
  padding: 0 14px 0 12px;
  font-size: 13px;
  color: var(--color-muted-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-border) 80%, transparent);
  transition:
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 120ms cubic-bezier(0.4, 0, 0.2, 1);
}

.copy:hover {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 12%, transparent);
}

.copy:active {
  transform: scale(0.96);
}

.copy:focus-visible {
  outline: 2px solid var(--swatch-blue);
  outline-offset: 2px;
}

.copy[data-copied="true"] {
  color: var(--swatch-orange);
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

/* The seal. Edges are 2px ember lines
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
  background: var(--swatch-orange);
}

.seal i:nth-child(1),
.seal i:nth-child(4) {
  top: 0;
  width: 2px;
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
  height: 2px;
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
  gap: 6px 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13.5px;
  color: var(--color-muted-foreground);
}

.steps li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.steps li[data-s="now"] {
  color: var(--color-foreground);
}

.steps li[data-s="done"] {
  color: color-mix(in oklab, var(--color-muted-foreground) 70%, transparent);
}

.steps .tick {
  color: var(--swatch-orange);
}

.steps .sep {
  margin: 0 6px 0 4px;
  color: color-mix(in oklab, var(--color-muted-foreground) 60%, transparent);
}

.steps code {
  color: var(--color-foreground);
}

.src {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  font-size: 13px;
  color: var(--color-muted-foreground);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.src:hover {
  color: var(--color-foreground);
}

.src:focus-visible {
  outline: 2px solid var(--swatch-blue);
  outline-offset: 2px;
}

/* One-shot light sweep across the command row when the strip first shows —
   clipped by the frame, so its parked end state never widens the page. */
.wrap.in .frame::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 36%;
  background: linear-gradient(
    100deg,
    transparent,
    color-mix(in oklab, var(--swatch-blue) 22%, transparent),
    transparent
  );
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
  .thumb,
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
