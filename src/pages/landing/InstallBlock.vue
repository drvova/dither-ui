<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherClipboard, DitherIcon } from "@dither-kit"

// The install strip, rebuilt to the reference's exact anatomy: step pill
// (aria-pressed pickers) → command frame (one line, prompt in ember, muted
// flags, white host) → copy button with a stable polite live region →
// "Copy → Paste in a terminal → Run" steps that advance on copy. The sweep
// and jolt are one-shot CSS (IO latch / :has on the clipboard's copied flag).
const STEPS = [
  { id: "folder", label: "folder", cmd: "npx degit drvova/dither-ui/dither-kit src/dither-kit" },
  { id: "npm", label: "npm", cmd: "npm i d3-scale d3-shape clsx tailwind-merge" },
  { id: "pnpm", label: "pnpm", cmd: "pnpm add d3-scale d3-shape clsx tailwind-merge" },
  { id: "bun", label: "bun", cmd: "bun add d3-scale d3-shape clsx tailwind-merge" },
]

const active = ref(0)
const cmd = ref(STEPS[0].cmd)
const strip = ref<HTMLElement | null>(null)
const shown = ref(false)
let io: IntersectionObserver | null = null

function pick(i: number) {
  active.value = i
  cmd.value = STEPS[i].cmd
}

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
    class="wrap reveal mx-auto w-full max-w-2xl"
    :class="shown ? 'in' : ''"
    style="--reveal-delay: 220ms"
  >
    <div role="group" aria-label="Install steps" class="flex items-stretch">
      <button
        v-for="(s, i) in STEPS"
        :key="s.id"
        type="button"
        :aria-pressed="active === i ? 'true' : 'false'"
        class="tab"
        :class="active === i ? 'is-on' : ''"
        @click="pick(i)"
      >
        {{ s.label }}
      </button>
    </div>

    <div class="frame" :class="shown ? 'in' : ''">
      <code class="cmd">
        <span class="prompt" aria-hidden="true">$</span><span :key="active" class="typed">{{
          cmd
        }}</span><span class="caret" aria-hidden="true">▌</span>
      </code>
      <DitherClipboard :value="cmd">
        <template #default="{ copied }">
          <button
            type="button"
            class="copy"
            :data-copied="copied ? 'true' : 'false'"
            :aria-label="copied ? 'Copied' : 'Copy command'"
          >
            <DitherIcon :name="copied ? 'Check' : 'Copy'" :size="13" />
            <span aria-hidden="true">{{ copied ? "Copied" : "Copy" }}</span>
          </button>
        </template>
      </DitherClipboard>
      <span class="sr-only" role="status" aria-live="polite" />
    </div>

    <div class="under">
      <ol class="steps" aria-label="What happens next">
        <li data-s="now">Copy</li>
        <li data-s="next">
          <DitherIcon name="ArrowRight" :size="12" class="sep" />Paste in a terminal
        </li>
        <li data-s="next">
          <DitherIcon name="ArrowRight" :size="12" class="sep" />Import from
          <code>@dither-kit</code>
        </li>
      </ol>
      <a
        href="https://github.com/drvova/dither-ui"
        target="_blank"
        rel="noreferrer"
        class="src"
      >
        <DitherIcon name="ExternalLink" :size="12" /> Source on GitHub
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

/* Step pill: the reference's segmented control — flat track, quiet text,
   active text turns white. (Its traveling thumb needs measured offsets per
   OS icon set; text-only pickers stay honest at every width.) */
.tab {
  padding: 8px 14px 7px;
  font-size: 11.5px;
  color: var(--color-muted-foreground);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tab:hover {
  color: var(--color-foreground);
}

.tab.is-on {
  color: var(--color-foreground);
}

.tab:focus-visible {
  outline: 2px solid var(--swatch-blue);
  outline-offset: 2px;
}

/* Command frame: full-width, hairline inset, 56px — the reference's
   .lp-in-frame, square-cornered for the pixel identity. */
.frame {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 56px;
  padding: 0 10px 0 18px;
  background: color-mix(in oklab, #000 55%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-border) 90%, transparent);
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.frame:has(.copy[data-copied="true"]) {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--swatch-blue) 60%, var(--color-border));
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

.frame:has(.copy[data-copied="true"]) .copy {
  color: var(--swatch-blue);
}

/* Under-row: steps advance on copy (data-s echoes the clipboard flag),
   source link sits quiet at the right. */
.under {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 20px;
  width: 100%;
  padding: 0 10px;
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

.steps .sep {
  color: var(--color-muted-foreground);
  margin-right: 2px;
}

.steps code {
  color: var(--color-foreground);
}

.src {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-muted-foreground);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.src:hover {
  color: var(--color-foreground);
}

.src:focus-visible,
.steps code:focus-visible {
  outline: 2px solid var(--swatch-blue);
  outline-offset: 2px;
}

/* One-shot light sweep across the command row when the strip first shows. */
.wrap.in .frame::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
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

.wrap {
  position: relative;
}

@keyframes sweep {
  from {
    transform: translateX(-140%);
    opacity: 1;
  }
  to {
    transform: translateX(360%);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .caret {
    animation: none;
  }
  .typed {
    animation: none;
  }
  .frame:has(.copy[data-copied="true"]) .cmd {
    animation: none;
  }
  .wrap.in .frame::after {
    animation: none;
    display: none;
  }
  .steps li {
    transition: none;
  }
}
</style>
