<script setup lang="ts">
import { ref } from "vue"
import {
  DitherAutocomplete,
  DitherCheckboxGroup,
  DitherCombobox,
  DitherRadioGroup,
  DitherSelect,
  DitherToggle,
  DitherToggleGroup,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const chart = ref("area")
const CHARTS = [
  { value: "area", label: "Area" },
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "pie", label: "Pie" },
  { value: "radar", label: "Radar" },
]

const swatch = ref("blue")
const COLORS = ["green", "blue", "purple", "pink", "orange", "red", "grey"].map(
  (c) => ({ value: c, label: c })
)

const term = ref("")
const TERMS = [
  "dither",
  "dithering",
  "dither kit",
  "bayer",
  "bayer 4x4",
  "bayer matrix",
  "pixel",
  "pixel art",
  "pixelated",
]

const bloomLevel = ref("low")
const BLOOMS = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "aura", label: "Aura" },
]

const parts = ref(["grid", "axes"])
const PARTS = [
  { value: "grid", label: "Grid" },
  { value: "axes", label: "Axes" },
  { value: "legend", label: "Legend" },
  { value: "tooltip", label: "Tooltip" },
]

const bloomOn = ref(true)

const align = ref("left")
const ALIGN = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

const styles = ref(["bold"])
const STYLES = [
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "underline", label: "Underline" },
]

const SNIPPET_SELECT = `<script setup lang="ts">
import { ref } from "vue"
import { DitherSelect } from "@dither-kit"

const chart = ref("area")
const CHARTS = [
  { value: "area", label: "Area" },
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "pie", label: "Pie" },
  { value: "radar", label: "Radar" },
]
<\/script>

<template>
  <DitherSelect v-model="chart" :options="CHARTS" placeholder="Chart type…" />
  <p class="text-[11px] text-muted-foreground">chart: "{{ chart }}"</p>
</template>`

const SNIPPET_COMBOBOX = `<script setup lang="ts">
import { ref } from "vue"
import { DitherCombobox } from "@dither-kit"

const swatch = ref("blue")
const COLORS = ["green", "blue", "purple", "pink", "orange", "red", "grey"].map(
  (c) => ({ value: c, label: c })
)
<\/script>

<template>
  <DitherCombobox v-model="swatch" :options="COLORS" :color="swatch" />
  <p class="text-[11px] text-muted-foreground">swatch: "{{ swatch }}"</p>
</template>`

const SNIPPET_AUTOCOMPLETE = `<script setup lang="ts">
import { ref } from "vue"
import { DitherAutocomplete } from "@dither-kit"

const term = ref("")
const TERMS = ["dither", "dithering", "bayer", "bayer 4x4", "pixel", "pixel art"]
<\/script>

<template>
  <DitherAutocomplete v-model="term" :suggestions="TERMS" placeholder="Search the docs…" />
  <p class="text-[11px] text-muted-foreground">term: "{{ term }}"</p>
</template>`

const SNIPPET_RADIO = `<script setup lang="ts">
import { ref } from "vue"
import { DitherRadioGroup } from "@dither-kit"

const bloomLevel = ref("low")
const BLOOMS = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "aura", label: "Aura" },
]
<\/script>

<template>
  <DitherRadioGroup v-model="bloomLevel" :options="BLOOMS" label="Bloom level" />
  <p class="text-[11px] text-muted-foreground">bloom: "{{ bloomLevel }}"</p>
</template>`

const SNIPPET_CHECKBOX_GROUP = `<script setup lang="ts">
import { ref } from "vue"
import { DitherCheckboxGroup } from "@dither-kit"

const parts = ref(["grid", "axes"])
const PARTS = [
  { value: "grid", label: "Grid" },
  { value: "axes", label: "Axes" },
  { value: "legend", label: "Legend" },
  { value: "tooltip", label: "Tooltip" },
]
<\/script>

<template>
  <DitherCheckboxGroup v-model="parts" :options="PARTS" label="Chart parts" />
  <p class="text-[11px] text-muted-foreground">parts: [{{ parts.join(", ") }}]</p>
</template>`

const SNIPPET_TOGGLE = `<script setup lang="ts">
import { ref } from "vue"
import { DitherToggle } from "@dither-kit"

const bloomOn = ref(true)
<\/script>

<template>
  <DitherToggle v-model="bloomOn">bloom</DitherToggle>
  <p class="text-[11px] text-muted-foreground">bloom: {{ bloomOn }}</p>
</template>`

const SNIPPET_TOGGLE_GROUP = `<script setup lang="ts">
import { ref } from "vue"
import { DitherToggleGroup } from "@dither-kit"

const align = ref("left")
const ALIGN = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

const styles = ref(["bold"])
const STYLES = [
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "underline", label: "Underline" },
]
<\/script>

<template>
  <DitherToggleGroup v-model="align" :options="ALIGN" />
  <DitherToggleGroup v-model="styles" :options="STYLES" type="multiple" />
</template>`

const API: Record<string, PropRow[]> = {
  select: [
    { prop: "options", type: "Option[]", default: "—" },
    { prop: "modelValue", type: "string", default: "—" },
    { prop: "placeholder", type: "string", default: '"Select…"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled / invalid", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
  combobox: [
    { prop: "options", type: "Option[]", default: "—" },
    { prop: "modelValue", type: "string", default: "—" },
    { prop: "placeholder", type: "string", default: '"Select…"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
  autocomplete: [
    { prop: "suggestions", type: "string[]", default: "—" },
    { prop: "modelValue", type: "string", default: "—" },
    { prop: "placeholder", type: "string", default: '"Search…"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
  radio: [
    { prop: "options", type: "Option[]", default: "—" },
    { prop: "modelValue", type: "string", default: "—" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "label", type: "string", default: "—" },
    { prop: "class", type: "string", default: "—" },
  ],
  checkboxGroup: [
    { prop: "options", type: "Option[]", default: "—" },
    { prop: "modelValue", type: "string[]", default: "—" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "label", type: "string", default: "—" },
    { prop: "class", type: "string", default: "—" },
  ],
  toggle: [
    { prop: "modelValue", type: "boolean", default: "—" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
  toggleGroup: [
    { prop: "options", type: "Option[]", default: "—" },
    { prop: "modelValue", type: "string | string[]", default: "—" },
    { prop: "type", type: '"single" | "multiple"', default: '"single"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "class", type: "string", default: "—" },
  ],
}
</script>

<template>
  <section id="select" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Select</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A listbox behind an input-like trigger — Enter, Space or ArrowDown opens
      the panel, arrows move the highlight, and the picked row carries a small
      dithered swatch. Escape or an outside click closes it.
    </p>
    <DemoCard :code="SNIPPET_SELECT">
      <div class="mx-auto max-w-sm">
        <DitherSelect v-model="chart" :options="CHARTS" placeholder="Chart type…" />
        <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
          chart: "{{ chart }}"
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.select" />
  </section>

  <section id="combobox" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Combobox</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A select whose trigger is an input — typing filters the options
      (case-insensitive), Enter picks the highlighted match, and blur snaps the
      text back to the last valid value.
    </p>
    <DemoCard :code="SNIPPET_COMBOBOX">
      <div class="mx-auto max-w-sm">
        <DitherCombobox v-model="swatch" :options="COLORS" :color="swatch" />
        <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
          swatch: "{{ swatch }}"
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.combobox" />
  </section>

  <section id="autocomplete" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Autocomplete</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A free-text input with suggestions — anything you type is the value;
      picking a row just fills the input. Try
      <code class="text-foreground/80">dither</code>,
      <code class="text-foreground/80">bayer</code> or
      <code class="text-foreground/80">pixel</code>.
    </p>
    <DemoCard :code="SNIPPET_AUTOCOMPLETE">
      <div class="mx-auto max-w-sm">
        <DitherAutocomplete v-model="term" :suggestions="TERMS" placeholder="Search the docs…" />
        <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
          term: "{{ term }}"
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.autocomplete" />
  </section>

  <section id="radio" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Radio</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A radiogroup of pixel circles — unchecked rings are a 1px pixel border,
      the checked one fills its inner dot with the Bayer texture. Arrow keys
      move and select (roving tabindex).
    </p>
    <DemoCard :code="SNIPPET_RADIO">
      <div class="mx-auto max-w-sm">
        <DitherRadioGroup v-model="bloomLevel" :options="BLOOMS" label="Bloom level" />
        <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
          bloom: "{{ bloomLevel }}"
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.radio" />
  </section>

  <section id="checkbox-group" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Checkbox Group</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A labelled group of DitherCheckboxes bound to one string array — toggling
      a box adds or removes its option's value.
    </p>
    <DemoCard :code="SNIPPET_CHECKBOX_GROUP">
      <div class="mx-auto max-w-sm">
        <DitherCheckboxGroup v-model="parts" :options="PARTS" label="Chart parts" />
        <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
          parts: [{{ parts.join(", ") }}]
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.checkboxGroup" />
  </section>

  <section id="toggle" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Toggle</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A pressed-state button — off is a quiet border, on fills behind the label
      with the badge's dithered gradient. Label goes in the default slot.
    </p>
    <DemoCard :code="SNIPPET_TOGGLE">
      <div class="mx-auto max-w-sm text-center">
        <DitherToggle v-model="bloomOn">bloom</DitherToggle>
        <p class="mt-4 font-mono text-[11px] text-muted-foreground">
          bloom: {{ bloomOn }}
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.toggle" />
  </section>

  <section id="toggle-group" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Toggle Group</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A bordered row of toggles — <code class="text-foreground/80">single</code>
      behaves like a radio group (one value, arrows move), while
      <code class="text-foreground/80">multiple</code> keeps each button
      independently pressed against a string array.
    </p>
    <DemoCard :code="SNIPPET_TOGGLE_GROUP">
      <div class="mx-auto grid max-w-sm justify-items-center gap-4">
        <DitherToggleGroup v-model="align" :options="ALIGN" />
        <DitherToggleGroup v-model="styles" :options="STYLES" type="multiple" />
        <p class="font-mono text-[11px] text-muted-foreground">
          align: "{{ align }}" · styles: [{{ styles.join(", ") }}]
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.toggleGroup" />
  </section>
</template>
