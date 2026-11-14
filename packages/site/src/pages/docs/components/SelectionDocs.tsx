import { createSignal } from "solid-js"
import {
  DitherAutocomplete,
  DitherCheckboxGroup,
  DitherCombobox,
  DitherRadioGroup,
  DitherSelect,
  DitherToggle,
  DitherToggleGroup,
  DitherWheelPicker,
  type PixelColor,
} from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { type PropRow } from "../PropsTable"
import DocSection from "../DocSection"

const CHARTS = [
  { value: "area", label: "Area" },
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "pie", label: "Pie" },
  { value: "radar", label: "Radar" },
]

const COLORS = ["green", "blue", "purple", "pink", "orange", "red", "grey"].map((c) => ({ value: c, label: c }))

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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

const BLOOMS = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "aura", label: "Aura" },
]

const PARTS = [
  { value: "grid", label: "Grid" },
  { value: "axes", label: "Axes" },
  { value: "legend", label: "Legend" },
  { value: "tooltip", label: "Tooltip" },
]

const ALIGN = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

const STYLES = [
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "underline", label: "Underline" },
]

const SNIPPET_SELECT = `import { createSignal } from "solid-js"
import { DitherSelect } from "@dither-kit"

export default function Example() {
  const [chart, setChart] = createSignal("area")
  const CHARTS = [
    { value: "area", label: "Area" },
    { value: "line", label: "Line" },
    { value: "bar", label: "Bar" },
    { value: "pie", label: "Pie" },
    { value: "radar", label: "Radar" },
  ]

  return (
    <>
      <DitherSelect modelValue={chart()} onUpdateModelValue={setChart} options={CHARTS} placeholder="Chart type…" />
      <p class="text-[11px] text-muted-foreground">chart: "{chart()}"</p>
    </>
  )
}`

const SNIPPET_COMBOBOX = `import { createSignal } from "solid-js"
import { DitherCombobox } from "@dither-kit"

export default function Example() {
  const [swatch, setSwatch] = createSignal("blue")
  const COLORS = ["green", "blue", "purple", "pink", "orange", "red", "grey"].map(
    (c) => ({ value: c, label: c })
  )

  return (
    <>
      <DitherCombobox modelValue={swatch()} onUpdateModelValue={setSwatch} options={COLORS} color={swatch()} />
      <p class="text-[11px] text-muted-foreground">swatch: "{swatch()}"</p>
    </>
  )
}`

const SNIPPET_AUTOCOMPLETE = `import { createSignal } from "solid-js"
import { DitherAutocomplete } from "@dither-kit"

export default function Example() {
  const [term, setTerm] = createSignal("")
  const TERMS = ["dither", "dithering", "bayer", "bayer 4x4", "pixel", "pixel art"]

  return (
    <>
      <DitherAutocomplete modelValue={term()} onUpdateModelValue={setTerm} suggestions={TERMS} placeholder="Search the docs…" />
      <p class="text-[11px] text-muted-foreground">term: "{term()}"</p>
    </>
  )
}`

const SNIPPET_WHEEL = `import { createSignal } from "solid-js"
import { DitherWheelPicker } from "@dither-kit"

export default function Example() {
  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))
  const [hour, setHour] = createSignal("09")
  const [minute, setMinute] = createSignal("30")

  return (
    <>
      {/* wheels compose side by side; each is one drum */}
      <div class="flex items-center gap-1">
        <DitherWheelPicker modelValue={hour()} onUpdateModelValue={setHour} options={HOURS} label="Hour" />
        <span class="text-muted-foreground">:</span>
        <DitherWheelPicker modelValue={minute()} onUpdateModelValue={setMinute} options={MINUTES} label="Minute" color="green" />
      </div>
    </>
  )
}`

const SNIPPET_RADIO = `import { createSignal } from "solid-js"
import { DitherRadioGroup } from "@dither-kit"

export default function Example() {
  const [bloomLevel, setBloomLevel] = createSignal("low")
  const BLOOMS = [
    { value: "off", label: "Off" },
    { value: "low", label: "Low" },
    { value: "high", label: "High" },
    { value: "aura", label: "Aura" },
  ]

  return (
    <>
      <DitherRadioGroup modelValue={bloomLevel()} onUpdateModelValue={setBloomLevel} options={BLOOMS} label="Bloom level" />
      <p class="text-[11px] text-muted-foreground">bloom: "{bloomLevel()}"</p>
    </>
  )
}`

const SNIPPET_CHECKBOX_GROUP = `import { createSignal } from "solid-js"
import { DitherCheckboxGroup } from "@dither-kit"

export default function Example() {
  const [parts, setParts] = createSignal(["grid", "axes"])
  const PARTS = [
    { value: "grid", label: "Grid" },
    { value: "axes", label: "Axes" },
    { value: "legend", label: "Legend" },
    { value: "tooltip", label: "Tooltip" },
  ]

  return (
    <>
      <DitherCheckboxGroup modelValue={parts()} onUpdateModelValue={setParts} options={PARTS} label="Chart parts" />
      <p class="text-[11px] text-muted-foreground">parts: [{parts().join(", ")}]</p>
    </>
  )
}`

const SNIPPET_TOGGLE = `import { createSignal } from "solid-js"
import { DitherToggle } from "@dither-kit"

export default function Example() {
  const [bloomOn, setBloomOn] = createSignal(true)

  return (
    <>
      <DitherToggle modelValue={bloomOn()} onUpdateModelValue={setBloomOn}>bloom</DitherToggle>
      <p class="text-[11px] text-muted-foreground">bloom: {bloomOn()}</p>
    </>
  )
}`

const SNIPPET_TOGGLE_GROUP = `import { createSignal } from "solid-js"
import { DitherToggleGroup } from "@dither-kit"

export default function Example() {
  const [align, setAlign] = createSignal("left")
  const ALIGN = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ]

  const [styles, setStyles] = createSignal(["bold"])
  const STYLES = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" },
  ]

  return (
    <>
      <DitherToggleGroup modelValue={align()} onUpdateModelValue={setAlign} options={ALIGN} />
      <DitherToggleGroup modelValue={styles()} onUpdateModelValue={setStyles} options={STYLES} type="multiple" />
    </>
  )
}`

const API: Record<string, PropRow[]> = {
  select: [
    { prop: "options", type: "Option[]", default: "" },
    { prop: "modelValue", type: "string", default: "" },
    { prop: "placeholder", type: "string", default: '"Select…"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled / invalid", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "" },
  ],
  combobox: [
    { prop: "options", type: "Option[]", default: "" },
    { prop: "modelValue", type: "string", default: "" },
    { prop: "placeholder", type: "string", default: '"Select…"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "" },
  ],
  autocomplete: [
    { prop: "suggestions", type: "string[]", default: "" },
    { prop: "modelValue", type: "string", default: "" },
    { prop: "placeholder", type: "string", default: '"Search…"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "" },
  ],
  wheelPicker: [
    { prop: "options", type: "(string | { value, label })[]", default: "" },
    { prop: "modelValue", type: "string (with onUpdateModelValue)", default: "" },
    { prop: "rows", type: "number: visible rows (odd)", default: "5" },
    { prop: "label", type: "string: accessible name", default: '"Wheel picker"' },
    { prop: "color", type: "PixelColor: selected notch tint", default: '"blue"' },
    { prop: "class", type: "string", default: "" },
  ],
  radio: [
    { prop: "options", type: "Option[]", default: "" },
    { prop: "modelValue", type: "string", default: "" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "label", type: "string", default: "" },
    { prop: "class", type: "string", default: "" },
  ],
  checkboxGroup: [
    { prop: "options", type: "Option[]", default: "" },
    { prop: "modelValue", type: "string[]", default: "" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "label", type: "string", default: "" },
    { prop: "class", type: "string", default: "" },
  ],
  toggle: [
    { prop: "modelValue", type: "boolean", default: "" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "" },
  ],
  toggleGroup: [
    { prop: "options", type: "Option[]", default: "" },
    { prop: "modelValue", type: "string | string[]", default: "" },
    { prop: "type", type: '"single" | "multiple"', default: '"single"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "class", type: "string", default: "" },
  ],
}

export default function SelectionDocs() {
  const [chart, setChart] = createSignal("area")
  const [swatch, setSwatch] = createSignal("blue")
  const [term, setTerm] = createSignal("")
  const [wheelHour, setWheelHour] = createSignal("09")
  const [wheelMinute, setWheelMinute] = createSignal("30")
  const [bloomLevel, setBloomLevel] = createSignal("low")
  const [parts, setParts] = createSignal(["grid", "axes"])
  const [bloomOn, setBloomOn] = createSignal(true)
  const [align, setAlign] = createSignal("left")
  const [styles, setStyles] = createSignal(["bold"])

  return (
    <>
      <DocSection id="select">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A listbox behind an input-like trigger: Enter, Space or ArrowDown opens the panel, arrows move the highlight,
          and the picked row carries a small dithered swatch. Escape or an outside click closes it.
        </p>
        <DemoCard code={SNIPPET_SELECT}>
          <div class="mx-auto max-w-sm">
            <DitherSelect
              modelValue={chart()}
              onUpdateModelValue={setChart}
              options={CHARTS}
              placeholder="Chart type…"
            />
            <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">chart: "{chart()}"</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.select} />
      </DocSection>

      <DocSection id="combobox">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A select whose trigger is an input: typing filters the options (case-insensitive), Enter picks the highlighted
          match, and blur snaps the text back to the last valid value.
        </p>
        <DemoCard code={SNIPPET_COMBOBOX}>
          <div class="mx-auto max-w-sm">
            <DitherCombobox
              modelValue={swatch()}
              onUpdateModelValue={setSwatch}
              options={COLORS}
              color={swatch() as PixelColor}
            />
            <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">swatch: "{swatch()}"</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.combobox} />
      </DocSection>

      <DocSection id="autocomplete">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A free-text input with suggestions: anything you type is the value; picking a row just fills the input. Try{" "}
          <code class="text-foreground/80">dither</code>, <code class="text-foreground/80">bayer</code> or{" "}
          <code class="text-foreground/80">pixel</code>.
        </p>
        <DemoCard code={SNIPPET_AUTOCOMPLETE}>
          <div class="mx-auto max-w-sm">
            <DitherAutocomplete
              modelValue={term()}
              onUpdateModelValue={setTerm}
              suggestions={TERMS}
              placeholder="Search the docs…"
            />
            <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">term: "{term()}"</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.autocomplete} />
      </DocSection>

      <DocSection id="wheel-picker">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An iOS-style picker wheel: a 3D drum on native momentum scroll that snaps to the nearest notch, steered by
          wheel, drag or spinbutton keys. Wheels compose side by side for date and time pickers; reduced motion flattens
          the drum.
        </p>
        <DemoCard code={SNIPPET_WHEEL}>
          <div class="flex flex-col items-center gap-4">
            <div class="flex items-center gap-1">
              <DitherWheelPicker
                modelValue={wheelHour()}
                onUpdateModelValue={setWheelHour}
                options={HOURS}
                label="Hour"
              />
              <span class="text-muted-foreground">:</span>
              <DitherWheelPicker
                modelValue={wheelMinute()}
                onUpdateModelValue={setWheelMinute}
                options={MINUTES}
                label="Minute"
                color="green"
              />
            </div>
            <p class="font-mono text-[11px] text-muted-foreground">
              time: {wheelHour()}:{wheelMinute()}
            </p>
          </div>
        </DemoCard>
        <PropsTable rows={API.wheelPicker} />
      </DocSection>

      <DocSection id="radio">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A radiogroup of pixel circles: unchecked rings are a 1px pixel border, the checked one fills its inner dot
          with the Bayer texture. Arrow keys move and select (roving tabindex).
        </p>
        <DemoCard code={SNIPPET_RADIO}>
          <div class="mx-auto max-w-sm">
            <DitherRadioGroup
              modelValue={bloomLevel()}
              onUpdateModelValue={setBloomLevel}
              options={BLOOMS}
              label="Bloom level"
            />
            <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">bloom: "{bloomLevel()}"</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.radio} />
      </DocSection>

      <DocSection id="checkbox-group">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A labelled group of DitherCheckboxes bound to one string array: toggling a box adds or removes its option's
          value.
        </p>
        <DemoCard code={SNIPPET_CHECKBOX_GROUP}>
          <div class="mx-auto max-w-sm">
            <DitherCheckboxGroup
              modelValue={parts()}
              onUpdateModelValue={setParts}
              options={PARTS}
              label="Chart parts"
            />
            <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">parts: [{parts().join(", ")}]</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.checkboxGroup} />
      </DocSection>

      <DocSection id="toggle">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A pressed-state button: off is a quiet border, on fills behind the label with the badge's dithered gradient.
          Label goes in as children.
        </p>
        <DemoCard code={SNIPPET_TOGGLE}>
          <div class="mx-auto max-w-sm text-center">
            <DitherToggle modelValue={bloomOn()} onUpdateModelValue={setBloomOn}>
              bloom
            </DitherToggle>
            <p class="mt-4 font-mono text-[11px] text-muted-foreground">bloom: {String(bloomOn())}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.toggle} />
      </DocSection>

      <DocSection id="toggle-group">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A bordered row of toggles: <code class="text-foreground/80">single</code> behaves like a radio group (one
          value, arrows move), while <code class="text-foreground/80">multiple</code> keeps each button independently
          pressed against a string array.
        </p>
        <DemoCard code={SNIPPET_TOGGLE_GROUP}>
          <div class="mx-auto grid max-w-sm justify-items-center gap-4">
            <DitherToggleGroup modelValue={align()} onUpdateModelValue={(v) => setAlign(v as string)} options={ALIGN} />
            <DitherToggleGroup
              modelValue={styles()}
              onUpdateModelValue={(v) => setStyles(v as string[])}
              options={STYLES}
              type="multiple"
            />
            <p class="font-mono text-[11px] text-muted-foreground">
              align: "{align()}", styles: [{styles().join(", ")}]
            </p>
          </div>
        </DemoCard>
        <PropsTable rows={API.toggleGroup} />
      </DocSection>
    </>
  )
}
