<script lang="ts">
  import {
    DitherAutocomplete,
    DitherCheckboxGroup,
    DitherCombobox,
    DitherRadioGroup,
    DitherSelect,
    DitherToggle,
    DitherToggleGroup,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

  let chart = $state("area")
  const CHARTS = [
    { value: "area", label: "Area" },
    { value: "line", label: "Line" },
    { value: "bar", label: "Bar" },
    { value: "pie", label: "Pie" },
    { value: "radar", label: "Radar" },
  ]

  let swatch = $state("blue")
  const COLORS = ["green", "blue", "purple", "pink", "orange", "red", "grey"].map(
    (c) => ({ value: c, label: c })
  )

  let term = $state("")
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

  let bloomLevel = $state("low")
  const BLOOMS = [
    { value: "off", label: "Off" },
    { value: "low", label: "Low" },
    { value: "high", label: "High" },
    { value: "aura", label: "Aura" },
  ]

  let parts = $state(["grid", "axes"])
  const PARTS = [
    { value: "grid", label: "Grid" },
    { value: "axes", label: "Axes" },
    { value: "legend", label: "Legend" },
    { value: "tooltip", label: "Tooltip" },
  ]

  let bloomOn = $state(true)

  let align = $state<string | string[]>("left")
  const ALIGN = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ]

  let styles = $state<string | string[]>(["bold"])
  const STYLES = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" },
  ]

  const SNIPPET_SELECT = `<script lang="ts">
  import { DitherSelect } from "@dither-kit-svelte"

  let chart = $state("area")
  const CHARTS = [
    { value: "area", label: "Area" },
    { value: "line", label: "Line" },
    { value: "bar", label: "Bar" },
    { value: "pie", label: "Pie" },
    { value: "radar", label: "Radar" },
  ]
<\/script>

<DitherSelect bind:value={chart} options={CHARTS} placeholder="Chart type…" />
<p class="text-[11px] text-muted-foreground">chart: "{chart}"</p>`

  const SNIPPET_COMBOBOX = `<script lang="ts">
  import { DitherCombobox } from "@dither-kit-svelte"

  let swatch = $state("blue")
  const COLORS = ["green", "blue", "purple", "pink", "orange", "red", "grey"].map(
    (c) => ({ value: c, label: c })
  )
<\/script>

<DitherCombobox bind:value={swatch} options={COLORS} color={swatch} />
<p class="text-[11px] text-muted-foreground">swatch: "{swatch}"</p>`

  const SNIPPET_AUTOCOMPLETE = `<script lang="ts">
  import { DitherAutocomplete } from "@dither-kit-svelte"

  let term = $state("")
  const TERMS = ["dither", "dithering", "bayer", "bayer 4x4", "pixel", "pixel art"]
<\/script>

<DitherAutocomplete bind:value={term} suggestions={TERMS} placeholder="Search the docs…" />
<p class="text-[11px] text-muted-foreground">term: "{term}"</p>`

  const SNIPPET_RADIO = `<script lang="ts">
  import { DitherRadioGroup } from "@dither-kit-svelte"

  let bloomLevel = $state("low")
  const BLOOMS = [
    { value: "off", label: "Off" },
    { value: "low", label: "Low" },
    { value: "high", label: "High" },
    { value: "aura", label: "Aura" },
  ]
<\/script>

<DitherRadioGroup bind:value={bloomLevel} options={BLOOMS} label="Bloom level" />
<p class="text-[11px] text-muted-foreground">bloom: "{bloomLevel}"</p>`

  const SNIPPET_CHECKBOX_GROUP = `<script lang="ts">
  import { DitherCheckboxGroup } from "@dither-kit-svelte"

  let parts = $state(["grid", "axes"])
  const PARTS = [
    { value: "grid", label: "Grid" },
    { value: "axes", label: "Axes" },
    { value: "legend", label: "Legend" },
    { value: "tooltip", label: "Tooltip" },
  ]
<\/script>

<DitherCheckboxGroup bind:value={parts} options={PARTS} label="Chart parts" />
<p class="text-[11px] text-muted-foreground">parts: [{parts.join(", ")}]</p>`

  const SNIPPET_TOGGLE = `<script lang="ts">
  import { DitherToggle } from "@dither-kit-svelte"

  let bloomOn = $state(true)
<\/script>

<DitherToggle bind:value={bloomOn}>bloom</DitherToggle>
<p class="text-[11px] text-muted-foreground">bloom: {bloomOn}</p>`

  const SNIPPET_TOGGLE_GROUP = `<script lang="ts">
  import { DitherToggleGroup } from "@dither-kit-svelte"

  let align = $state("left")
  const ALIGN = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ]

  let styles = $state(["bold"])
  const STYLES = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" },
  ]
<\/script>

<DitherToggleGroup bind:value={align} options={ALIGN} />
<DitherToggleGroup bind:value={styles} options={STYLES} type="multiple" />`

  const API: Record<string, PropRow[]> = {
    select: [
      { prop: "options", type: "Option[]", default: "—" },
      { prop: "value", type: "string", default: '""' },
      { prop: "placeholder", type: "string", default: '"Select…"' },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "disabled / invalid", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
    combobox: [
      { prop: "options", type: "Option[]", default: "—" },
      { prop: "value", type: "string", default: '""' },
      { prop: "placeholder", type: "string", default: '"Select…"' },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "disabled", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
    autocomplete: [
      { prop: "suggestions", type: "string[]", default: "—" },
      { prop: "value", type: "string", default: '""' },
      { prop: "placeholder", type: "string", default: '"Search…"' },
      { prop: "disabled", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
    radio: [
      { prop: "options", type: "Option[]", default: "—" },
      { prop: "value", type: "string", default: '""' },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "label", type: "string", default: "—" },
      { prop: "class", type: "string", default: "—" },
    ],
    checkboxGroup: [
      { prop: "options", type: "Option[]", default: "—" },
      { prop: "value", type: "string[]", default: "[]" },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "label", type: "string", default: "—" },
      { prop: "class", type: "string", default: "—" },
    ],
    toggle: [
      { prop: "value", type: "boolean", default: "false" },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "disabled", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
    toggleGroup: [
      { prop: "options", type: "Option[]", default: "—" },
      { prop: "value", type: "string | string[]", default: '""' },
      { prop: "type", type: '"single" | "multiple"', default: '"single"' },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "class", type: "string", default: "—" },
    ],
  }
</script>

<section id="select" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Select</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A listbox behind an input-like trigger — Enter, Space or ArrowDown opens
    the panel, arrows move the highlight, and the picked row carries a small
    dithered swatch. Escape or an outside click closes it.
  </p>
  <DemoCard code={SNIPPET_SELECT}>
    <div class="mx-auto max-w-sm">
      <DitherSelect bind:value={chart} options={CHARTS} placeholder="Chart type…" />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
        chart: "{chart}"
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.select} />
</section>

<section id="combobox" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Combobox</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A select whose trigger is an input — typing filters the options
    (case-insensitive), Enter picks the highlighted match, and blur snaps the
    text back to the last valid value.
  </p>
  <DemoCard code={SNIPPET_COMBOBOX}>
    <div class="mx-auto max-w-sm">
      <DitherCombobox bind:value={swatch} options={COLORS} color={swatch} />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
        swatch: "{swatch}"
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.combobox} />
</section>

<section id="autocomplete" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Autocomplete</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A free-text input with suggestions — anything you type is the value;
    picking a row just fills the input. Try
    <code class="text-foreground/80">dither</code>,
    <code class="text-foreground/80">bayer</code> or
    <code class="text-foreground/80">pixel</code>.
  </p>
  <DemoCard code={SNIPPET_AUTOCOMPLETE}>
    <div class="mx-auto max-w-sm">
      <DitherAutocomplete bind:value={term} suggestions={TERMS} placeholder="Search the docs…" />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
        term: "{term}"
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.autocomplete} />
</section>

<section id="radio" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Radio</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A radiogroup of pixel circles — unchecked rings are a 1px pixel border,
    the checked one fills its inner dot with the Bayer texture. Arrow keys
    move and select (roving tabindex).
  </p>
  <DemoCard code={SNIPPET_RADIO}>
    <div class="mx-auto max-w-sm">
      <DitherRadioGroup bind:value={bloomLevel} options={BLOOMS} label="Bloom level" />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
        bloom: "{bloomLevel}"
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.radio} />
</section>

<section id="checkbox-group" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Checkbox Group</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A labelled group of DitherCheckboxes bound to one string array — toggling
    a box adds or removes its option's value.
  </p>
  <DemoCard code={SNIPPET_CHECKBOX_GROUP}>
    <div class="mx-auto max-w-sm">
      <DitherCheckboxGroup bind:value={parts} options={PARTS} label="Chart parts" />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">
        parts: [{parts.join(", ")}]
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.checkboxGroup} />
</section>

<section id="toggle" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Toggle</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A pressed-state button — off is a quiet border, on fills behind the label
    with the badge's dithered gradient. Label goes in the default slot.
  </p>
  <DemoCard code={SNIPPET_TOGGLE}>
    <div class="mx-auto max-w-sm text-center">
      <DitherToggle bind:value={bloomOn}>bloom</DitherToggle>
      <p class="mt-4 font-mono text-[11px] text-muted-foreground">
        bloom: {bloomOn}
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.toggle} />
</section>

<section id="toggle-group" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Toggle Group</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A bordered row of toggles — <code class="text-foreground/80">single</code>
    behaves like a radio group (one value, arrows move), while
    <code class="text-foreground/80">multiple</code> keeps each button
    independently pressed against a string array.
  </p>
  <DemoCard code={SNIPPET_TOGGLE_GROUP}>
    <div class="mx-auto grid max-w-sm justify-items-center gap-4">
      <DitherToggleGroup bind:value={align} options={ALIGN} />
      <DitherToggleGroup bind:value={styles} options={STYLES} type="multiple" />
      <p class="font-mono text-[11px] text-muted-foreground">
        align: "{align}" · styles: [{(styles as string[]).join(", ")}]
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.toggleGroup} />
</section>
