<script setup lang="ts">
import { ref } from "vue"
import { DitherClipboard, DitherIcon } from "@dither-kit"
import ToolMark from "@/shared/ui/ToolMark.vue"
import { RUNTIME_DEPS } from "./facts"

// The command box: its top row the step picker (the site's segmented
// aria-pressed toggles, each under its mark: the kit's folder glyph, then
// npm, pnpm and Bun's own) and the copy key, the command under them (the
// ember prompt, one line). A copy is one gesture in CSS: the command shows
// selected while the key rolls to "Copied" under a check; both let go
// together when the copy settles. The announcement is DitherClipboard's
// own live region.
const STEPS = [
  { id: "folder", label: "folder", cmd: "npx degit drvova/dither-ui/dither-kit src/dither-kit" },
  { id: "npm", label: "npm", cmd: `npm i ${RUNTIME_DEPS.join(" ")}` },
  { id: "pnpm", label: "pnpm", cmd: `pnpm add ${RUNTIME_DEPS.join(" ")}` },
  { id: "bun", label: "bun", cmd: `bun add ${RUNTIME_DEPS.join(" ")}` },
] as const

const active = ref(0)
</script>

<template>
  <div class="box">
    <div class="box-top">
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
      <DitherClipboard :value="STEPS[active].cmd">
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
    <div class="frame">
      <code class="cmd">
        <span class="prompt" aria-hidden="true">$</span><span :key="active" class="typed">{{ STEPS[active].cmd }}</span
        ><span class="caret" aria-hidden="true">▌</span>
      </code>
    </div>
  </div>
</template>

<style scoped>
/* The box: the raised ground, no border; the picker and the copy key on
   its top row (their filled shapes take the page's ground), the command
   under them. */
.box {
  overflow: hidden;
  border-radius: 16px;
  background: var(--surface);
}

.box-top {
  --surface: var(--background);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px 0 12px;
}

.frame {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 56px;
  padding: 0 18px;
}

.cmd {
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
  color: var(--signal);
  margin-right: 10px;
}

.typed {
  border-radius: 2px;
  color: var(--ink);
  animation: term-in 240ms cubic-bezier(0.4, 0, 0.2, 1) both;
  transition:
    background-color 360ms steps(3, jump-end),
    box-shadow 360ms steps(3, jump-end);
}

@keyframes term-in {
  0% {
    opacity: 0;
    transform: translateX(-4px);
  }
}

/* Copied: the command shows selected, the page's ground behind the text
   the clipboard now holds (the shadow pads it without moving a glyph). It
   lands at once and steps out in three when the copy settles. */
.box:has(.copy[data-copied="true"]) .typed {
  background-color: var(--background);
  box-shadow: 0 0 0 4px var(--background);
  transition-duration: 0s;
}

.caret {
  margin-left: 4px;
  font-size: 11px;
  color: var(--signal);
  animation: blink 1.1s steps(2, jump-none) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Copy: a filled key. */
.copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
  height: 30px;
  padding: 0 11px 0 9px;
  border-radius: 7px;
  font-size: 11.5px;
  color: var(--ink-3);
  background: var(--surface);
  transition:
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 120ms cubic-bezier(0.4, 0, 0.2, 1);
}

.copy:hover,
.copy[data-copied="true"] {
  color: var(--ink);
}

.copy:active {
  transform: scale(0.96);
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

.roll > span > span {
  display: block;
}

.copy[data-copied="true"] .roll > span {
  transform: translateY(-1.3em);
}

/* Icon swap: both glyphs stay in the DOM, stacked; copy cross-fades them
   on the label roll's beat instead of popping between two mounted icons. */
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

@media (forced-colors: active) {
  .copy {
    border: 1px solid ButtonText;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roll > span,
  .swap-a,
  .swap-b,
  .typed {
    transition: none;
  }
  .caret,
  .typed {
    animation: none;
  }
}
</style>
