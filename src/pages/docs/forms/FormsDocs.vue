<script setup lang="ts">
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
} from "@dither-kit"
import DitherField from "@dither-kit/DitherField.vue"
import DitherInput from "@dither-kit/DitherInput.vue"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const SNIPPET_PASSWORD_INPUT = `<DitherField label="Password">
  <DitherPasswordInput v-model="pw" placeholder="At least 12 characters" />
</DitherField>`

const SNIPPET_SEARCH_INPUT = `<DitherSearchInput v-model="q" @clear="resetResults" />`

const SNIPPET_EMAIL_INPUT = `<DitherEmailInput v-model="email" />`

const SNIPPET_PHONE_INPUT = `<DitherPhoneInput v-model="phone" />`

const SNIPPET_CURRENCY_INPUT = `<DitherCurrencyInput v-model="amount" prefix="$" />`

const SNIPPET_SCRUB_INPUT = `<DitherScrubInput v-model="opacity" :min="0" :max="100" :step="1" />`

const SNIPPET_HOTKEY_INPUT = `<DitherHotkeyInput v-model="binding" />`

const SNIPPET_CODE_INPUT = `<DitherCodeInput v-model="snippet" @submit="run" :rows="8" />`

const SNIPPET_INPUT_GROUP = `<DitherInputGroup>
  <template #prefix>https://</template>
  <DitherInput v-model="host" class="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
  <template #suffix>/docs</template>
</DitherInputGroup>`

const SNIPPET_INLINE_EDIT = `<DitherInlineEdit v-model="name" @save="persist" />`

const SNIPPET_TAG_INPUT = `<DitherTagInput v-model="tags" :max="8" placeholder="Add tag…" />`

const SNIPPET_CHOICE_CHIPS = `<DitherChoiceChips v-model="size" :options="['S', 'M', 'L', 'XL']" />
<DitherChoiceChips v-model="tags" multiple :options="['bug', 'feat', 'docs']" />`

const SNIPPET_CHECKBOX_CARD = `<DitherCheckboxCard v-model="on"
  label="Telemetry"
  description="Anonymous usage stats help pick the next components" />`

const SNIPPET_KEY_VALUE_INPUT = `<DitherKeyValueInput v-model="headers" />`

const SNIPPET_MENTION_INPUT = `<DitherMentionInput v-model="body" :options="handles" @mention="notify" />`

const SNIPPET_FILE_INPUT = `<DitherFileInput v-model="picked" multiple accept="image/*" />`

const SNIPPET_LIST_BOX = `<DitherListBox v-model="city" :options="['Kyoto', 'Seoul', 'Taipei']" @select="go" />`

const SNIPPET_MULTI_SELECT = `<DitherMultiSelect v-model="tags" :options="ALL_TAGS" @search="filter" />`

const SNIPPET_CASCADE_SELECT = `<DitherCascadeSelect v-model="region" :tree="TREE"
  :placeholders="['Country', 'Region', 'City']" />`

const SNIPPET_TRANSFER_LIST = `<DitherTransferList v-model="roles" :source="ALL_ROLES"
  source-label="Roles" target-label="Assigned" />`

const SNIPPET_LANGUAGE_SELECT = `<DitherLanguageSelect v-model="locale" include-default />`

const SNIPPET_ICON_PICKER = `<DitherIconPicker v-model="glyph" @update:model-value="save" />`

const SNIPPET_FONT_PICKER = `<DitherFontPicker v-model="font" />`

const SNIPPET_CALENDAR = `<DitherCalendar v-model="day" :max="today" />`

const SNIPPET_DATE_PICKER = `<DitherDatePicker v-model="due" min="2026-01-01" />`

const SNIPPET_MONTH_PICKER = `<DitherMonthPicker v-model="month" />`

const SNIPPET_COLOR_SWATCH = `<DitherColorSwatch v-for="c in palette" :key="c" :color="c"
  :selected="c === active" @select="active = c" />`

const SNIPPET_COLOR_PICKER = `<DitherColorPicker v-model="tint" />`

const SNIPPET_KNOB = `<DitherKnob v-model="gain" :min="0" :max="100" :step="1" />`

const SNIPPET_SIGNATURE_PAD = `<DitherSignaturePad v-model="sig" @change="save" :height="180" />`

const API: Record<string, PropRow[]> = {
  passwordInput: [{ prop: "modelValue", type: "string (v-model)", default: "\"\"" }, { prop: "invalid", type: "boolean", default: "false" }],
  searchInput: [{ prop: "modelValue", type: "string (v-model)", default: "\"\"" }, { prop: "@clear", type: "() on clear/Escape", default: "—" }],
  emailInput: [{ prop: "modelValue", type: "string (v-model)", default: "\"\"" }, { prop: "autocomplete", type: "string", default: "\"email\"" }],
  phoneInput: [{ prop: "modelValue", type: "string (v-model, formatted)", default: "\"\"" }, { prop: "autocomplete", type: "string", default: "\"tel\"" }],
  currencyInput: [{ prop: "modelValue", type: "string (v-model, digits[.digits])", default: "\"\"" }, { prop: "prefix", type: "string", default: "\"$\"" }, { prop: "locale", type: "string", default: "\"en-US\"" }],
  scrubInput: [{ prop: "modelValue", type: "number (v-model)", default: "0" }, { prop: "min / max / step", type: "number", default: "0 / 100 / 1" }],
  hotkeyInput: [{ prop: "modelValue", type: "string (v-model)", default: "\"\"" }, { prop: "placeholder", type: "string", default: "\"Press a shortcut…\"" }],
  codeInput: [{ prop: "modelValue", type: "string (v-model)", default: "\"\"" }, { prop: "rows", type: "number", default: "6" }, { prop: "@submit", type: "Ctrl/Cmd + Enter", default: "—" }],
  inputGroup: [],
  inlineEdit: [{ prop: "modelValue", type: "string (v-model)", default: "\"\"" }, { prop: "@save / @cancel", type: "(value) / ()", default: "—" }],
  tagInput: [{ prop: "modelValue", type: "string[] (v-model)", default: "[]" }, { prop: "max", type: "number", default: "Infinity" }],
  choiceChips: [{ prop: "options", type: "string[]", default: "[]" }, { prop: "value", type: "string | string[] (v-model)", default: "\"\" / []" }, { prop: "multiple", type: "boolean (checkbox mode)", default: "false" }],
  checkboxCard: [{ prop: "modelValue", type: "boolean (v-model)", default: "false" }, { prop: "label / description", type: "string", default: "\"\"" }],
  keyValueInput: [{ prop: "modelValue", type: "{ key, value }[] (v-model)", default: "[]" }, { prop: "disabled", type: "boolean", default: "false" }],
  mentionInput: [{ prop: "modelValue", type: "string (v-model)", default: "\"\"" }, { prop: "options", type: "string[]", default: "[]" }, { prop: "@mention", type: "(handle) on insert", default: "—" }],
  fileInput: [{ prop: "modelValue", type: "File[] (v-model)", default: "[]" }, { prop: "multiple", type: "boolean", default: "false" }, { prop: "accept", type: "string (input accept)", default: "—" }, { prop: "@change", type: "(File[]) after pick/remove", default: "—" }],
  listBox: [{ prop: "options", type: "string[]", default: "[]" }, { prop: "value", type: "string (v-model)", default: "\"\"" }, { prop: "@select", type: "(value) on commit", default: "—" }],
  multiSelect: [{ prop: "options", type: "string[]", default: "[]" }, { prop: "value", type: "string[] (v-model)", default: "[]" }, { prop: "@search", type: "(query) as you type", default: "—" }],
  cascadeSelect: [{ prop: "tree", type: "{ value, children? }[]", default: "[]" }, { prop: "value", type: "string[] path (v-model)", default: "[]" }, { prop: "placeholders", type: "string[] per level", default: "Level n" }],
  transferList: [{ prop: "source", type: "string[] (pool)", default: "[]" }, { prop: "value", type: "string[] (destination)", default: "[]" }, { prop: "sourceLabel / targetLabel", type: "string", default: "Available / Selected" }],
  languageSelect: [{ prop: "modelValue", type: "string (BCP 47 tag)", default: "\"en\"" }, { prop: "includeDefault", type: "boolean (first entry)", default: "false" }, { prop: "defaultLabel", type: "string", default: "\"System default\"" }],
  iconPicker: [{ prop: "modelValue", type: "string (icon name)", default: "\"\"" }, { prop: "size", type: "number (px)", default: "16" }, { prop: "placeholder", type: "string (filter)", default: "\"Filter icons…\"" }],
  fontPicker: [{ prop: "modelValue", type: "string (CSS font stack)", default: "\"\"" }, { prop: "disabled", type: "boolean", default: "false" }],
  calendar: [{ prop: "modelValue", type: "string (ISO date, v-model)", default: "\"\"" }, { prop: "min / max", type: "string (ISO)", default: "—" }],
  datePicker: [{ prop: "modelValue", type: "string (ISO, v-model)", default: "\"\"" }, { prop: "min / max", type: "string (ISO)", default: "—" }, { prop: "@select", type: "(ISO) when picked", default: "—" }],
  monthPicker: [{ prop: "modelValue", type: "string (YYYY-MM, v-model)", default: "\"\"" }, { prop: "disabled", type: "boolean", default: "false" }],
  colorSwatch: [{ prop: "color", type: "string (css color)", default: "\"#5227FF\"" }, { prop: "label", type: "string (aria name)", default: "the color" }, { prop: "selected", type: "boolean (ring)", default: "false" }, { prop: "size", type: "number (px)", default: "24" }],
  colorPicker: [{ prop: "modelValue", type: "string (hex, v-model)", default: "\"#5227FF\"" }, { prop: "disabled", type: "boolean", default: "false" }],
  knob: [{ prop: "modelValue", type: "number (v-model)", default: "50" }, { prop: "min / max / step", type: "number", default: "0 / 100 / 1" }, { prop: "size", type: "number (px)", default: "72" }],
  signaturePad: [{ prop: "modelValue", type: "string (dataURL, v-model)", default: "\"\"" }, { prop: "width / height", type: "number (canvas)", default: "420 / 160" }, { prop: "@change", type: "(dataURL) per stroke", default: "—" }],
}
</script>


<template>
  <!-- PasswordInput -->
  <section id="password-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">PasswordInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Password field with a reveal toggle: the type flips text/password,
      the button carries its own accessible name and never submits
      (<code class="text-foreground/80">type="button"</code>).
    </p>
    <DemoCard :code="SNIPPET_PASSWORD_INPUT">
      <div class="mx-auto w-full max-w-xs">
      <DitherField label="Password">
        <DitherPasswordInput model-value="correct-horse-battery" placeholder="At least 12 characters" />
      </DitherField>
    </div>
    </DemoCard>
    <PropsTable :rows="API.passwordInput" />
  </section>

  <!-- SearchInput -->
  <section id="search-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">SearchInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Leading glyph, one-click clear (only when there is something to
      clear) and Escape empties the field — fires a <code class="text-foreground/80">clear</code>
      event so results can reset in the same beat.
    </p>
    <DemoCard :code="SNIPPET_SEARCH_INPUT">
      <div class="mx-auto w-full max-w-xs">
      <DitherSearchInput model-value="dither" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.searchInput" />
  </section>

  <!-- EmailInput -->
  <section id="email-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">EmailInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The three things a bare text input gets wrong, fixed in one place:
      <code class="text-foreground/80">type=email</code>,
      <code class="text-foreground/80">inputmode=email</code>,
      <code class="text-foreground/80">autocomplete=email</code>.
    </p>
    <DemoCard :code="SNIPPET_EMAIL_INPUT">
      <div class="mx-auto w-full max-w-xs">
      <DitherEmailInput model-value="" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.emailInput" />
  </section>

  <!-- PhoneInput -->
  <section id="phone-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">PhoneInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Digits normalized into the <code class="text-foreground/80">(415) 555-2671</code>
      shape while you type (10-digit NANP), tel keyboard on mobile. The model
      is always the formatted string; the caret is end-anchored by design.
    </p>
    <DemoCard :code="SNIPPET_PHONE_INPUT">
      <div class="mx-auto w-full max-w-xs">
      <DitherPhoneInput model-value="(415) 555-2671" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.phoneInput" />
  </section>

  <!-- CurrencyInput -->
  <section id="currency-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">CurrencyInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Money entry with predictable mechanics: the model stays a plain
      decimal string (<code class="text-foreground/80">"1234.56"</code>), the
      display groups thousands while blurred and shows raw digits while
      focused so typing and the caret stay sane. Digits and one dot only.
    </p>
    <DemoCard :code="SNIPPET_CURRENCY_INPUT">
      <div class="mx-auto w-full max-w-xs">
      <DitherCurrencyInput model-value="1234567.5" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.currencyInput" />
  </section>

  <!-- ScrubInput -->
  <section id="scrub-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">ScrubInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The Figma-style drag gesture on a number: the grip is a real
      <code class="text-foreground/80">role="slider"</code> — arrow keys,
      PageUp/Down and Home/End work without a pointer — and the read-only
      input stays selectable for copying. Values snap to
      <code class="text-foreground/80">step</code>.
    </p>
    <DemoCard :code="SNIPPET_SCRUB_INPUT">
      <div class="mx-auto w-full max-w-xs">
      <DitherField label="Opacity" description="Drag the grip, or focus it and use the arrows">
        <DitherScrubInput :model-value="64" :min="0" :max="100" :step="1" />
      </DitherField>
    </div>
    </DemoCard>
    <PropsTable :rows="API.scrubInput" />
  </section>

  <!-- HotkeyInput -->
  <section id="hotkey-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">HotkeyInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Shortcut capture: modifiers hold until a non-modifier key arrives,
      repeat is ignored, Escape clears. Value shape:
      <code class="text-foreground/80">Ctrl+Shift+K</code> (order Ctrl, Alt,
      Shift, Meta, then the key).
    </p>
    <DemoCard :code="SNIPPET_HOTKEY_INPUT">
      <div class="mx-auto w-full max-w-xs">
      <DitherField label="Command palette" description="Click the field, then press the combo">
        <DitherHotkeyInput model-value="Ctrl+Shift+K" />
      </DitherField>
    </div>
    </DemoCard>
    <PropsTable :rows="API.hotkeyInput" />
  </section>

  <!-- CodeInput -->
  <section id="code-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">CodeInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Code entry where Tab indents (two spaces), Shift+Tab dedents the
      selected lines, and Ctrl/Cmd+Enter fires <code class="text-foreground/80">submit</code>
      — the browser's tab trap handled once, here.
    </p>
    <DemoCard :code="SNIPPET_CODE_INPUT">
      <div class="mx-auto w-full max-w-md">
      <DitherCodeInput model-value="const dither = bayer(4)" :rows="4" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.codeInput" />
  </section>

  <!-- InputGroup -->
  <section id="input-group" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">InputGroup</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Addon slots around a control in one bordered group: the group owns
      the border and the focus-within ring, the inner control drops its own
      chrome (the code tab shows the exact class set).
    </p>
    <DemoCard :code="SNIPPET_INPUT_GROUP">
      <div class="mx-auto w-full max-w-sm">
      <DitherInputGroup>
        <template #prefix>https://</template>
        <DitherInput model-value="dither-ui.com" class="min-h-8 border-0 bg-transparent px-0 py-1 shadow-none hover:border-0 focus-visible:ring-0" />
        <template #suffix>/docs</template>
      </DitherInputGroup>
    </div>
    </DemoCard>
    <!-- no props: slots and the focus ring are the API -->
  </section>

  <!-- InlineEdit -->
  <section id="inline-edit" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">InlineEdit</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Click-to-edit text: view mode is a real button (keyboard reachable),
      edit mode focus-selects. Enter or blur commits — only when the value
      actually changed — Escape reverts.
    </p>
    <DemoCard :code="SNIPPET_INLINE_EDIT">
      <div class="mx-auto w-full max-w-xs">
      <DitherField label="Display name" description="Click the value to edit it">
        <DitherInlineEdit model-value="bogdan" />
      </DitherField>
    </div>
    </DemoCard>
    <PropsTable :rows="API.inlineEdit" />
  </section>

  <!-- TagInput -->
  <section id="tag-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">TagInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Tags as chips in one field: Enter or comma commits, Backspace on an
      empty input pulls the last chip back in, per-chip × removes. Trimmed,
      case-deduped, <code class="text-foreground/80">max</code>-capped.
    </p>
    <DemoCard :code="SNIPPET_TAG_INPUT">
      <div class="mx-auto w-full max-w-sm">
      <DitherTagInput :model-value="['vue', 'dither']" placeholder="Add tag…" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.tagInput" />
  </section>

  <!-- ChoiceChips -->
  <section id="choice-chips" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">ChoiceChips</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Chip-style choice group where the chip IS the label of a real radio
      (or checkbox when <code class="text-foreground/80">multiple</code>) —
      native keyboard semantics and focus come for free, no roving tabindex to
      get wrong.
    </p>
    <DemoCard :code="SNIPPET_CHOICE_CHIPS">
      <div class="mx-auto grid max-w-sm gap-4">
      <DitherChoiceChips :model-value="'M'" :options="['S', 'M', 'L', 'XL']" />
      <DitherChoiceChips :model-value="['bug']" multiple :options="['bug', 'feat', 'docs']" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.choiceChips" />
  </section>

  <!-- CheckboxCard -->
  <section id="checkbox-card" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">CheckboxCard</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The whole card is the checkbox's label — title and description ride
      along, one click anywhere toggles, the focus ring shows keyboard focus.
      The checkbox stays the source of truth.
    </p>
    <DemoCard :code="SNIPPET_CHECKBOX_CARD">
      <div class="mx-auto grid max-w-sm gap-2">
      <DitherCheckboxCard :model-value="true" label="Telemetry"
        description="Anonymous usage stats help pick the next components" />
      <DitherCheckboxCard :model-value="false" label="Beta channel"
        description="Get breaking changes before everyone else" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.checkboxCard" />
  </section>

  <!-- KeyValueInput -->
  <section id="key-value-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">KeyValueInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Repeatable key/value rows — headers, metadata, query params. Every
      edit emits the whole array (the parent owns the truth), rows are added
      and removed from the bottom.
    </p>
    <DemoCard :code="SNIPPET_KEY_VALUE_INPUT">
      <div class="mx-auto w-full max-w-md">
      <DitherKeyValueInput
        :model-value="[
          { key: 'Content-Type', value: 'application/json' },
          { key: 'X-Client', value: 'dither-ui' },
        ]"
      />
    </div>
    </DemoCard>
    <PropsTable :rows="API.keyValueInput" />
  </section>

  <!-- MentionInput -->
  <section id="mention-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">MentionInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Textarea with <code class="text-foreground/80">@</code>-mention
      autocomplete: detection is a regex on the text before the caret, the
      list anchors to the field, Arrow keys pick, Enter/Tab inserts, Escape
      closes — the caret lands after the inserted handle.
    </p>
    <DemoCard :code="SNIPPET_MENTION_INPUT">
      <div class="mx-auto w-full max-w-md">
      <DitherMentionInput model-value="cc @da" :options="['dana', 'darius', 'daniela', 'sam']" :rows="3" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.mentionInput" />
  </section>

  <!-- FileInput -->
  <section id="file-input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">FileInput</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      File picker with a visible selection: a hidden native input driven
      by its label (keyboard-reachable), files listed with sizes, per-file
      remove, clear-all, and drop-zone drag styling. The model is
      <code class="text-foreground/80">File[]</code> — owned by the parent.
    </p>
    <DemoCard :code="SNIPPET_FILE_INPUT">
      <div class="mx-auto w-full max-w-sm">
      <DitherFileInput :model-value="[]" multiple accept="image/*" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.fileInput" />
  </section>

  <!-- ListBox -->
  <section id="list-box" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">ListBox</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Single-select with the full WAI-ARIA keyboard contract: arrows move
      the active option, Home/End jump, Enter/Space selects, and the active
      row carries <code class="text-foreground/80">aria-activedescendant</code>
      so focus never leaves the listbox itself.
    </p>
    <DemoCard :code="SNIPPET_LIST_BOX">
      <div class="mx-auto w-full max-w-[16rem]">
      <DitherListBox :model-value="'Seoul'" :options="['Kyoto', 'Seoul', 'Taipei', 'Osaka', 'Busan']" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.listBox" />
  </section>

  <!-- MultiSelect -->
  <section id="multi-select" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">MultiSelect</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Chips for what's picked, native checkboxes for what's pickable,
      a filter box over the pool — keyboard semantics come from the checkboxes,
      the selected set stays visible and individually removable.
    </p>
    <DemoCard :code="SNIPPET_MULTI_SELECT">
      <div class="mx-auto w-full max-w-sm">
      <DitherMultiSelect :model-value="['vue', 'dither']" :options="['vue', 'dither', 'canvas', 'tokens', 'ssr']" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.multiSelect" />
  </section>

  <!-- CascadeSelect -->
  <section id="cascade-select" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">CascadeSelect</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Dependent pickers: each level's options come from the tree under the
      current path, and changing a parent truncates the deeper segments — the
      classic cascade rule, in one component. The model is the chosen path.
    </p>
    <DemoCard :code="SNIPPET_CASCADE_SELECT">
      <div class="mx-auto w-full max-w-md">
      <DitherCascadeSelect
        :model-value="['Japan', 'Kansai']"
        :tree="[
          { value: 'Japan', children: [
            { value: 'Kansai', children: [{ value: 'Kyoto' }, { value: 'Osaka' }] },
            { value: 'Kanto', children: [{ value: 'Tokyo' }, { value: 'Yokohama' }] },
          ] },
          { value: 'Korea', children: [
            { value: 'Seoul Region', children: [{ value: 'Seoul' }, { value: 'Incheon' }] },
          ] },
        ]"
        :placeholders="['Country', 'Region', 'City']"
      />
    </div>
    </DemoCard>
    <PropsTable :rows="API.cascadeSelect" />
  </section>

  <!-- TransferList -->
  <section id="transfer-list" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">TransferList</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Two-panel shuttle: the source pool stays put, the destination IS the
      model. Checkboxes select in either direction, Add/Remove move the
      selection, Add all/Remove all flush — every control a real button.
    </p>
    <DemoCard :code="SNIPPET_TRANSFER_LIST">
      <div class="mx-auto w-full max-w-xl">
      <DitherTransferList
        :value="['admin']"
        :source="['admin', 'editor', 'viewer', 'billing', 'support']"
        source-label="Roles" target-label="Assigned"
      />
    </div>
    </DemoCard>
    <PropsTable :rows="API.transferList" />
  </section>

  <!-- LanguageSelect -->
  <section id="language-select" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">LanguageSelect</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Language picker over a curated BCP 47 list — the label is the human
      name, the value is the tag, and
      <code class="text-foreground/80">includeDefault</code> keeps the opt-out
      one option away.
    </p>
    <DemoCard :code="SNIPPET_LANGUAGE_SELECT">
      <div class="mx-auto w-full max-w-xs">
      <DitherLanguageSelect model-value="ja" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.languageSelect" />
  </section>

  <!-- IconPicker -->
  <section id="icon-picker" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">IconPicker</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The kit's own glyphs behind a name filter — a radio grid, so arrow
      keys roam the whole grid as one tab stop. Value = the icon name,
      ready for <code class="text-foreground/80">&lt;DitherIcon&gt;</code>.
    </p>
    <DemoCard :code="SNIPPET_ICON_PICKER">
      <div class="mx-auto w-full max-w-sm">
      <DitherIconPicker model-value="Check" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.iconPicker" />
  </section>

  <!-- FontPicker -->
  <section id="font-picker" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">FontPicker</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Each option renders its own name in its own family — the preview IS
      the choice, so no swatch can drift from the value. Value = the CSS font
      stack string.
    </p>
    <DemoCard :code="SNIPPET_FONT_PICKER">
      <div class="mx-auto w-full max-w-sm">
      <DitherFontPicker model-value="'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.fontPicker" />
  </section>

  <!-- Calendar -->
  <section id="calendar" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Calendar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Month grid with real grid semantics: arrows move the day,
      PageUp/PageDown change month, Home/End jump to week edges, and the
      model is ISO <code class="text-foreground/80">YYYY-MM-DD</code> so
      timezone math never enters the picture. Today gets a ring, the
      selected day the fill.
    </p>
    <DemoCard :code="SNIPPET_CALENDAR">
      <div class="flex justify-center">
      <DitherCalendar model-value="2026-10-07" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.calendar" />
  </section>

  <!-- DatePicker -->
  <section id="date-picker" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">DatePicker</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Date field + calendar popover: the input shows a human format, the
      calendar opens on click/focus, select closes, Escape and outside-click
      dismiss. The model stays ISO.
    </p>
    <DemoCard :code="SNIPPET_DATE_PICKER">
      <div class="mx-auto w-full max-w-xs">
      <DitherDatePicker model-value="2026-10-07" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.datePicker" />
  </section>

  <!-- MonthPicker -->
  <section id="month-picker" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">MonthPicker</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Year + twelve-month grid: model is <code class="text-foreground/80">YYYY-MM</code>,
      arrows roam the grid (three columns), PageUp/PageDown shift the year,
      the current month keeps a ring.
    </p>
    <DemoCard :code="SNIPPET_MONTH_PICKER">
      <div class="flex justify-center">
      <DitherMonthPicker model-value="2026-10" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.monthPicker" />
  </section>

  <!-- ColorSwatch -->
  <section id="color-swatch" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">ColorSwatch</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      One color as a pickable chip — a real button with the color in its
      accessible name, a selected ring, a keyboard focus ring. Reads as pure
      display when nothing listens to <code class="text-foreground/80">select</code>.
    </p>
    <DemoCard :code="SNIPPET_COLOR_SWATCH">
      <div class="flex justify-center gap-2">
      <DitherColorSwatch color="#5227FF" selected label="Iris" />
      <DitherColorSwatch color="#7CFF67" label="Mint" />
      <DitherColorSwatch color="#FFB454" label="Amber" />
      <DitherColorSwatch color="#FF5C7A" label="Rose" />
      <DitherColorSwatch color="#4CC2FF" label="Sky" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.colorSwatch" />
  </section>

  <!-- ColorPicker -->
  <section id="color-picker" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">ColorPicker</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      HSV field + hue strip + hex readout: the plane is pointer-driven
      (arrows nudge S/V, Shift for coarse), the hue strip is a slider of its
      own, and the hex input accepts what you type. Model = hex string.
    </p>
    <DemoCard :code="SNIPPET_COLOR_PICKER">
      <div class="flex justify-center">
      <DitherColorPicker model-value="#5227FF" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.colorPicker" />
  </section>

  <!-- Knob -->
  <section id="knob" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Knob</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Rotary control with the reliable gesture: drag VERTICALLY to change
      the value (angle-following wraps badly at the detent), arrows /
      PageUp-Down / Home-End on the keyboard, full slider semantics. The
      indicator sweeps 270°.
    </p>
    <DemoCard :code="SNIPPET_KNOB">
      <div class="flex justify-center gap-6">
      <DitherKnob :model-value="64" />
      <DitherKnob :model-value="25" :size="56" />
      <DitherKnob :model-value="90" :size="88" disabled />
    </div>
    </DemoCard>
    <PropsTable :rows="API.knob" />
  </section>

  <!-- SignaturePad -->
  <section id="signature-pad" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">SignaturePad</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Pointer drawing on a canvas — <code class="text-foreground/80">change</code>
      fires the dataURL after every stroke and on clear. A context-less
      environment refuses strokes instead of throwing, so degraded engines
      degrade visibly.
    </p>
    <DemoCard :code="SNIPPET_SIGNATURE_PAD">
      <div class="mx-auto w-full max-w-md">
      <DitherSignaturePad :height="140" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.signaturePad" />
  </section>
</template>
