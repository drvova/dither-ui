<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherClipboard, DitherIcon } from "@dither-kit"
import ToolMark from "@/shared/ui/ToolMark.vue"
import { RUNTIME_DEPS } from "./facts"

// The install strip: step picker (the site's segmented aria-pressed
// toggles, each under its mark: the kit's folder glyph, then npm, pnpm and
// Bun's own), the command (ember prompt, one line) and copy, whose success is
// one gesture in CSS: the command shows selected while the key, ringed,
// rolls to "Copied" under a check; both let go together when the copy
// settles, the selection stepping out like the films' pixel fade. The
// steps under the frame, each under its glyph, advance (copy done, paste
// now). The announcement is DitherClipboard's own live region.
const STEPS = [
  { id: "folder", label: "folder", cmd: "npx degit drvova/dither-ui/dither-kit src/dither-kit" },
  { id: "npm", label: "npm", cmd: `npm i ${RUNTIME_DEPS.join(" ")}` },
  { id: "pnpm", label: "pnpm", cmd: `pnpm add ${RUNTIME_DEPS.join(" ")}` },
  { id: "bun", label: "bun", cmd: `bun add ${RUNTIME_DEPS.join(" ")}` },
] as const

// What the folder step lands in a repo: the kit's layers and its tokens,
// as the docs' Quick start aliases and imports them (`docs/install.ts`).
const LANDS = [
  {
    path: "dither-kit/engine/",
    icon: "Folder",
    line: "The dither, the palettes, the clock and every canvas. Plain TypeScript, no styling.",
  },
  {
    path: "dither-kit/tailwind/",
    icon: "Folder",
    line: "Every component, authored with Tailwind. Point the @dither-kit alias here.",
  },
  {
    path: "dither-kit/stylex/",
    icon: "Folder",
    line: "The same components in StyleX, generated from the Tailwind layer. Or alias here.",
  },
  {
    path: "dither-kit/engine/theme.css",
    icon: "Palette",
    line: "The tokens as plain custom properties. Import it once and retheme the whole kit.",
  },
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

    <section class="lands" aria-labelledby="lands-h">
      <h2 id="lands-h" class="list-h">What lands in your repo</h2>
      <ul class="lands-list">
        <li v-for="f in LANDS" :key="f.path">
          <code class="lands-path"><DitherIcon :name="f.icon" :size="13" :stroke-width="1.5" />{{ f.path }}</code>
          <p class="lands-p">{{ f.line }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

/* A capsule, as a Y2K device's command strip: the hairline with a gloss
   on its top edge. */
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 10px;
  border-radius: 999px;
  background: var(--pearl);
  box-shadow:
    inset 0 0 0 1px var(--line),
    inset 0 1px 0 rgb(255 255 255 / 0.07);
}

/* Wrapped onto two rows, the capsule eases to a rounded slab. */
@media (max-width: 639px) {
  .bar {
    border-radius: 24px;
  }
}

.bar .seg {
  flex: none;
}

/* Command frame: positioned and clipped; the glint lives inside it, so its
   parked end state can never widen the page. */
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
  border-radius: 999px;
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

/* Copied: the command shows selected, a breath of ink behind the text the
   clipboard now holds (the shadow pads it without moving a glyph). It
   lands at once and steps out in three when the copy settles. */
.typed {
  border-radius: 2px;
  transition:
    background-color 360ms steps(3, jump-end),
    box-shadow 360ms steps(3, jump-end);
}

.frame:has(.copy[data-copied="true"]) .typed {
  background-color: color-mix(in oklab, var(--foreground) 16%, transparent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--foreground) 16%, transparent);
  transition-duration: 0s;
}

.caret {
  margin-left: 4px;
  font-size: 11px;
  color: var(--swatch-orange);
  animation: blink 1.1s steps(2, jump-none) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Copy: the site's hairline key. */
.copy {
  position: relative;
  z-index: 1;
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
    box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 120ms cubic-bezier(0.4, 0, 0.2, 1);
}

.copy:hover {
  color: var(--ink);
  background: color-mix(in oklab, var(--foreground) 7%, transparent);
}

.copy:active {
  transform: scale(0.96);
}

/* While copied the key is the site's pressed state (.ring-on). */
.copy[data-copied="true"] {
  color: var(--foreground);
  background: color-mix(in oklab, var(--foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 24%, transparent);
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
   (opacity and a little scale) on the label roll's beat instead of popping
   between two mounted icons. */
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
  scale: 0.6;
}

.swap-a,
.swap-b {
  transition:
    opacity 380ms cubic-bezier(0.16, 1, 0.3, 1),
    scale 380ms cubic-bezier(0.16, 1, 0.3, 1);
}

.copy[data-copied="true"] .swap-a {
  opacity: 0;
  scale: 0.6;
}

.copy[data-copied="true"] .swap-b {
  opacity: 1;
  scale: 1;
}

.roll > span > span {
  display: block;
}

.copy[data-copied="true"] .roll > span {
  transform: translateY(-1.3em);
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

/* What lands in your repo: four columns split by hairlines (two under
   900px, one under 560px), each a mono path under its glyph and a line. */
.lands {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding: 0 2px;
}

.lands-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
  box-shadow: inset 0 1px 0 var(--line);
}

.lands-list li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 18px 4px;
}

.lands-list li:first-child {
  padding-left: 0;
}

.lands-list li + li {
  box-shadow: inset 1px 0 0 var(--line);
}

.lands-path {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ink);
}

.lands-path :deep(svg) {
  flex: none;
  color: var(--ink-3);
}

.lands-p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
  text-wrap: pretty;
}

@media (max-width: 899px) {
  .lands-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lands-list li:nth-child(odd) {
    padding-left: 0;
    box-shadow: none;
  }
  .lands-list li:nth-child(n + 3) {
    border-top: 1px solid var(--line);
  }
}

@media (max-width: 559px) {
  .lands-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .lands-list li,
  .lands-list li + li {
    padding-left: 0;
    padding-right: 0;
    box-shadow: none;
  }
  .lands-list li + li {
    border-top: 1px solid var(--line);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roll > span,
  .steps li,
  .swap-a,
  .swap-b,
  .typed {
    transition: none;
  }
  .caret,
  .typed {
    animation: none;
  }
  .wrap.in .frame::after {
    display: none;
  }
}
</style>
