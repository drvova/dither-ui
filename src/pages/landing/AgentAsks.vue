<script setup lang="ts">
// What an ask makes: the picked ask (`asks.ts`; its picker is the agents'
// third step) in a prompt bubble over the frame it lands as on the Studio's
// dotted canvas (its name over it, every part live), and a caption naming
// the Studio tool call that drew it.
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
  <div id="agent-ask" class="studio-stage">
    <!-- Every ask's words in one cell, only the picked one shown: the
           longest sets the height, so picking one never moves the page. -->
    <div class="stack">
      <p v-for="a in ASKS" :key="a.id" class="ask" :class="{ off: a.id !== ask.id }">
        <span aria-hidden="true">›</span> {{ a.ask }}
      </p>
    </div>
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
            <DitherProgress :value="64" color="blue" />
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
    <div class="stack">
      <p v-for="a in ASKS" :key="a.id" class="drew" :class="{ off: a.id !== ask.id }">
        <DitherIcon name="Sparkles" :size="13" :stroke-width="1.5" class="drew-i" />{{ a.drew }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* The canvas: the Studio's dots, the ask in a prompt bubble, the frame
   (its name over it, as the Studio draws one) and what drew it. */
.studio-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 18px 28px 22px;
  background-image: radial-gradient(circle, color-mix(in oklab, var(--line) 90%, transparent) 1px, transparent 1.2px);
  background-size: 16px 16px;
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

.ask {
  justify-self: start;
  max-width: 34rem;
  margin: 0;
  padding: 9px 14px;
  border-radius: 16px 16px 16px 4px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ink);
  background: var(--shell-ground), var(--background);
  box-shadow:
    inset 0 0 0 1px var(--line),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.ask span {
  color: var(--signal);
}

.board {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(100%, 21rem);
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
  min-height: 13.5rem;
  padding: 18px;
  border-radius: 8px;
  background: var(--background);
  box-shadow: inset 0 0 0 1px var(--line);
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
  height: 10.5rem;
}

.drew {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--ink-3);
}

.drew-i {
  flex: none;
  margin-top: 2px;
}

@media (max-width: 759px) {
  .studio-stage {
    padding: 20px;
  }
}
</style>
