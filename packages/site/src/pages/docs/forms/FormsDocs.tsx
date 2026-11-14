import {
  DitherCheckboxCard,
  DitherCodeInput,
  DitherColorSwatch,
  DitherInputGroup,
  DitherKnob,
  DitherLanguageSelect,
  DitherSearchInput,
  DitherSignaturePad,
} from "@dither-ui/kit"
import { DitherInput } from "@dither-ui/kit"
import { createSignal } from "solid-js"
import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import passwordInputProps from "virtual:dither-props/DitherPasswordInput"
import searchInputProps from "virtual:dither-props/DitherSearchInput"
import emailInputProps from "virtual:dither-props/DitherEmailInput"
import phoneInputProps from "virtual:dither-props/DitherPhoneInput"
import currencyInputProps from "virtual:dither-props/DitherCurrencyInput"
import scrubInputProps from "virtual:dither-props/DitherScrubInput"
import hotkeyInputProps from "virtual:dither-props/DitherHotkeyInput"
import codeInputProps from "virtual:dither-props/DitherCodeInput"
import inlineEditProps from "virtual:dither-props/DitherInlineEdit"
import tagInputProps from "virtual:dither-props/DitherTagInput"
import choiceChipsProps from "virtual:dither-props/DitherChoiceChips"
import checkboxCardProps from "virtual:dither-props/DitherCheckboxCard"
import keyValueInputProps from "virtual:dither-props/DitherKeyValueInput"
import mentionInputProps from "virtual:dither-props/DitherMentionInput"
import fileInputProps from "virtual:dither-props/DitherFileInput"
import listBoxProps from "virtual:dither-props/DitherListBox"
import multiSelectProps from "virtual:dither-props/DitherMultiSelect"
import cascadeSelectProps from "virtual:dither-props/DitherCascadeSelect"
import transferListProps from "virtual:dither-props/DitherTransferList"
import languageSelectProps from "virtual:dither-props/DitherLanguageSelect"
import iconPickerProps from "virtual:dither-props/DitherIconPicker"
import fontPickerProps from "virtual:dither-props/DitherFontPicker"
import calendarProps from "virtual:dither-props/DitherCalendar"
import datePickerProps from "virtual:dither-props/DitherDatePicker"
import monthPickerProps from "virtual:dither-props/DitherMonthPicker"
import colorSwatchProps from "virtual:dither-props/DitherColorSwatch"
import colorPickerProps from "virtual:dither-props/DitherColorPicker"
import knobProps from "virtual:dither-props/DitherKnob"
import signaturePadProps from "virtual:dither-props/DitherSignaturePad"
import DocSection from "../DocSection"
import PasswordInputExample from "./examples/password-input"
import passwordInputCode from "./examples/password-input.tsx?raw"
import EmailInputExample from "./examples/email-input"
import emailInputCode from "./examples/email-input.tsx?raw"
import PhoneInputExample from "./examples/phone-input"
import phoneInputCode from "./examples/phone-input.tsx?raw"
import CurrencyInputExample from "./examples/currency-input"
import currencyInputCode from "./examples/currency-input.tsx?raw"
import ScrubInputExample from "./examples/scrub-input"
import scrubInputCode from "./examples/scrub-input.tsx?raw"
import HotkeyInputExample from "./examples/hotkey-input"
import hotkeyInputCode from "./examples/hotkey-input.tsx?raw"
import InlineEditExample from "./examples/inline-edit"
import inlineEditCode from "./examples/inline-edit.tsx?raw"
import TagInputExample from "./examples/tag-input"
import tagInputCode from "./examples/tag-input.tsx?raw"
import ChoiceChipsExample from "./examples/choice-chips"
import choiceChipsCode from "./examples/choice-chips.tsx?raw"
import CheckboxCardExample from "./examples/checkbox-card"
import checkboxCardCode from "./examples/checkbox-card.tsx?raw"
import KeyValueInputExample from "./examples/key-value-input"
import keyValueInputCode from "./examples/key-value-input.tsx?raw"
import MentionInputExample from "./examples/mention-input"
import mentionInputCode from "./examples/mention-input.tsx?raw"
import FileInputExample from "./examples/file-input"
import fileInputCode from "./examples/file-input.tsx?raw"
import ListBoxExample from "./examples/list-box"
import listBoxCode from "./examples/list-box.tsx?raw"
import MultiSelectExample from "./examples/multi-select"
import multiSelectCode from "./examples/multi-select.tsx?raw"
import CascadeSelectExample from "./examples/cascade-select"
import cascadeSelectCode from "./examples/cascade-select.tsx?raw"
import TransferListExample from "./examples/transfer-list"
import transferListCode from "./examples/transfer-list.tsx?raw"
import IconPickerExample from "./examples/icon-picker"
import iconPickerCode from "./examples/icon-picker.tsx?raw"
import FontPickerExample from "./examples/font-picker"
import fontPickerCode from "./examples/font-picker.tsx?raw"
import CalendarExample from "./examples/calendar"
import calendarCode from "./examples/calendar.tsx?raw"
import DatePickerExample from "./examples/date-picker"
import datePickerCode from "./examples/date-picker.tsx?raw"
import MonthPickerExample from "./examples/month-picker"
import monthPickerCode from "./examples/month-picker.tsx?raw"
import ColorPickerExample from "./examples/color-picker"
import colorPickerCode from "./examples/color-picker.tsx?raw"
import KnobExample from "./examples/knob"
import knobCode from "./examples/knob.tsx?raw"

const SNIPPET_SEARCH_INPUT = `const [q, setQ] = createSignal("dither")
const [results, setResults] = createSignal<string[]>(["DitherButton", "DitherImage"])

<DitherSearchInput modelValue={q()} onUpdateModelValue={setQ} onClear={() => setResults([])} />`

const SNIPPET_CODE_INPUT = `const [snippet, setSnippet] = createSignal("const dither = bayer(4)")
const [submitted, setSubmitted] = createSignal("")

<DitherCodeInput modelValue={snippet()} onUpdateModelValue={setSnippet} onSubmit={() => setSubmitted(snippet())} rows={4} />`

const SNIPPET_INPUT_GROUP = `const [host, setHost] = createSignal("dither-ui.com")

<DitherInputGroup
  prefix="https://"
  suffix="/docs"
>
  <DitherInput modelValue={host()} onUpdateModelValue={setHost} aria-label="Site address" class="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
</DitherInputGroup>`

const SNIPPET_LANGUAGE_SELECT = `const [locale, setLocale] = createSignal("ja")

<DitherLanguageSelect modelValue={locale()} onUpdateModelValue={setLocale} includeDefault />`

const SNIPPET_COLOR_SWATCH = `const palette = [
  { color: "#5227FF", label: "Iris" },
  { color: "#7CFF67", label: "Mint" },
  { color: "#FFB454", label: "Amber" },
  { color: "#FF5C7A", label: "Rose" },
  { color: "#4CC2FF", label: "Sky" },
]
const [active, setActive] = createSignal("#5227FF")

<div class="flex gap-2">
  <For each={palette}>
    {(c) => (
      <DitherColorSwatch color={c.color} label={c.label}
        selected={c.color === active()} onSelect={() => setActive(c.color)} />
    )}
  </For>
</div>`

const SNIPPET_SIGNATURE_PAD = `const [sig, setSig] = createSignal("")

<DitherSignaturePad modelValue={sig()} onUpdateModelValue={setSig} height={140} />`

export const API: Record<string, PropRow[]> = {
  passwordInput: kitTable(passwordInputProps),
  searchInput: kitTable(searchInputProps),
  emailInput: kitTable(emailInputProps),
  phoneInput: kitTable(phoneInputProps),
  currencyInput: kitTable(currencyInputProps),
  scrubInput: kitTable(scrubInputProps, { join: [["min", "max", "step"]] }),
  hotkeyInput: kitTable(hotkeyInputProps),
  codeInput: kitTable(codeInputProps),
  inlineEdit: kitTable(inlineEditProps, { join: [["onSave", "onCancel"]] }),
  tagInput: kitTable(tagInputProps),
  choiceChips: kitTable(choiceChipsProps),
  checkboxCard: kitTable(checkboxCardProps, { join: [["label", "description"]] }),
  keyValueInput: kitTable(keyValueInputProps),
  mentionInput: kitTable(mentionInputProps),
  fileInput: kitTable(fileInputProps),
  listBox: kitTable(listBoxProps),
  multiSelect: kitTable(multiSelectProps),
  cascadeSelect: kitTable(cascadeSelectProps),
  transferList: kitTable(transferListProps, { join: [["sourceLabel", "targetLabel"]] }),
  languageSelect: kitTable(languageSelectProps),
  iconPicker: kitTable(iconPickerProps),
  fontPicker: kitTable(fontPickerProps),
  calendar: kitTable(calendarProps, { join: [["min", "max"]] }),
  datePicker: kitTable(datePickerProps, { join: [["min", "max"]] }),
  monthPicker: kitTable(monthPickerProps),
  colorSwatch: kitTable(colorSwatchProps),
  colorPicker: kitTable(colorPickerProps),
  knob: kitTable(knobProps, { join: [["min", "max", "step"]] }),
  signaturePad: kitTable(signaturePadProps, { join: [["width", "height"]] }),
}

export default function FormsDocs() {
  const [beta, setBeta] = createSignal(false)

  return (
    <>
      {/* PasswordInput */}
      <DocSection id="password-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Password field with a reveal toggle: the type flips text/password, the button carries its own accessible name
          and never submits (<code class="text-foreground/80">type="button"</code>).
        </p>
        <DemoCard code={passwordInputCode}>
          <div class="mx-auto w-full max-w-xs">
            <PasswordInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.passwordInput} />
      </DocSection>
      {/* SearchInput */}
      <DocSection id="search-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Leading glyph, one-click clear (only when there is something to clear) and Escape empties the field. Either
          way it fires a <code class="text-foreground/80">clear</code> event so results can reset in the same beat.
        </p>
        <DemoCard code={SNIPPET_SEARCH_INPUT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherSearchInput modelValue="dither" />
          </div>
        </DemoCard>
        <PropsTable rows={API.searchInput} />
      </DocSection>
      {/* EmailInput */}
      <DocSection id="email-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The three things a bare text input gets wrong, fixed in one place:{" "}
          <code class="text-foreground/80">type=email</code>, <code class="text-foreground/80">inputmode=email</code>,{" "}
          <code class="text-foreground/80">autocomplete=email</code>.
        </p>
        <DemoCard code={emailInputCode}>
          <div class="mx-auto w-full max-w-xs">
            <EmailInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.emailInput} />
      </DocSection>
      {/* PhoneInput */}
      <DocSection id="phone-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Digits normalized into the <code class="text-foreground/80">(415) 555-2671</code> shape while you type
          (10-digit NANP), tel keyboard on mobile. The model is always the formatted string; the caret is end-anchored
          by design.
        </p>
        <DemoCard code={phoneInputCode}>
          <div class="mx-auto w-full max-w-xs">
            <PhoneInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.phoneInput} />
      </DocSection>
      {/* CurrencyInput */}
      <DocSection id="currency-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Money entry with predictable mechanics: the model stays a plain decimal string (
          <code class="text-foreground/80">"1234.56"</code>), the display groups thousands while blurred and shows raw
          digits while focused so typing and the caret stay sane. Digits and one dot only.
        </p>
        <DemoCard code={currencyInputCode}>
          <div class="mx-auto w-full max-w-xs">
            <CurrencyInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.currencyInput} />
      </DocSection>
      {/* ScrubInput */}
      <DocSection id="scrub-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The Figma-style drag gesture on a number: the grip is a real{" "}
          <code class="text-foreground/80">role="slider"</code> (arrow keys, PageUp/Down and Home/End work without a
          pointer), and the read-only input stays selectable for copying. Values snap to{" "}
          <code class="text-foreground/80">step</code>.
        </p>
        <DemoCard code={scrubInputCode}>
          <div class="mx-auto w-full max-w-xs">
            <ScrubInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.scrubInput} />
      </DocSection>
      {/* HotkeyInput */}
      <DocSection id="hotkey-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Shortcut capture: modifiers hold until a non-modifier key arrives, repeat is ignored, Escape clears, Tab moves
          on as anywhere. Value shape: <code class="text-foreground/80">Ctrl+Shift+K</code> (order Ctrl, Alt, Shift,
          Meta, then the key).
        </p>
        <DemoCard code={hotkeyInputCode}>
          <div class="mx-auto w-full max-w-xs">
            <HotkeyInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.hotkeyInput} />
      </DocSection>
      {/* CodeInput */}
      <DocSection id="code-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Code entry where Tab indents (two spaces), Shift+Tab dedents the selected lines, and Ctrl/Cmd+Enter fires{" "}
          <code class="text-foreground/80">submit</code>. The browser's tab trap is handled once, here: Escape lets go,
          and the Tab after it moves on.
        </p>
        <DemoCard code={SNIPPET_CODE_INPUT}>
          <div class="mx-auto w-full max-w-md">
            <DitherCodeInput modelValue="const dither = bayer(4)" rows={4} />
          </div>
        </DemoCard>
        <PropsTable rows={API.codeInput} />
      </DocSection>
      {/* InputGroup */}
      <DocSection id="input-group">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Addon props around a control in one bordered group: the group owns the border and the focus-within ring, the
          inner control drops its own chrome (the code tab shows the exact class set).
        </p>
        <DemoCard code={SNIPPET_INPUT_GROUP}>
          <div class="mx-auto w-full max-w-sm">
            <DitherInputGroup prefix="https://" suffix="/docs">
              <DitherInput
                class="min-h-8 border-0 bg-transparent px-0 py-1 shadow-none hover:border-0 focus-visible:ring-0"
                modelValue="dither-ui.com"
                aria-label="Site address"
              />
            </DitherInputGroup>
          </div>
        </DemoCard>
        {/* no props: slots and the focus ring are the API */}
      </DocSection>
      {/* InlineEdit */}
      <DocSection id="inline-edit">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Click-to-edit text: view mode is a real button (keyboard reachable), edit mode focus-selects. Enter or blur
          commits (only when the value actually changed). Escape reverts.
        </p>
        <DemoCard code={inlineEditCode}>
          <div class="mx-auto w-full max-w-xs">
            <InlineEditExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.inlineEdit} />
      </DocSection>
      {/* TagInput */}
      <DocSection id="tag-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Tags as chips in one field: Enter or comma commits, Backspace on an empty input pulls the last chip back in,
          per-chip × removes. Trimmed, case-deduped, <code class="text-foreground/80">max</code>-capped.
        </p>
        <DemoCard code={tagInputCode}>
          <div class="mx-auto w-full max-w-sm">
            <TagInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.tagInput} />
      </DocSection>
      {/* ChoiceChips */}
      <DocSection id="choice-chips">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Chip-style choice group where the chip IS the label of a real radio (or checkbox when{" "}
          <code class="text-foreground/80">multiple</code>). Native keyboard semantics and focus come for free: no
          roving tabindex to get wrong.
        </p>
        <DemoCard code={choiceChipsCode}>
          <div class="mx-auto grid max-w-sm gap-4">
            <ChoiceChipsExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.choiceChips} />
      </DocSection>
      {/* CheckboxCard */}
      <DocSection id="checkbox-card">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The whole card is the checkbox's label: title and description ride along, one click anywhere toggles, the
          focus ring shows keyboard focus. The checkbox stays the source of truth.
        </p>
        <DemoCard code={checkboxCardCode}>
          <div class="mx-auto grid max-w-sm gap-2">
            <CheckboxCardExample />
            <DitherCheckboxCard
              modelValue={beta()}
              onUpdateModelValue={setBeta}
              label="Beta channel"
              description="Get breaking changes before everyone else"
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.checkboxCard} />
      </DocSection>
      {/* KeyValueInput */}
      <DocSection id="key-value-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Repeatable key/value rows: headers, metadata, query params. Every edit hands back the whole array (the parent
          owns the truth), rows are added and removed from the bottom.
        </p>
        <DemoCard code={keyValueInputCode}>
          <div class="mx-auto w-full max-w-md">
            <KeyValueInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.keyValueInput} />
      </DocSection>
      {/* MentionInput */}
      <DocSection id="mention-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Textarea with <code class="text-foreground/80">@</code>-mention autocomplete: detection is a regex on the text
          before the caret, the list anchors to the field, Arrow keys pick, Enter/Tab inserts, Escape closes. The caret
          lands after the inserted handle.
        </p>
        <DemoCard code={mentionInputCode}>
          <div class="mx-auto w-full max-w-md">
            <MentionInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.mentionInput} />
      </DocSection>
      {/* FileInput */}
      <DocSection id="file-input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          File picker with a visible selection: a hidden native input driven by its label (keyboard-reachable), files
          listed with sizes, per-file remove, clear-all, and drop-zone drag styling. The model is{" "}
          <code class="text-foreground/80">File[]</code>, owned by the parent.
        </p>
        <DemoCard code={fileInputCode}>
          <div class="mx-auto w-full max-w-sm">
            <FileInputExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.fileInput} />
      </DocSection>
      {/* ListBox */}
      <DocSection id="list-box">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Single-select with the full WAI-ARIA keyboard contract: arrows move the active option, Home/End jump,
          Enter/Space selects, and the active row carries <code class="text-foreground/80">aria-activedescendant</code>{" "}
          so focus never leaves the listbox itself.
        </p>
        <DemoCard code={listBoxCode}>
          <div class="mx-auto w-full max-w-[16rem]">
            <ListBoxExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.listBox} />
      </DocSection>
      {/* MultiSelect */}
      <DocSection id="multi-select">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Chips for what's picked, native checkboxes for what's pickable, a filter box over the pool. Keyboard semantics
          come from the checkboxes, and the selected set stays visible and individually removable.
        </p>
        <DemoCard code={multiSelectCode}>
          <div class="mx-auto w-full max-w-sm">
            <MultiSelectExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.multiSelect} />
      </DocSection>
      {/* CascadeSelect */}
      <DocSection id="cascade-select">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Dependent pickers: each level's options come from the tree under the current path, and changing a parent
          truncates the deeper segments (the classic cascade rule, in one component). The model is the chosen path.
        </p>
        <DemoCard code={cascadeSelectCode}>
          <div class="mx-auto w-full max-w-md">
            <CascadeSelectExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.cascadeSelect} />
      </DocSection>
      {/* TransferList */}
      <DocSection id="transfer-list">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Two-panel shuttle: the source pool stays put, the destination IS the model. Checkboxes select in either
          direction, Add/Remove move the selection, Add all/Remove all flush. Every control is a real button.
        </p>
        <DemoCard code={transferListCode}>
          <div class="mx-auto w-full max-w-xl">
            <TransferListExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.transferList} />
      </DocSection>
      {/* LanguageSelect */}
      <DocSection id="language-select">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Language picker over a curated BCP 47 list: the label is the human name, the value is the tag, and{" "}
          <code class="text-foreground/80">includeDefault</code> keeps the opt-out one option away.
        </p>
        <DemoCard code={SNIPPET_LANGUAGE_SELECT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherLanguageSelect modelValue="ja" />
          </div>
        </DemoCard>
        <PropsTable rows={API.languageSelect} />
      </DocSection>
      {/* IconPicker */}
      <DocSection id="icon-picker">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The kit's own glyphs behind a name filter: a radio grid, so arrow keys roam the whole grid as one tab stop.
          Value = the icon name, ready for <code class="text-foreground/80">&lt;DitherIcon&gt;</code>.
        </p>
        <DemoCard code={iconPickerCode}>
          <div class="mx-auto w-full max-w-sm">
            <IconPickerExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.iconPicker} />
      </DocSection>
      {/* FontPicker */}
      <DocSection id="font-picker">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Each option renders its own name in its own family. The preview IS the choice, so no swatch can drift from the
          value. Value = the CSS font stack string.
        </p>
        <DemoCard code={fontPickerCode}>
          <div class="mx-auto w-full max-w-sm">
            <FontPickerExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.fontPicker} />
      </DocSection>
      {/* Calendar */}
      <DocSection id="calendar">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Month grid with real grid semantics: arrows move the day, PageUp/PageDown change month, Home/End jump to week
          edges, and the model is ISO <code class="text-foreground/80">YYYY-MM-DD</code> so timezone math never enters
          the picture. Today gets a ring, the selected day the fill.
        </p>
        <DemoCard code={calendarCode}>
          <div class="flex justify-center">
            <CalendarExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.calendar} />
      </DocSection>
      {/* DatePicker */}
      <DocSection id="date-picker">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Date field + calendar popover: the input shows a human format, the calendar opens on a click or Enter with its
          day focused, select closes, Escape and outside-click dismiss, a pick or Escape hands focus back to the field.
          The model stays ISO.
        </p>
        <DemoCard code={datePickerCode}>
          <div class="mx-auto w-full max-w-xs">
            <DatePickerExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.datePicker} />
      </DocSection>
      {/* MonthPicker */}
      <DocSection id="month-picker">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Year + twelve-month grid: model is <code class="text-foreground/80">YYYY-MM</code>, arrows roam the grid
          (three columns), PageUp/PageDown shift the year, the current month keeps a ring.
        </p>
        <DemoCard code={monthPickerCode}>
          <div class="flex justify-center">
            <MonthPickerExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.monthPicker} />
      </DocSection>
      {/* ColorSwatch */}
      <DocSection id="color-swatch">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One color as a pickable chip: a real button with the color in its accessible name, a selected ring, a keyboard
          focus ring. Reads as pure display when nothing listens to <code class="text-foreground/80">select</code>.
        </p>
        <DemoCard code={SNIPPET_COLOR_SWATCH}>
          <div class="flex justify-center gap-2">
            <DitherColorSwatch color="#5227FF" selected label="Iris" />
            <DitherColorSwatch color="#7CFF67" label="Mint" />
            <DitherColorSwatch color="#FFB454" label="Amber" />
            <DitherColorSwatch color="#FF5C7A" label="Rose" />
            <DitherColorSwatch color="#4CC2FF" label="Sky" />
          </div>
        </DemoCard>
        <PropsTable rows={API.colorSwatch} />
      </DocSection>
      {/* ColorPicker */}
      <DocSection id="color-picker">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          HSV field + hue strip + hex readout: the plane is pointer-driven (arrows nudge S/V, Shift for coarse), the hue
          strip is a slider of its own, and the hex input accepts what you type. Model = hex string.
        </p>
        <DemoCard code={colorPickerCode}>
          <div class="flex justify-center">
            <ColorPickerExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.colorPicker} />
      </DocSection>
      {/* Knob */}
      <DocSection id="knob">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Rotary control with the reliable gesture: drag VERTICALLY to change the value (angle-following wraps badly at
          the detent), arrows / PageUp-Down / Home-End on the keyboard, full slider semantics. The indicator sweeps
          270°.
        </p>
        <DemoCard code={knobCode}>
          <div class="flex justify-center gap-6">
            <KnobExample />
            <DitherKnob modelValue={25} size={56} />
            <DitherKnob modelValue={90} size={88} disabled />
          </div>
        </DemoCard>
        <PropsTable rows={API.knob} />
      </DocSection>
      {/* SignaturePad */}
      <DocSection id="signature-pad">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Pointer drawing on a canvas. The <code class="text-foreground/80">change</code> event fires the dataURL after
          every stroke and on clear. A context-less environment refuses strokes instead of throwing, so degraded engines
          degrade visibly.
        </p>
        <DemoCard code={SNIPPET_SIGNATURE_PAD}>
          <div class="mx-auto w-full max-w-md">
            <DitherSignaturePad height={140} />
          </div>
        </DemoCard>
        <PropsTable rows={API.signaturePad} />
      </DocSection>
    </>
  )
}
