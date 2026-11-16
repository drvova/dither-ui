import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import selectProps from "virtual:dither-props/DitherSelect"
import comboboxProps from "virtual:dither-props/DitherCombobox"
import autocompleteProps from "virtual:dither-props/DitherAutocomplete"
import wheelPickerProps from "virtual:dither-props/DitherWheelPicker"
import radioGroupProps from "virtual:dither-props/DitherRadioGroup"
import checkboxGroupProps from "virtual:dither-props/DitherCheckboxGroup"
import toggleProps from "virtual:dither-props/DitherToggle"
import toggleGroupProps from "virtual:dither-props/DitherToggleGroup"
import DocSection from "../DocSection"
import SelectExample from "./examples/select"
import selectCode from "./examples/select.tsx?raw"
import ComboboxExample from "./examples/combobox"
import comboboxCode from "./examples/combobox.tsx?raw"
import AutocompleteExample from "./examples/autocomplete"
import autocompleteCode from "./examples/autocomplete.tsx?raw"
import WheelPickerExample from "./examples/wheel-picker"
import wheelPickerCode from "./examples/wheel-picker.tsx?raw"
import RadioExample from "./examples/radio"
import radioCode from "./examples/radio.tsx?raw"
import CheckboxGroupExample from "./examples/checkbox-group"
import checkboxGroupCode from "./examples/checkbox-group.tsx?raw"
import ToggleExample from "./examples/toggle"
import toggleCode from "./examples/toggle.tsx?raw"
import ToggleGroupExample from "./examples/toggle-group"
import toggleGroupCode from "./examples/toggle-group.tsx?raw"

export const API: Record<string, PropRow[]> = {
  select: kitTable(selectProps, { join: [["disabled", "invalid"]] }),
  combobox: kitTable(comboboxProps),
  autocomplete: kitTable(autocompleteProps),
  wheelPicker: kitTable(wheelPickerProps),
  radio: kitTable(radioGroupProps),
  checkboxGroup: kitTable(checkboxGroupProps),
  toggle: kitTable(toggleProps),
  toggleGroup: kitTable(toggleGroupProps),
}

export default function SelectionDocs() {
  return (
    <>
      <DocSection id="select">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A listbox behind an input-like trigger: Enter, Space or ArrowDown opens the panel, arrows move the highlight,
          and the picked row carries a small dithered swatch. Escape or an outside click closes it.
        </p>
        <DemoCard code={selectCode}>
          <SelectExample />
        </DemoCard>
        <PropsTable rows={API.select} />
      </DocSection>

      <DocSection id="combobox">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A select whose trigger is an input: typing filters the options (case-insensitive), Enter picks the highlighted
          match, and blur snaps the text back to the last valid value.
        </p>
        <DemoCard code={comboboxCode}>
          <ComboboxExample />
        </DemoCard>
        <PropsTable rows={API.combobox} />
      </DocSection>

      <DocSection id="autocomplete">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A free-text input with suggestions: anything you type is the value; picking a row just fills the input. Try{" "}
          <code class="text-foreground/80">dither</code>, <code class="text-foreground/80">bayer</code> or{" "}
          <code class="text-foreground/80">pixel</code>.
        </p>
        <DemoCard code={autocompleteCode}>
          <AutocompleteExample />
        </DemoCard>
        <PropsTable rows={API.autocomplete} />
      </DocSection>

      <DocSection id="wheel-picker">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An iOS-style picker wheel: a 3D drum on native momentum scroll that snaps to the nearest notch, steered by
          wheel, drag or spinbutton keys. Wheels compose side by side for date and time pickers; reduced motion flattens
          the drum.
        </p>
        <DemoCard code={wheelPickerCode}>
          <WheelPickerExample />
        </DemoCard>
        <PropsTable rows={API.wheelPicker} />
      </DocSection>

      <DocSection id="radio">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A radiogroup of pixel circles: unchecked rings are a 1px pixel border, the checked one fills its inner dot
          with the Bayer texture. Arrow keys move and select (roving tabindex).
        </p>
        <DemoCard code={radioCode}>
          <RadioExample />
        </DemoCard>
        <PropsTable rows={API.radio} />
      </DocSection>

      <DocSection id="checkbox-group">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A labelled group of DitherCheckboxes bound to one string array: toggling a box adds or removes its option's
          value.
        </p>
        <DemoCard code={checkboxGroupCode}>
          <CheckboxGroupExample />
        </DemoCard>
        <PropsTable rows={API.checkboxGroup} />
      </DocSection>

      <DocSection id="toggle">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A pressed-state button: off is a quiet border, on fills behind the label with the badge's dithered gradient.
          Label goes in as children.
        </p>
        <DemoCard code={toggleCode}>
          <ToggleExample />
        </DemoCard>
        <PropsTable rows={API.toggle} />
      </DocSection>

      <DocSection id="toggle-group">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A bordered row of toggles: <code class="text-foreground/80">single</code> behaves like a radio group (one
          value, arrows move), while <code class="text-foreground/80">multiple</code> keeps each button independently
          pressed against a string array.
        </p>
        <DemoCard code={toggleGroupCode}>
          <ToggleGroupExample />
        </DemoCard>
        <PropsTable rows={API.toggleGroup} />
      </DocSection>
    </>
  )
}
