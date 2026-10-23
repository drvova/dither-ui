<script setup lang="ts">
// The workbench's settings (one set for every preview): the overlay's
// colours, the copy format, layout bands, snapping, measurements, keeping
// annotations, how stills are taken; restore the defaults; clear this
// preview's annotations.
import { computed } from "vue"
import { sounds } from "@/shared/lib/sound"
import { useBench } from "../context"
import { COLOR_FORMATS } from "../model/color"
import { canShareTab } from "../model/capture"
import { DEFAULT_SETTINGS, SWATCHES, swatch, type Swatch } from "../model/settings"
import { ICONS } from "../model/tools"
import Icon from "./Icon.vue"

const b = useBench()
const COLORS: { key: "highlight" | "guide" | "annotate"; label: string }[] = [
  { key: "highlight", label: "highlight" },
  { key: "guide", label: "guides & distances" },
  { key: "annotate", label: "arrows & notes" },
]
const TOGGLES: { key: "layout" | "snap" | "multiMeasure" | "persist"; label: string }[] = [
  { key: "layout", label: "padding, margin and gap bands" },
  { key: "snap", label: "snap guides and arrows to edges" },
  { key: "multiMeasure", label: "keep every Alt+S measurement" },
  { key: "persist", label: "keep annotations across visits" },
]
const setColor = (key: "highlight" | "guide" | "annotate", s: Swatch) => (b.settings[key] = s)
// The site's interface-sounds switch (the docs header has it too).
const soundsOn = computed({ get: () => sounds.value, set: (on: boolean) => (sounds.value = on) })
</script>

<template>
  <section class="wb-settings" aria-label="Workbench settings">
    <header class="row">
      <span class="micro">Settings</span>
      <span class="dim">for every preview</span>
      <span class="spacer" />
      <button type="button" class="act" aria-label="Close settings" @click="b.panel.value = null">
        <Icon :d="ICONS.close" :size="12" />
      </button>
    </header>
    <div v-for="c in COLORS" :key="c.key" class="row" role="radiogroup" :aria-label="`${c.label} colour`">
      <span class="label">{{ c.label }}</span>
      <button
        v-for="s in SWATCHES"
        :key="s"
        type="button"
        role="radio"
        class="chipsw"
        :aria-checked="b.settings[c.key] === s"
        :aria-label="s"
        :style="{ background: swatch(s) }"
        @click="setColor(c.key, s)"
      />
    </div>
    <div class="row">
      <span class="label">copy colours as</span>
      <div class="seg" role="group" aria-label="Colour format">
        <button
          v-for="f in COLOR_FORMATS"
          :key="f"
          type="button"
          :aria-pressed="b.settings.format === f"
          @click="b.settings.format = f"
        >
          {{ f }}
        </button>
      </div>
    </div>
    <label v-for="t in TOGGLES" :key="t.key" class="check">
      <input v-model="b.settings[t.key]" type="checkbox" />
      {{ t.label }}
    </label>
    <label class="check">
      <input v-model="soundsOn" type="checkbox" />
      interface sounds (the whole site)
    </label>
    <div class="row">
      <span class="label">stills</span>
      <div class="seg" role="group" aria-label="How stills are taken">
        <button type="button" :aria-pressed="b.settings.stills === 'dom'" @click="b.settings.stills = 'dom'">
          render the page
        </button>
        <button
          type="button"
          :aria-pressed="b.settings.stills === 'screen'"
          :disabled="!canShareTab()"
          @click="b.settings.stills = 'screen'"
        >
          exact pixels (shares the tab)
        </button>
      </div>
    </div>
    <div class="row">
      <span class="label">tray</span>
      <div class="seg" role="group" aria-label="Where the tray docks">
        <button type="button" :aria-pressed="b.settings.tray === 'bottom'" @click="b.settings.tray = 'bottom'">
          bottom
        </button>
        <button type="button" :aria-pressed="b.settings.tray === 'top'" @click="b.settings.tray = 'top'">top</button>
      </div>
    </div>
    <div class="row">
      <button type="button" class="act" @click="Object.assign(b.settings, DEFAULT_SETTINGS)">Restore defaults</button>
      <button type="button" class="act" @click="b.clearAll()">Clear this preview's annotations</button>
    </div>
  </section>
</template>

<style scoped>
.wb-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  border-radius: 8px;
  font-size: 11px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.spacer {
  flex: 1;
}

.dim {
  color: var(--color-muted-foreground);
}

.label {
  min-width: 140px;
  color: var(--color-muted-foreground);
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  color: var(--color-muted-foreground);
}

.check input {
  accent-color: var(--color-foreground);
}

.chipsw {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 25%, transparent);
}

.chipsw[aria-checked="true"] {
  outline: 2px solid var(--color-foreground);
  outline-offset: 2px;
}

.act,
.seg > button {
  display: inline-flex;
  align-items: center;
  min-width: 24px;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 5px;
  color: var(--color-muted-foreground);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.act:hover,
.seg > button:hover:not(:disabled) {
  color: var(--color-foreground);
}

.seg {
  display: flex;
  gap: 3px;
}

.seg > button {
  box-shadow: none;
}

.seg > button:disabled {
  opacity: 0.4;
}

.seg > button[aria-pressed="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 24%, transparent);
}
</style>
