<script setup lang="ts">
// What an ask makes (after dithercn.dev's stage): the frame the picked ask
// (`asks.ts`) lands as, on the Studio's dotted canvas, its name over it and
// every part live; the ask in a prompt bar across the stage's foot; under
// the stage, the Studio tool call that drew it.
import { computed, ref } from "vue"
import {
  Bar,
  BarChart,
  DitherCheckbox,
  DitherEmailInput,
  DitherHeading,
  DitherIcon,
  DitherNumberText,
  DitherProgress,
  DitherSwitch,
  DitherText,
  Tooltip,
  XAxis,
  type DitherColor,
} from "@dither-kit"
import { ASKS } from "./asks"

const props = defineProps<{ at: number }>()
const ask = computed(() => ASKS[props.at] ?? ASKS[0])

const auto = ref(true)
const email = ref("")
const changelog = ref(true)
const VISITS = [
  { day: "Mon", visits: 420 },
  { day: "Tue", visits: 510 },
  { day: "Wed", visits: 480 },
  { day: "Thu", visits: 620 },
  { day: "Fri", visits: 590 },
  { day: "Sat", visits: 340 },
  { day: "Sun", visits: 300 },
]
const VISITS_CONFIG = { visits: { label: "Visits", color: "blue" as DitherColor } }
</script>

<template>
  <figure id="agent-ask" class="ask-fig">
    <div class="stage">
      <div class="board">
        <span class="board-name">{{ ask.frame }}</span>
        <div class="board-frame">
          <template v-if="ask.id === 'deploys'">
            <DitherHeading level="3">Deploys</DitherHeading>
            <div class="board-row">
              <DitherNumberText :value="16" class="board-n" />
              <DitherText tone="muted" size="xs">deploys this week</DitherText>
            </div>
            <div class="board-meter">
              <DitherText tone="muted" size="xs">Build minutes, 64% used</DitherText>
              <DitherProgress :value="64" color="blue" aria-label="Build minutes" />
            </div>
            <div class="board-switch">
              <DitherSwitch v-model="auto" label="Auto deploy" />
              <span aria-hidden="true">Auto deploy</span>
            </div>
          </template>
          <template v-else-if="ask.id === 'signup'">
            <DitherHeading level="3">Join the beta</DitherHeading>
            <DitherText tone="muted" size="sm">One email when a release ships.</DitherText>
            <DitherEmailInput v-model="email" aria-label="Email" />
            <DitherCheckbox v-model="changelog">Send me the changelog</DitherCheckbox>
          </template>
          <BarChart v-else :data="VISITS" :config="VISITS_CONFIG" class="board-chart">
            <XAxis data-key="day" />
            <Bar data-key="visits" />
            <Tooltip label-key="day" />
          </BarChart>
        </div>
      </div>
      <!-- The ask, as it was sent: every ask's words in one cell, only the
           picked one shown, so the bar never changes height. -->
      <div class="prompt capsule">
        <div class="stack">
          <p v-for="a in ASKS" :key="a.id" class="prompt-t" :class="{ off: a.id !== ask.id }">{{ a.ask }}</p>
        </div>
        <span class="send" aria-hidden="true"><DitherIcon name="ArrowUp" :size="14" :stroke-width="1.75" /></span>
      </div>
    </div>
    <figcaption class="stack">
      <span v-for="a in ASKS" :key="a.id" class="drew" :class="{ off: a.id !== ask.id }">
        <DitherIcon name="Sparkles" :size="13" :stroke-width="1.5" class="drew-i" />{{ a.drew }}
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.ask-fig {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

/* The stage: the Studio's canvas (its dots), wide and tall, the frame in
   its middle and the prompt bar over its foot. */
.stage {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 460px;
  padding: 40px 24px 112px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 24px;
  background:
    radial-gradient(circle, color-mix(in oklab, var(--line) 90%, transparent) 1px, transparent 1.2px) 0 0 / 16px 16px,
    var(--well);
}

.stack {
  display: grid;
}

.stack > * {
  grid-area: 1 / 1;
}

.stack > .off {
  visibility: hidden;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(100%, 24rem);
}

.board-name {
  font-size: 11px;
  color: var(--ink-3);
}

/* One height for every frame. */
.board-frame {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  min-height: 13rem;
  padding: 20px;
  border-radius: 10px;
  background: var(--background);
  box-shadow:
    inset 0 0 0 1px var(--line),
    var(--float-shadow);
}

.board-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.board-n {
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.board-meter {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.board-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ink-2);
}

.board-chart {
  height: 10rem;
}

/* The prompt bar: a smoked capsule across the stage's foot, the ask in it
   and the send key at its end (the ask has been sent: it is a picture of
   the message, not a field). */
.prompt {
  position: absolute;
  left: 50%;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(100% - 48px, 42rem);
  padding: 12px 10px 12px 22px;
  border-radius: 999px;
  translate: -50% 0;
}

.prompt .stack {
  flex: 1;
  min-width: 0;
}

.prompt-t {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink);
  text-wrap: pretty;
}

.send {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  color: #101214;
  background: var(--chrome-key);
  box-shadow: inset 0 0 0 1px var(--chrome-key-ring);
}

.drew {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-left: 4px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ink-3);
}

.drew-i {
  flex: none;
  margin-top: 2px;
}

@media (max-width: 639px) {
  .stage {
    min-height: 420px;
    padding: 28px 16px 132px;
  }
  .prompt {
    width: calc(100% - 24px);
    bottom: 12px;
    border-radius: 22px;
  }
}
</style>
