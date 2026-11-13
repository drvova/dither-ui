import {
  DitherCalendar,
  DitherCascadeSelect,
  DitherChoiceChips,
  DitherCheckboxCard,
  DitherCodeInput,
  DitherColorPicker,
  DitherColorSwatch,
  DitherCurrencyInput,
  DitherDatePicker,
  DitherEmailInput,
  DitherFileInput,
  DitherFontPicker,
  DitherHotkeyInput,
  DitherIconPicker,
  DitherInlineEdit,
  DitherInputGroup,
  DitherKeyValueInput,
  DitherKnob,
  DitherLanguageSelect,
  DitherListBox,
  DitherMentionInput,
  DitherMonthPicker,
  DitherMultiSelect,
  DitherPasswordInput,
  DitherPhoneInput,
  DitherScrubInput,
  DitherSearchInput,
  DitherSignaturePad,
  DitherTagInput,
  DitherTransferList,
} from "@dither-ui/kit"
import { DitherField, DitherInput } from "@dither-ui/kit"
import { createSignal } from "solid-js"
import DemoCard from "../DemoCard"
import PropsTable, { type PropRow } from "../PropsTable"

const SNIPPET_PASSWORD_INPUT = `const [pw, setPw] = createSignal("correct-horse-battery")

<DitherField label="Password">
  <DitherPasswordInput modelValue={pw()} onUpdateModelValue={setPw} placeholder="At least 12 characters" />
</DitherField>`

const SNIPPET_SEARCH_INPUT = `const [q, setQ] = createSignal("dither")
const [results, setResults] = createSignal<string[]>(["DitherButton", "DitherImage"])

<DitherSearchInput modelValue={q()} onUpdateModelValue={setQ} onClear={() => setResults([])} />`

const SNIPPET_EMAIL_INPUT = `const [email, setEmail] = createSignal("")

<DitherEmailInput modelValue={email()} onUpdateModelValue={setEmail} />`

const SNIPPET_PHONE_INPUT = `const [phone, setPhone] = createSignal("(415) 555-2671")

<DitherPhoneInput modelValue={phone()} onUpdateModelValue={setPhone} />`

const SNIPPET_CURRENCY_INPUT = `const [amount, setAmount] = createSignal("1234567.5")

<DitherCurrencyInput modelValue={amount()} onUpdateModelValue={setAmount} prefix="$" />`

const SNIPPET_SCRUB_INPUT = `const [opacity, setOpacity] = createSignal(64)

<DitherField label="Opacity" description="Drag the grip, or focus it and use the arrows">
  <DitherScrubInput modelValue={opacity()} onUpdateModelValue={setOpacity} min={0} max={100} step={1} />
</DitherField>`

const SNIPPET_HOTKEY_INPUT = `const [binding, setBinding] = createSignal("Ctrl+Shift+K")

<DitherField label="Command palette" description="Click the field, then press the combo">
  <DitherHotkeyInput modelValue={binding()} onUpdateModelValue={setBinding} />
</DitherField>`

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

const SNIPPET_INLINE_EDIT = `const [name, setName] = createSignal("bogdan")

function persist(next: string) {
  localStorage.setItem("display-name", next)
}

<DitherField label="Display name" description="Click the value to edit it">
  <DitherInlineEdit modelValue={name()} onUpdateModelValue={setName} onSave={persist} />
</DitherField>`

const SNIPPET_TAG_INPUT = `const [tags, setTags] = createSignal(["solid", "dither"])

<DitherTagInput modelValue={tags()} onUpdateModelValue={setTags} max={8} placeholder="Add tag…" />`

const SNIPPET_CHOICE_CHIPS = `const [size, setSize] = createSignal("M")
const [labels, setLabels] = createSignal(["bug"])

<DitherChoiceChips modelValue={size()} onUpdateModelValue={setSize} label="Size" options={['S', 'M', 'L', 'XL']} />
<DitherChoiceChips modelValue={labels()} onUpdateModelValue={setLabels} multiple options={['bug', 'feat', 'docs']} />`

const SNIPPET_CHECKBOX_CARD = `const [telemetry, setTelemetry] = createSignal(true)

<DitherCheckboxCard modelValue={telemetry()} onUpdateModelValue={setTelemetry}
  label="Telemetry"
  description="Anonymous usage stats help pick the next components" />`

const SNIPPET_KEY_VALUE_INPUT = `const [headers, setHeaders] = createSignal([
  { key: "Content-Type", value: "application/json" },
  { key: "X-Client", value: "dither-ui" },
])

<DitherKeyValueInput modelValue={headers()} onUpdateModelValue={setHeaders} />`

const SNIPPET_MENTION_INPUT = `const [body, setBody] = createSignal("cc @da")
const handles = ["dana", "darius", "daniela", "sam"]
const [notified, setNotified] = createSignal<string[]>([])

<DitherMentionInput modelValue={body()} onUpdateModelValue={setBody} options={handles} rows={3}
  onMention={(handle) => (setNotified([...notified(), handle]))} />`

const SNIPPET_FILE_INPUT = `const [picked, setPicked] = createSignal<File[]>([])

<DitherFileInput modelValue={picked()} onUpdateModelValue={setPicked} multiple accept="image/*" />`

const SNIPPET_LIST_BOX = `const [city, setCity] = createSignal("Seoul")

<DitherListBox value={city()} onUpdateModelValue={(next) => (setCity(next))}
  options={['Kyoto', 'Seoul', 'Taipei', 'Osaka', 'Busan']} aria-label="City" />`

const SNIPPET_MULTI_SELECT = `const ALL_TAGS = ["solid", "dither", "canvas", "tokens", "ssr"]
const [tags, setTags] = createSignal(["solid", "dither"])

<DitherMultiSelect value={tags()} onUpdateModelValue={(next) => (setTags(next))} options={ALL_TAGS} />`

const SNIPPET_CASCADE_SELECT = `const TREE = [
  {
    value: "Japan",
    children: [
      { value: "Kansai", children: [{ value: "Kyoto" }, { value: "Osaka" }] },
      { value: "Kanto", children: [{ value: "Tokyo" }, { value: "Yokohama" }] },
    ],
  },
  { value: "Korea", children: [{ value: "Seoul Region", children: [{ value: "Seoul" }, { value: "Incheon" }] }] },
]
const [region, setRegion] = createSignal(["Japan", "Kansai"])

<DitherCascadeSelect value={region()} onUpdateModelValue={(next) => (setRegion(next))} tree={TREE}
  placeholders={['Country', 'Region', 'City']} />`

const SNIPPET_TRANSFER_LIST = `const ALL_ROLES = ["admin", "editor", "viewer", "billing", "support"]
const [roles, setRoles] = createSignal(["admin"])

<DitherTransferList value={roles()} onUpdateModelValue={(next) => (setRoles(next))} source={ALL_ROLES}
  sourceLabel="Roles" targetLabel="Assigned" />`

const SNIPPET_LANGUAGE_SELECT = `const [locale, setLocale] = createSignal("ja")

<DitherLanguageSelect modelValue={locale()} onUpdateModelValue={setLocale} includeDefault />`

const SNIPPET_ICON_PICKER = `const [glyph, setGlyph] = createSignal("Check")

<DitherIconPicker modelValue={glyph()} onUpdateModelValue={setGlyph} />`

const SNIPPET_FONT_PICKER = `const [font, setFont] = createSignal("'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace")

<DitherFontPicker modelValue={font()} onUpdateModelValue={setFont} />`

const SNIPPET_CALENDAR = `const [day, setDay] = createSignal("2026-10-07")

<DitherCalendar modelValue={day()} onUpdateModelValue={setDay} max="2026-12-31" />`

const SNIPPET_DATE_PICKER = `const [due, setDue] = createSignal("2026-10-07")

<DitherDatePicker modelValue={due()} onUpdateModelValue={setDue} min="2026-01-01" />`

const SNIPPET_MONTH_PICKER = `const [month, setMonth] = createSignal("2026-10")

<DitherMonthPicker modelValue={month()} onUpdateModelValue={setMonth} />`

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

const SNIPPET_COLOR_PICKER = `const [tint, setTint] = createSignal("#5227FF")

<DitherColorPicker modelValue={tint()} onUpdateModelValue={setTint} />`

const SNIPPET_KNOB = `const [gain, setGain] = createSignal(64)

<DitherKnob modelValue={gain()} onUpdateModelValue={setGain} min={0} max={100} step={1} />`

const SNIPPET_SIGNATURE_PAD = `const [sig, setSig] = createSignal("")

<DitherSignaturePad modelValue={sig()} onUpdateModelValue={setSig} height={140} />`

const API: Record<string, PropRow[]> = {
  passwordInput: [
    { prop: "modelValue", type: "string (with onUpdateModelValue)", default: '""' },
    { prop: "invalid", type: "boolean", default: "false" },
  ],
  searchInput: [
    { prop: "modelValue", type: "string (with onUpdateModelValue)", default: '""' },
    { prop: "onClear", type: "() on clear/Escape", default: "" },
  ],
  emailInput: [
    { prop: "modelValue", type: "string (with onUpdateModelValue)", default: '""' },
    { prop: "autocomplete", type: "string", default: '"email"' },
  ],
  phoneInput: [
    { prop: "modelValue", type: "string (with onUpdateModelValue, formatted)", default: '""' },
    { prop: "autocomplete", type: "string", default: '"tel"' },
  ],
  currencyInput: [
    { prop: "modelValue", type: "string (with onUpdateModelValue, digits[.digits])", default: '""' },
    { prop: "prefix", type: "string", default: '"$"' },
    { prop: "locale", type: "string", default: '"en-US"' },
  ],
  scrubInput: [
    { prop: "modelValue", type: "number (with onUpdateModelValue)", default: "0" },
    { prop: "min / max / step", type: "number", default: "0 / 100 / 1" },
  ],
  hotkeyInput: [
    { prop: "modelValue", type: "string (with onUpdateModelValue)", default: '""' },
    { prop: "placeholder", type: "string", default: '"Press a shortcut…"' },
  ],
  codeInput: [
    { prop: "modelValue", type: "string (with onUpdateModelValue)", default: '""' },
    { prop: "rows", type: "number", default: "6" },
    { prop: "onSubmit", type: "Ctrl/Cmd + Enter", default: "" },
  ],
  inputGroup: [],
  inlineEdit: [
    { prop: "modelValue", type: "string (with onUpdateModelValue)", default: '""' },
    { prop: "onSave / onCancel", type: "(value) / ()", default: "" },
  ],
  tagInput: [
    { prop: "modelValue", type: "string[] (with onUpdateModelValue)", default: "[]" },
    { prop: "max", type: "number", default: "Infinity" },
  ],
  choiceChips: [
    { prop: "label", type: "string (names the group, shown over the chips)", default: '""' },
    { prop: "options", type: "string[]", default: "[]" },
    { prop: "modelValue", type: "string | string[] (with onUpdateModelValue; `value` still read)", default: '"" / []' },
    { prop: "multiple", type: "boolean (checkbox mode)", default: "false" },
  ],
  checkboxCard: [
    { prop: "modelValue", type: "boolean (with onUpdateModelValue)", default: "false" },
    { prop: "label / description", type: "string", default: '""' },
  ],
  keyValueInput: [
    { prop: "modelValue", type: "{ key, value }[] (with onUpdateModelValue)", default: "[]" },
    { prop: "disabled", type: "boolean", default: "false" },
  ],
  mentionInput: [
    { prop: "modelValue", type: "string (with onUpdateModelValue)", default: '""' },
    { prop: "options", type: "string[]", default: "[]" },
    { prop: "onMention", type: "(handle) on insert", default: "" },
  ],
  fileInput: [
    { prop: "modelValue", type: "File[] (with onUpdateModelValue)", default: "[]" },
    { prop: "multiple", type: "boolean", default: "false" },
    { prop: "accept", type: "string (input accept)", default: "" },
    { prop: "onChange", type: "(File[]) after pick/remove", default: "" },
  ],
  listBox: [
    { prop: "options", type: "string[]", default: "[]" },
    { prop: "value", type: "string (with onUpdateModelValue)", default: '""' },
    { prop: "onSelect", type: "(value) on commit", default: "" },
  ],
  multiSelect: [
    { prop: "options", type: "string[]", default: "[]" },
    { prop: "value", type: "string[] (with onUpdateModelValue)", default: "[]" },
    { prop: "onSearch", type: "(query) as you type", default: "" },
  ],
  cascadeSelect: [
    { prop: "tree", type: "{ value, children? }[]", default: "[]" },
    { prop: "value", type: "string[] path (with onUpdateModelValue)", default: "[]" },
    { prop: "placeholders", type: "string[] per level", default: "Level n" },
  ],
  transferList: [
    { prop: "source", type: "string[] (pool)", default: "[]" },
    { prop: "value", type: "string[] (destination)", default: "[]" },
    { prop: "sourceLabel / targetLabel", type: "string", default: "Available / Selected" },
  ],
  languageSelect: [
    { prop: "modelValue", type: "string (BCP 47 tag)", default: '"en"' },
    { prop: "includeDefault", type: "boolean (first entry)", default: "false" },
    { prop: "defaultLabel", type: "string", default: '"System default"' },
  ],
  iconPicker: [
    { prop: "modelValue", type: "string (icon name)", default: '""' },
    { prop: "size", type: "number (px)", default: "16" },
    { prop: "placeholder", type: "string (filter)", default: '"Filter icons…"' },
  ],
  fontPicker: [
    { prop: "modelValue", type: "string (CSS font stack)", default: '""' },
    { prop: "disabled", type: "boolean", default: "false" },
  ],
  calendar: [
    { prop: "modelValue", type: "string (ISO date, with onUpdateModelValue)", default: '""' },
    { prop: "min / max", type: "string (ISO)", default: "" },
  ],
  datePicker: [
    { prop: "modelValue", type: "string (ISO, with onUpdateModelValue)", default: '""' },
    { prop: "min / max", type: "string (ISO)", default: "" },
    { prop: "onSelect", type: "(ISO) when picked", default: "" },
  ],
  monthPicker: [
    { prop: "modelValue", type: "string (YYYY-MM, with onUpdateModelValue)", default: '""' },
    { prop: "disabled", type: "boolean", default: "false" },
  ],
  colorSwatch: [
    { prop: "color", type: "string (css color)", default: '"#5227FF"' },
    { prop: "label", type: "string (aria name)", default: "the color" },
    { prop: "selected", type: "boolean (ring)", default: "false" },
    { prop: "size", type: "number (px)", default: "24" },
  ],
  colorPicker: [
    { prop: "modelValue", type: "string (hex, with onUpdateModelValue)", default: '"#5227FF"' },
    { prop: "disabled", type: "boolean", default: "false" },
  ],
  knob: [
    { prop: "modelValue", type: "number (with onUpdateModelValue)", default: "50" },
    { prop: "min / max / step", type: "number", default: "0 / 100 / 1" },
    { prop: "size", type: "number (px)", default: "72" },
    { prop: "label", type: "string (its accessible name)", default: '"Knob"' },
  ],
  signaturePad: [
    { prop: "modelValue", type: "string (dataURL, with onUpdateModelValue)", default: '""' },
    { prop: "width / height", type: "number (canvas)", default: "420 / 160" },
    { prop: "onChange", type: "(dataURL) per stroke", default: "" },
  ],
}

export default function FormsDocs() {
  // The checkbox cards' demo answers clicks: each card is its own toggle.
  const [telemetry, setTelemetry] = createSignal(true)
  const [beta, setBeta] = createSignal(false)

  return (
    <>
      {/* PasswordInput */}
      <section class="mt-16 scroll-mt-24" id="password-input">
        <h2 class="text-lg tracking-tight">PasswordInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Password field with a reveal toggle: the type flips text/password, the button carries its own accessible name
          and never submits (<code class="text-foreground/80">type="button"</code>).
        </p>
        <DemoCard code={SNIPPET_PASSWORD_INPUT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherField label="Password">
              <DitherPasswordInput modelValue="correct-horse-battery" placeholder="At least 12 characters" />
            </DitherField>
          </div>
        </DemoCard>
        <PropsTable rows={API.passwordInput} />
      </section>
      {/* SearchInput */}
      <section class="mt-16 scroll-mt-24" id="search-input">
        <h2 class="text-lg tracking-tight">SearchInput</h2>
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
      </section>
      {/* EmailInput */}
      <section class="mt-16 scroll-mt-24" id="email-input">
        <h2 class="text-lg tracking-tight">EmailInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The three things a bare text input gets wrong, fixed in one place:{" "}
          <code class="text-foreground/80">type=email</code>, <code class="text-foreground/80">inputmode=email</code>,{" "}
          <code class="text-foreground/80">autocomplete=email</code>.
        </p>
        <DemoCard code={SNIPPET_EMAIL_INPUT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherEmailInput modelValue="" />
          </div>
        </DemoCard>
        <PropsTable rows={API.emailInput} />
      </section>
      {/* PhoneInput */}
      <section class="mt-16 scroll-mt-24" id="phone-input">
        <h2 class="text-lg tracking-tight">PhoneInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Digits normalized into the <code class="text-foreground/80">(415) 555-2671</code> shape while you type
          (10-digit NANP), tel keyboard on mobile. The model is always the formatted string; the caret is end-anchored
          by design.
        </p>
        <DemoCard code={SNIPPET_PHONE_INPUT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherPhoneInput modelValue="(415) 555-2671" />
          </div>
        </DemoCard>
        <PropsTable rows={API.phoneInput} />
      </section>
      {/* CurrencyInput */}
      <section class="mt-16 scroll-mt-24" id="currency-input">
        <h2 class="text-lg tracking-tight">CurrencyInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Money entry with predictable mechanics: the model stays a plain decimal string (
          <code class="text-foreground/80">"1234.56"</code>), the display groups thousands while blurred and shows raw
          digits while focused so typing and the caret stay sane. Digits and one dot only.
        </p>
        <DemoCard code={SNIPPET_CURRENCY_INPUT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherCurrencyInput modelValue="1234567.5" />
          </div>
        </DemoCard>
        <PropsTable rows={API.currencyInput} />
      </section>
      {/* ScrubInput */}
      <section class="mt-16 scroll-mt-24" id="scrub-input">
        <h2 class="text-lg tracking-tight">ScrubInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The Figma-style drag gesture on a number: the grip is a real{" "}
          <code class="text-foreground/80">role="slider"</code> (arrow keys, PageUp/Down and Home/End work without a
          pointer), and the read-only input stays selectable for copying. Values snap to{" "}
          <code class="text-foreground/80">step</code>.
        </p>
        <DemoCard code={SNIPPET_SCRUB_INPUT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherField label="Opacity" description="Drag the grip, or focus it and use the arrows">
              <DitherScrubInput modelValue={64} min={0} max={100} step={1} />
            </DitherField>
          </div>
        </DemoCard>
        <PropsTable rows={API.scrubInput} />
      </section>
      {/* HotkeyInput */}
      <section class="mt-16 scroll-mt-24" id="hotkey-input">
        <h2 class="text-lg tracking-tight">HotkeyInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Shortcut capture: modifiers hold until a non-modifier key arrives, repeat is ignored, Escape clears. Value
          shape: <code class="text-foreground/80">Ctrl+Shift+K</code> (order Ctrl, Alt, Shift, Meta, then the key).
        </p>
        <DemoCard code={SNIPPET_HOTKEY_INPUT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherField label="Command palette" description="Click the field, then press the combo">
              <DitherHotkeyInput modelValue="Ctrl+Shift+K" />
            </DitherField>
          </div>
        </DemoCard>
        <PropsTable rows={API.hotkeyInput} />
      </section>
      {/* CodeInput */}
      <section class="mt-16 scroll-mt-24" id="code-input">
        <h2 class="text-lg tracking-tight">CodeInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Code entry where Tab indents (two spaces), Shift+Tab dedents the selected lines, and Ctrl/Cmd+Enter fires{" "}
          <code class="text-foreground/80">submit</code>. The browser's tab trap is handled once, here.
        </p>
        <DemoCard code={SNIPPET_CODE_INPUT}>
          <div class="mx-auto w-full max-w-md">
            <DitherCodeInput modelValue="const dither = bayer(4)" rows={4} />
          </div>
        </DemoCard>
        <PropsTable rows={API.codeInput} />
      </section>
      {/* InputGroup */}
      <section class="mt-16 scroll-mt-24" id="input-group">
        <h2 class="text-lg tracking-tight">InputGroup</h2>
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
      </section>
      {/* InlineEdit */}
      <section class="mt-16 scroll-mt-24" id="inline-edit">
        <h2 class="text-lg tracking-tight">InlineEdit</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Click-to-edit text: view mode is a real button (keyboard reachable), edit mode focus-selects. Enter or blur
          commits (only when the value actually changed). Escape reverts.
        </p>
        <DemoCard code={SNIPPET_INLINE_EDIT}>
          <div class="mx-auto w-full max-w-xs">
            <DitherField label="Display name" description="Click the value to edit it">
              <DitherInlineEdit modelValue="bogdan" />
            </DitherField>
          </div>
        </DemoCard>
        <PropsTable rows={API.inlineEdit} />
      </section>
      {/* TagInput */}
      <section class="mt-16 scroll-mt-24" id="tag-input">
        <h2 class="text-lg tracking-tight">TagInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Tags as chips in one field: Enter or comma commits, Backspace on an empty input pulls the last chip back in,
          per-chip × removes. Trimmed, case-deduped, <code class="text-foreground/80">max</code>-capped.
        </p>
        <DemoCard code={SNIPPET_TAG_INPUT}>
          <div class="mx-auto w-full max-w-sm">
            <DitherTagInput modelValue={["solid", "dither"]} placeholder="Add tag…" />
          </div>
        </DemoCard>
        <PropsTable rows={API.tagInput} />
      </section>
      {/* ChoiceChips */}
      <section class="mt-16 scroll-mt-24" id="choice-chips">
        <h2 class="text-lg tracking-tight">ChoiceChips</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Chip-style choice group where the chip IS the label of a real radio (or checkbox when{" "}
          <code class="text-foreground/80">multiple</code>). Native keyboard semantics and focus come for free: no
          roving tabindex to get wrong.
        </p>
        <DemoCard code={SNIPPET_CHOICE_CHIPS}>
          <div class="mx-auto grid max-w-sm gap-4">
            <DitherChoiceChips modelValue={"M"} label="Size" options={["S", "M", "L", "XL"]} />
            <DitherChoiceChips modelValue={["bug"]} multiple options={["bug", "feat", "docs"]} />
          </div>
        </DemoCard>
        <PropsTable rows={API.choiceChips} />
      </section>
      {/* CheckboxCard */}
      <section class="mt-16 scroll-mt-24" id="checkbox-card">
        <h2 class="text-lg tracking-tight">CheckboxCard</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The whole card is the checkbox's label: title and description ride along, one click anywhere toggles, the
          focus ring shows keyboard focus. The checkbox stays the source of truth.
        </p>
        <DemoCard code={SNIPPET_CHECKBOX_CARD}>
          <div class="mx-auto grid max-w-sm gap-2">
            <DitherCheckboxCard
              modelValue={telemetry()}
              onUpdateModelValue={setTelemetry}
              label="Telemetry"
              description="Anonymous usage stats help pick the next components"
            />
            <DitherCheckboxCard
              modelValue={beta()}
              onUpdateModelValue={setBeta}
              label="Beta channel"
              description="Get breaking changes before everyone else"
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.checkboxCard} />
      </section>
      {/* KeyValueInput */}
      <section class="mt-16 scroll-mt-24" id="key-value-input">
        <h2 class="text-lg tracking-tight">KeyValueInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Repeatable key/value rows: headers, metadata, query params. Every edit hands back the whole array (the parent
          owns the truth), rows are added and removed from the bottom.
        </p>
        <DemoCard code={SNIPPET_KEY_VALUE_INPUT}>
          <div class="mx-auto w-full max-w-md">
            <DitherKeyValueInput
              modelValue={[
                { key: "Content-Type", value: "application/json" },
                { key: "X-Client", value: "dither-ui" },
              ]}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.keyValueInput} />
      </section>
      {/* MentionInput */}
      <section class="mt-16 scroll-mt-24" id="mention-input">
        <h2 class="text-lg tracking-tight">MentionInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Textarea with <code class="text-foreground/80">@</code>-mention autocomplete: detection is a regex on the text
          before the caret, the list anchors to the field, Arrow keys pick, Enter/Tab inserts, Escape closes. The caret
          lands after the inserted handle.
        </p>
        <DemoCard code={SNIPPET_MENTION_INPUT}>
          <div class="mx-auto w-full max-w-md">
            <DitherMentionInput modelValue="cc @da" options={["dana", "darius", "daniela", "sam"]} rows={3} />
          </div>
        </DemoCard>
        <PropsTable rows={API.mentionInput} />
      </section>
      {/* FileInput */}
      <section class="mt-16 scroll-mt-24" id="file-input">
        <h2 class="text-lg tracking-tight">FileInput</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          File picker with a visible selection: a hidden native input driven by its label (keyboard-reachable), files
          listed with sizes, per-file remove, clear-all, and drop-zone drag styling. The model is{" "}
          <code class="text-foreground/80">File[]</code>, owned by the parent.
        </p>
        <DemoCard code={SNIPPET_FILE_INPUT}>
          <div class="mx-auto w-full max-w-sm">
            <DitherFileInput modelValue={[]} multiple accept="image/*" />
          </div>
        </DemoCard>
        <PropsTable rows={API.fileInput} />
      </section>
      {/* ListBox */}
      <section class="mt-16 scroll-mt-24" id="list-box">
        <h2 class="text-lg tracking-tight">ListBox</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Single-select with the full WAI-ARIA keyboard contract: arrows move the active option, Home/End jump,
          Enter/Space selects, and the active row carries <code class="text-foreground/80">aria-activedescendant</code>{" "}
          so focus never leaves the listbox itself.
        </p>
        <DemoCard code={SNIPPET_LIST_BOX}>
          <div class="mx-auto w-full max-w-[16rem]">
            <DitherListBox value={"Seoul"} options={["Kyoto", "Seoul", "Taipei", "Osaka", "Busan"]} aria-label="City" />
          </div>
        </DemoCard>
        <PropsTable rows={API.listBox} />
      </section>
      {/* MultiSelect */}
      <section class="mt-16 scroll-mt-24" id="multi-select">
        <h2 class="text-lg tracking-tight">MultiSelect</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Chips for what's picked, native checkboxes for what's pickable, a filter box over the pool. Keyboard semantics
          come from the checkboxes, and the selected set stays visible and individually removable.
        </p>
        <DemoCard code={SNIPPET_MULTI_SELECT}>
          <div class="mx-auto w-full max-w-sm">
            <DitherMultiSelect value={["solid", "dither"]} options={["solid", "dither", "canvas", "tokens", "ssr"]} />
          </div>
        </DemoCard>
        <PropsTable rows={API.multiSelect} />
      </section>
      {/* CascadeSelect */}
      <section class="mt-16 scroll-mt-24" id="cascade-select">
        <h2 class="text-lg tracking-tight">CascadeSelect</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Dependent pickers: each level's options come from the tree under the current path, and changing a parent
          truncates the deeper segments (the classic cascade rule, in one component). The model is the chosen path.
        </p>
        <DemoCard code={SNIPPET_CASCADE_SELECT}>
          <div class="mx-auto w-full max-w-md">
            <DitherCascadeSelect
              value={["Japan", "Kansai"]}
              tree={[
                {
                  value: "Japan",
                  children: [
                    { value: "Kansai", children: [{ value: "Kyoto" }, { value: "Osaka" }] },
                    { value: "Kanto", children: [{ value: "Tokyo" }, { value: "Yokohama" }] },
                  ],
                },
                {
                  value: "Korea",
                  children: [{ value: "Seoul Region", children: [{ value: "Seoul" }, { value: "Incheon" }] }],
                },
              ]}
              placeholders={["Country", "Region", "City"]}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.cascadeSelect} />
      </section>
      {/* TransferList */}
      <section class="mt-16 scroll-mt-24" id="transfer-list">
        <h2 class="text-lg tracking-tight">TransferList</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Two-panel shuttle: the source pool stays put, the destination IS the model. Checkboxes select in either
          direction, Add/Remove move the selection, Add all/Remove all flush. Every control is a real button.
        </p>
        <DemoCard code={SNIPPET_TRANSFER_LIST}>
          <div class="mx-auto w-full max-w-xl">
            <DitherTransferList
              value={["admin"]}
              source={["admin", "editor", "viewer", "billing", "support"]}
              sourceLabel="Roles"
              targetLabel="Assigned"
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.transferList} />
      </section>
      {/* LanguageSelect */}
      <section class="mt-16 scroll-mt-24" id="language-select">
        <h2 class="text-lg tracking-tight">LanguageSelect</h2>
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
      </section>
      {/* IconPicker */}
      <section class="mt-16 scroll-mt-24" id="icon-picker">
        <h2 class="text-lg tracking-tight">IconPicker</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The kit's own glyphs behind a name filter: a radio grid, so arrow keys roam the whole grid as one tab stop.
          Value = the icon name, ready for <code class="text-foreground/80">&lt;DitherIcon&gt;</code>.
        </p>
        <DemoCard code={SNIPPET_ICON_PICKER}>
          <div class="mx-auto w-full max-w-sm">
            <DitherIconPicker modelValue="Check" />
          </div>
        </DemoCard>
        <PropsTable rows={API.iconPicker} />
      </section>
      {/* FontPicker */}
      <section class="mt-16 scroll-mt-24" id="font-picker">
        <h2 class="text-lg tracking-tight">FontPicker</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Each option renders its own name in its own family. The preview IS the choice, so no swatch can drift from the
          value. Value = the CSS font stack string.
        </p>
        <DemoCard code={SNIPPET_FONT_PICKER}>
          <div class="mx-auto w-full max-w-sm">
            <DitherFontPicker modelValue="'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace" />
          </div>
        </DemoCard>
        <PropsTable rows={API.fontPicker} />
      </section>
      {/* Calendar */}
      <section class="mt-16 scroll-mt-24" id="calendar">
        <h2 class="text-lg tracking-tight">Calendar</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Month grid with real grid semantics: arrows move the day, PageUp/PageDown change month, Home/End jump to week
          edges, and the model is ISO <code class="text-foreground/80">YYYY-MM-DD</code> so timezone math never enters
          the picture. Today gets a ring, the selected day the fill.
        </p>
        <DemoCard code={SNIPPET_CALENDAR}>
          <div class="flex justify-center">
            <DitherCalendar modelValue="2026-10-07" />
          </div>
        </DemoCard>
        <PropsTable rows={API.calendar} />
      </section>
      {/* DatePicker */}
      <section class="mt-16 scroll-mt-24" id="date-picker">
        <h2 class="text-lg tracking-tight">DatePicker</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Date field + calendar popover: the input shows a human format, the calendar opens on click/focus, select
          closes, Escape and outside-click dismiss. The model stays ISO.
        </p>
        <DemoCard code={SNIPPET_DATE_PICKER}>
          <div class="mx-auto w-full max-w-xs">
            <DitherDatePicker modelValue="2026-10-07" />
          </div>
        </DemoCard>
        <PropsTable rows={API.datePicker} />
      </section>
      {/* MonthPicker */}
      <section class="mt-16 scroll-mt-24" id="month-picker">
        <h2 class="text-lg tracking-tight">MonthPicker</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Year + twelve-month grid: model is <code class="text-foreground/80">YYYY-MM</code>, arrows roam the grid
          (three columns), PageUp/PageDown shift the year, the current month keeps a ring.
        </p>
        <DemoCard code={SNIPPET_MONTH_PICKER}>
          <div class="flex justify-center">
            <DitherMonthPicker modelValue="2026-10" />
          </div>
        </DemoCard>
        <PropsTable rows={API.monthPicker} />
      </section>
      {/* ColorSwatch */}
      <section class="mt-16 scroll-mt-24" id="color-swatch">
        <h2 class="text-lg tracking-tight">ColorSwatch</h2>
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
      </section>
      {/* ColorPicker */}
      <section class="mt-16 scroll-mt-24" id="color-picker">
        <h2 class="text-lg tracking-tight">ColorPicker</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          HSV field + hue strip + hex readout: the plane is pointer-driven (arrows nudge S/V, Shift for coarse), the hue
          strip is a slider of its own, and the hex input accepts what you type. Model = hex string.
        </p>
        <DemoCard code={SNIPPET_COLOR_PICKER}>
          <div class="flex justify-center">
            <DitherColorPicker modelValue="#5227FF" />
          </div>
        </DemoCard>
        <PropsTable rows={API.colorPicker} />
      </section>
      {/* Knob */}
      <section class="mt-16 scroll-mt-24" id="knob">
        <h2 class="text-lg tracking-tight">Knob</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Rotary control with the reliable gesture: drag VERTICALLY to change the value (angle-following wraps badly at
          the detent), arrows / PageUp-Down / Home-End on the keyboard, full slider semantics. The indicator sweeps
          270°.
        </p>
        <DemoCard code={SNIPPET_KNOB}>
          <div class="flex justify-center gap-6">
            <DitherKnob modelValue={64} />
            <DitherKnob modelValue={25} size={56} />
            <DitherKnob modelValue={90} size={88} disabled />
          </div>
        </DemoCard>
        <PropsTable rows={API.knob} />
      </section>
      {/* SignaturePad */}
      <section class="mt-16 scroll-mt-24" id="signature-pad">
        <h2 class="text-lg tracking-tight">SignaturePad</h2>
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
      </section>
    </>
  )
}
