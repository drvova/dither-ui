<script setup lang="ts">
import {
  DitherBlockquote,
  DitherCaption,
  DitherCode,
  DitherCopyableText,
  DitherCurrencyText,
  DitherDateTimeText,
  DitherDurationText,
  DitherEllipsisTooltip,
  DitherEmoji,
  DitherExternalLink,
  DitherFileSizeText,
  DitherHeading,
  DitherHighlight,
  DitherKbdCombo,
  DitherLabel,
  DitherLineClamp,
  DitherLink,
  DitherMiddleEllipsis,
  DitherNumberText,
  DitherOverline,
  DitherPercentText,
  DitherPluralText,
  DitherRelativeTime,
  DitherSelectableText,
  DitherTruncate,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const SNIPPET_HEADING = `<DitherHeading level="1">Page title</DitherHeading>
<DitherHeading level="2">Section title</DitherHeading>
<DitherHeading level="4" class="text-muted-foreground">Quiet subhead</DitherHeading>`

const SNIPPET_LABEL = `<DitherLabel for="email" required>Email</DitherLabel>
<DitherInput id="email" placeholder="you@example.com" />`

const SNIPPET_CAPTION = `<DitherCaption>Uploaded 3 minutes ago</DitherCaption>
<DitherCaption tone="faint">auto-saved</DitherCaption>`

const SNIPPET_OVERLINE = `<DitherOverline>Chapter 02</DitherOverline>
<DitherHeading level="2">The renderer</DitherHeading>`

const SNIPPET_CODE = `Run <DitherCode>npm run build</DitherCode> before shipping —
the <DitherCode>dist/</DitherCode> folder is the artifact.`

const SNIPPET_KBD_COMBO = `<DitherKbdCombo :keys="['⌘', 'K']" />
<DitherKbdCombo :keys="['Ctrl', 'Shift', 'P']" separator="›" />`

const SNIPPET_BLOCKQUOTE = `<DitherBlockquote>
  Dithering trades smooth gradients for a fixed threshold —
  and the threshold is the style.
</DitherBlockquote>`

const SNIPPET_HIGHLIGHT = `Matches are <DitherHighlight>highlighted inline</DitherHighlight>
without breaking the reading flow.`

const SNIPPET_TRUNCATE = `<DitherTruncate title="the very long file name">…</DitherTruncate>`

const SNIPPET_LINE_CLAMP = `<DitherLineClamp :lines="2">
  Long body copy that stops after two lines with an ellipsis…
</DitherLineClamp>`

const SNIPPET_MIDDLE_ELLIPSIS = `<DitherMiddleEllipsis text="src/pages/docs/primitives/PrimitivesDocs.vue" />`

const SNIPPET_ELLIPSIS_TOOLTIP = `<DitherEllipsisTooltip>Full sentence that only shows a tooltip when it actually clips…</DitherEllipsisTooltip>`

const SNIPPET_LINK = `<DitherLink :href="routePath('/docs')">Docs home</DitherLink>`

const SNIPPET_EXTERNAL_LINK = `<DitherExternalLink href="https://vuejs.org">Vue docs</DitherExternalLink>`

const SNIPPET_SELECTABLE_TEXT = `<DitherSelectableText>sk_live_51Nq…f9X</DitherSelectableText>`

const SNIPPET_COPYABLE_TEXT = `<DitherCopyableText value="npm i d3-scale d3-shape clsx tailwind-merge">
  copy install
</DitherCopyableText>`

const SNIPPET_NUMBER_TEXT = `<DitherNumberText :value="1234567.5" :decimals="2" />
<DitherNumberText :value="1234567.5" locale="de-DE" />`

const SNIPPET_CURRENCY_TEXT = `<DitherCurrencyText :value="1299.5" currency="USD" />
<DitherCurrencyText :value="1299.5" currency="EUR" locale="de-DE" />`

const SNIPPET_PERCENT_TEXT = `<DitherPercentText :value="0.42" />
<DitherPercentText :value="0.4235" :decimals="1" />`

const SNIPPET_FILE_SIZE_TEXT = `<DitherFileSizeText :bytes="1536" />
<DitherFileSizeText :bytes="8589934592" />`

const SNIPPET_DURATION_TEXT = `<DitherDurationText :ms="45000" />
<DitherDurationText :ms="80400000" />`

const SNIPPET_RELATIVE_TIME = `<DitherRelativeTime :date="Date.now() - 90_000" />
<DitherRelativeTime :date="new Date('2026-01-05')" :auto="false" />`

const SNIPPET_DATE_TIME_TEXT = `<DitherDateTimeText date="2026-10-07T15:04:00Z"
  :options="{ timeZone: 'UTC', dateStyle: 'long' }" />`

const SNIPPET_PLURAL_TEXT = `<DitherPluralText :count="n" v-slot="{ count }">
  <b>{{ count }}</b> file{{ count === 1 ? "" : "s" }} selected
</DitherPluralText>`

const SNIPPET_EMOJI = `<DitherEmoji char="🚀" label="launch" />
<DitherEmoji char="🔥" label="trending" class="text-lg" />`

const API: Record<string, PropRow[]> = {
  heading: [{ prop: "level", type: "1 | 2 | 3 | 4 | 5 | 6", default: "2" }],
  label: [{ prop: "required", type: "boolean", default: "false" }],
  caption: [{ prop: "tone", type: "\"muted\" | \"faint\"", default: "\"muted\"" }],
  overline: [{ prop: "tone", type: "\"muted\" | \"faint\"", default: "\"muted\"" }],
  code: [],
  kbdCombo: [{ prop: "keys", type: "string[]", default: "['⌘', 'K']" }, { prop: "separator", type: "string", default: "\"+\"" }],
  blockquote: [],
  highlight: [],
  truncate: [{ prop: "as", type: "string", default: "\"span\"" }, { prop: "title", type: "string", default: "—" }],
  lineClamp: [{ prop: "lines", type: "1 | 2 | 3 | 4 | 5 | 6", default: "3" }, { prop: "as", type: "string", default: "\"p\"" }],
  middleEllipsis: [{ prop: "text", type: "string", default: "\"…\"" }, { prop: "head", type: "number (chars)", default: "8" }, { prop: "tail", type: "number (chars)", default: "6" }, { prop: "title", type: "boolean", default: "true" }],
  ellipsisTooltip: [{ prop: "enabled", type: "boolean", default: "true" }, { prop: "as", type: "string", default: "\"span\"" }],
  link: [{ prop: "href", type: "string", default: "required" }, { prop: "external", type: "boolean (target + rel)", default: "false" }],
  externalLink: [{ prop: "iconSize", type: "number (px)", default: "12" }],
  selectableText: [{ prop: "as", type: "string", default: "\"span\"" }],
  copyableText: [{ prop: "value", type: "string", default: "required" }, { prop: "label", type: "string (aria)", default: "\"Copy\"" }, { prop: "size", type: "number (px)", default: "14" }],
  numberText: [{ prop: "value", type: "number", default: "required" }, { prop: "decimals", type: "number (min = max)", default: "natural" }, { prop: "locale", type: "string", default: "\"en-US\"" }, { prop: "grouping", type: "boolean", default: "true" }],
  currencyText: [{ prop: "value", type: "number", default: "required" }, { prop: "currency", type: "string (ISO 4217)", default: "\"USD\"" }, { prop: "locale", type: "string", default: "\"en-US\"" }, { prop: "decimals", type: "number", default: "2" }],
  percentText: [{ prop: "value", type: "number (fraction)", default: "required" }, { prop: "decimals", type: "number", default: "0" }, { prop: "locale", type: "string", default: "\"en-US\"" }],
  fileSizeText: [{ prop: "bytes", type: "number", default: "0" }, { prop: "decimals", type: "number (≥ 1KB)", default: "1" }, { prop: "locale", type: "string", default: "\"en-US\"" }],
  durationText: [{ prop: "ms", type: "number", default: "0" }],
  relativeTime: [{ prop: "date", type: "Date | string | number", default: "required" }, { prop: "auto", type: "boolean (re-tick)", default: "true" }, { prop: "now", type: "number (frozen clock)", default: "Date.now()" }, { prop: "updateInterval", type: "number (ms)", default: "30000" }],
  dateTimeText: [{ prop: "date", type: "Date | string | number", default: "\"\"" }, { prop: "locale", type: "string", default: "\"en-US\"" }, { prop: "options", type: "Intl.DateTimeFormatOptions", default: "medium date + short time" }],
  pluralText: [{ prop: "count", type: "number", default: "0" }, { prop: "locale", type: "string (BCP 47)", default: "\"en\"" }, { prop: "slots", type: "named by category: #one, #few, #many… + default", default: "default" }],
  emoji: [{ prop: "char", type: "string (unicode)", default: "\"✨\"" }, { prop: "label", type: "string (aria)", default: "\"\"" }],
}
</script>


<template>
  <!-- Heading -->
  <section id="heading" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Heading</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Semantic h1–h6 on the site's scale: level picks the size and weight,
      <code class="text-foreground/80">class</code> overrides anything below.
    </p>
    <DemoCard :code="SNIPPET_HEADING">
      <div class="grid gap-2 text-left">
      <DitherHeading level="1">Page title</DitherHeading>
      <DitherHeading level="2">Section title</DitherHeading>
      <DitherHeading level="4" class="text-muted-foreground">Quiet subhead</DitherHeading>
    </div>
    </DemoCard>
    <PropsTable :rows="API.heading" />
  </section>

  <!-- Label -->
  <section id="label" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Label</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A real <code class="text-foreground/80">&lt;label&gt;</code> — pairs
      with controls through <code class="text-foreground/80">for</code> (or by
      nesting), which is the whole point over a styled span. A required marker
      adds an asterisk that screen readers skip.
    </p>
    <DemoCard :code="SNIPPET_LABEL">
      <div class="grid w-full max-w-xs gap-1.5 text-left">
      <DitherLabel required>Email</DitherLabel>
      <div class="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 text-[12px] text-muted-foreground">you@example.com</div>
    </div>
    </DemoCard>
    <PropsTable :rows="API.label" />
  </section>

  <!-- Caption -->
  <section id="caption" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Caption</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Supporting text in the caption register — 11px and muted, with a
      fainter tier for the quietest asides.
    </p>
    <DemoCard :code="SNIPPET_CAPTION">
      <div class="grid gap-1">
      <span class="text-[13px] text-foreground">release-2.4.0.tar.zst</span>
      <DitherCaption>Uploaded 3 minutes ago</DitherCaption>
      <DitherCaption tone="faint">auto-saved</DitherCaption>
    </div>
    </DemoCard>
    <PropsTable :rows="API.caption" />
  </section>

  <!-- Overline -->
  <section id="overline" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Overline</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The tiny uppercase eyebrow above a section — 10px, open tracking,
      muted. Editorial structure without a heading's weight.
    </p>
    <DemoCard :code="SNIPPET_OVERLINE">
      <div class="text-left">
      <DitherOverline>Chapter 02</DitherOverline>
      <DitherHeading level="2" class="mt-1">The renderer</DitherHeading>
    </div>
    </DemoCard>
    <PropsTable :rows="API.overline" />
  </section>

  <!-- Code -->
  <section id="code" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Code</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Inline code — the <code class="text-foreground/80">&lt;code&gt;</code>
      element in house chrome. For the copyable block form, that's CodeBlock in
      the app layer; this one lives inside prose.
    </p>
    <DemoCard :code="SNIPPET_CODE">
      <p class="text-[13px] leading-relaxed text-muted-foreground">
      Run <DitherCode>npm run build</DitherCode> before shipping — the
      <DitherCode>dist/</DitherCode> folder is the artifact.
    </p>
    </DemoCard>
    <!-- no props: the element or behavior is the API -->
  </section>

  <!-- KbdCombo -->
  <section id="kbd-combo" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">KbdCombo</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A shortcut as one readable unit — keys in Kbd chips with the
      separator between them. Single keys go through DitherKbd directly.
    </p>
    <DemoCard :code="SNIPPET_KBD_COMBO">
      <div class="flex flex-wrap items-center justify-center gap-4">
      <DitherKbdCombo :keys="['⌘', 'K']" />
      <DitherKbdCombo :keys="['Ctrl', 'Shift', 'P']" separator="›" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.kbdCombo" />
  </section>

  <!-- Blockquote -->
  <section id="blockquote" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Blockquote</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Real <code class="text-foreground/80">&lt;blockquote&gt;</code>
      semantics with the editorial treatment — hairline left rule, muted
      register. Citations ride in the slot.
    </p>
    <DemoCard :code="SNIPPET_BLOCKQUOTE">
      <DitherBlockquote class="mx-auto max-w-md">
      Dithering trades smooth gradients for a fixed threshold — and the
      threshold is the style.
      <span class="mt-2 block text-[11px] text-muted-foreground/70">— palette.ts</span>
    </DitherBlockquote>
    </DemoCard>
    <!-- no props: the element or behavior is the API -->
  </section>

  <!-- Highlight -->
  <section id="highlight" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Highlight</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The <code class="text-foreground/80">&lt;mark&gt;</code> element
      with a neutral token wash — colored variants belong in
      <code class="text-foreground/80">class</code> because house color comes
      from palette seeds.
    </p>
    <DemoCard :code="SNIPPET_HIGHLIGHT">
      <p class="text-[13px] leading-relaxed text-muted-foreground">
      Matches are <DitherHighlight>highlighted inline</DitherHighlight> without
      breaking the reading flow.
    </p>
    </DemoCard>
    <!-- no props: the element or behavior is the API -->
  </section>

  <!-- Truncate -->
  <section id="truncate" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Truncate</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      One-line ellipsis around any content. The native
      <code class="text-foreground/80">title</code> attr rides through, so
      native tooltips stay one attribute away.
    </p>
    <DemoCard :code="SNIPPET_TRUNCATE">
      <div class="mx-auto w-56">
      <DitherTruncate title="quarterly-report-final-v3-actually-final.xlsx">
        quarterly-report-final-v3-actually-final.xlsx
      </DitherTruncate>
    </div>
    </DemoCard>
    <PropsTable :rows="API.truncate" />
  </section>

  <!-- LineClamp -->
  <section id="line-clamp" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">LineClamp</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A block clamped after N lines (1–6) with a real ellipsis — excerpts,
      card bodies, previews that must not grow.
    </p>
    <DemoCard :code="SNIPPET_LINE_CLAMP">
      <div class="mx-auto w-full max-w-sm">
      <DitherLineClamp :lines="2" class="text-[13px] leading-relaxed text-muted-foreground">
        The kit is a folder, not a package — copy it, alias it, and every
        component keeps the same seed contract all the way down to the Bayer
        matrix that thresholds the fill. This sentence exists only to overflow
        the two-line clamp so the ellipsis earns its place in the demo.
      </DitherLineClamp>
    </div>
    </DemoCard>
    <PropsTable :rows="API.lineClamp" />
  </section>

  <!-- MiddleEllipsis -->
  <section id="middle-ellipsis" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">MiddleEllipsis</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Center-ellipsis for identifiers — paths, keys, hashes keep both ends,
      which is where recognition happens. The full string stays in
      <code class="text-foreground/80">title</code>.
    </p>
    <DemoCard :code="SNIPPET_MIDDLE_ELLIPSIS">
      <div class="grid gap-2 text-[12px]">
      <DitherMiddleEllipsis class="font-mono" text="src/pages/docs/primitives/PrimitivesDocs.vue" :head="14" :tail="10" />
      <DitherMiddleEllipsis class="font-mono" text="sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" :head="10" :tail="8" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.middleEllipsis" />
  </section>

  <!-- EllipsisTooltip -->
  <section id="ellipsis-tooltip" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">EllipsisTooltip</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Truncation with a tooltip that only earns itself: observes its own
      overflow (ResizeObserver, zero forced reads) and publishes
      <code class="text-foreground/80">title</code> only while clipped —
      unclipped content gets no tooltip, which is the point.
    </p>
    <DemoCard :code="SNIPPET_ELLIPSIS_TOOLTIP">
      <div class="mx-auto w-56">
      <DitherEllipsisTooltip class="text-[12px] text-muted-foreground">
        Full sentence that only shows a tooltip when it actually clips in this narrow box.
      </DitherEllipsisTooltip>
    </div>
    </DemoCard>
    <PropsTable :rows="API.ellipsisTooltip" />
  </section>

  <!-- Link -->
  <section id="link" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Link</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The anchor, dressed in house chrome: hairline underline that grows its
      offset and brightens on hover, color inherited from wherever it sits.
    </p>
    <DemoCard :code="SNIPPET_LINK">
      <p class="text-[13px]">
      Read the <DitherLink href="#link">Link</DitherLink> section, then keep
      going — the underline widens on hover and settles back.
    </p>
    </DemoCard>
    <PropsTable :rows="API.link" />
  </section>

  <!-- ExternalLink -->
  <section id="external-link" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">ExternalLink</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      New-tab semantics done right — <code class="text-foreground/80">_blank</code>
      with <code class="text-foreground/80">rel=noreferrer</code> — plus the
      ExternalLink glyph after the label.
    </p>
    <DemoCard :code="SNIPPET_EXTERNAL_LINK">
      <p class="text-[13px]">
      <DitherExternalLink href="https://vuejs.org">Vue docs</DitherExternalLink>
      and
      <DitherExternalLink href="https://tailwindcss.com">Tailwind docs</DitherExternalLink>
      ship the runtime this kit leans on.
    </p>
    </DemoCard>
    <PropsTable :rows="API.externalLink" />
  </section>

  <!-- SelectableText -->
  <section id="selectable-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">SelectableText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Text that selects itself on click (<code class="text-foreground/80">user-select: all</code>)
      — license keys, tokens, one-tap copy targets. Wraps any inline content.
    </p>
    <DemoCard :code="SNIPPET_SELECTABLE_TEXT">
      <div class="grid gap-2 text-center text-[13px]">
      <span class="text-muted-foreground">Click the key — it all selects:</span>
      <DitherSelectableText class="font-mono">sk_live_51NqH2vKf9X</DitherSelectableText>
    </div>
    </DemoCard>
    <PropsTable :rows="API.selectableText" />
  </section>

  <!-- CopyableText -->
  <section id="copyable-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">CopyableText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      One-tap copy around a piece of text — value through the shared
      Clipboard primitive (live region included), trigger flips Copy → Check.
    </p>
    <DemoCard :code="SNIPPET_COPYABLE_TEXT">
      <div class="flex justify-center">
      <DitherCopyableText value="npm i d3-scale d3-shape clsx tailwind-merge">
        copy install
      </DitherCopyableText>
    </div>
    </DemoCard>
    <PropsTable :rows="API.copyableText" />
  </section>

  <!-- NumberText -->
  <section id="number-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">NumberText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Locale-aware numbers — grouping, decimals and locale through Intl,
      <code class="text-foreground/80">tabular-nums</code> so columns line up.
    </p>
    <DemoCard :code="SNIPPET_NUMBER_TEXT">
      <div class="grid justify-center gap-1 text-[13px]">
      <DitherNumberText :value="1234567.5" :decimals="2" />
      <DitherNumberText :value="1234567.5" locale="de-DE" class="text-muted-foreground" />
      <DitherNumberText :value="98.76" locale="ja-JP" :grouping="false" class="text-muted-foreground" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.numberText" />
  </section>

  <!-- CurrencyText -->
  <section id="currency-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">CurrencyText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Money through Intl — symbol placement and grammar are the runtime's
      job, ours is picking currency, locale and decimals.
    </p>
    <DemoCard :code="SNIPPET_CURRENCY_TEXT">
      <div class="grid justify-center gap-1 text-[13px]">
      <DitherCurrencyText :value="1299.5" />
      <DitherCurrencyText :value="1299.5" currency="EUR" locale="de-DE" class="text-muted-foreground" />
      <DitherCurrencyText :value="49" currency="JPY" :decimals="0" class="text-muted-foreground" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.currencyText" />
  </section>

  <!-- PercentText -->
  <section id="percent-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">PercentText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Ratio → percent. The input is the <b>FRACTION</b>
      (<code class="text-foreground/80">0.42 → 42%</code>) because that is
      what Intl's percent style expects; decimals default to zero for the
      clean read.
    </p>
    <DemoCard :code="SNIPPET_PERCENT_TEXT">
      <div class="flex justify-center gap-4 text-[13px]">
      <DitherPercentText :value="0.42" />
      <DitherPercentText :value="0.4235" :decimals="1" class="text-muted-foreground" />
      <DitherPercentText :value="1" class="text-muted-foreground" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.percentText" />
  </section>

  <!-- FileSizeText -->
  <section id="file-size-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">FileSizeText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Bytes → human units, 1024-based the way disk tools actually count.
      Sub-KB sizes stay whole numbers, signs survive.
    </p>
    <DemoCard :code="SNIPPET_FILE_SIZE_TEXT">
      <div class="grid justify-center gap-1 text-[13px]">
      <span><DitherFileSizeText :bytes="512" /> — raw</span>
      <span><DitherFileSizeText :bytes="1536" /> — a small file</span>
      <span class="text-muted-foreground"><DitherFileSizeText :bytes="8589934592" /> — a game update</span>
    </div>
    </DemoCard>
    <PropsTable :rows="API.fileSizeText" />
  </section>

  <!-- DurationText -->
  <section id="duration-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">DurationText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Milliseconds → a smart human duration: precision drops as magnitude
      grows. No zero-padding, no clutter.
    </p>
    <DemoCard :code="SNIPPET_DURATION_TEXT">
      <div class="grid justify-center gap-1 text-[13px]">
      <span><DitherDurationText :ms="500" /> — build sub-second</span>
      <span><DitherDurationText :ms="125000" /> — a queue wait</span>
      <span class="text-muted-foreground"><DitherDurationText :ms="80400000" /> — a download</span>
    </div>
    </DemoCard>
    <PropsTable :rows="API.durationText" />
  </section>

  <!-- RelativeTime -->
  <section id="relative-time" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">RelativeTime</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      <code class="text-foreground/80">&lt;time&gt;</code> in the relative
      register — Intl.RelativeTimeFormat picks the largest sane unit and
      <code class="text-foreground/80">numeric: "auto"</code> turns zero into
      "now". It re-ticks on an interval so a live list stays honest; pass
      <code class="text-foreground/80">now</code> to freeze the clock.
    </p>
    <DemoCard :code="SNIPPET_RELATIVE_TIME">
      <div class="grid justify-center gap-1 text-[13px]">
      <DitherRelativeTime :date="Date.now() - 90_000" />
      <DitherRelativeTime :date="Date.now() + 86_400_000 * 2" class="text-muted-foreground" />
      <DitherRelativeTime :date="new Date('2026-01-05')" :auto="false" class="text-muted-foreground" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.relativeTime" />
  </section>

  <!-- DateTimeText -->
  <section id="date-time-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">DateTimeText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Date → localized text with the medium-date + short-time register by
      default; any Intl.DateTimeFormatOptions shape overrides it (bring
      <code class="text-foreground/80">timeZone</code> in the options for
      deterministic rendering). An unparseable date renders an em dash —
      visible, not silent.
    </p>
    <DemoCard :code="SNIPPET_DATE_TIME_TEXT">
      <div class="grid justify-center gap-1 text-[13px]">
      <DitherDateTimeText date="2026-10-07T15:04:00Z" :options="{ timeZone: 'UTC' }" />
      <DitherDateTimeText date="2026-10-07T15:04:00Z" :options="{ timeZone: 'UTC', dateStyle: 'full' }" class="text-muted-foreground" />
      <DitherDateTimeText date="not a date" class="text-muted-foreground" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.dateTimeText" />
  </section>

  <!-- PluralText -->
  <section id="plural-text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">PluralText</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Intl.PluralRules as a slot switch: the plural category picks the
      slot, the default slot is the fallback, and every slot receives
      <code class="text-foreground/80">count</code>. Richer plural languages
      just get more named slots — no conditionals in the caller.
    </p>
    <DemoCard :code="SNIPPET_PLURAL_TEXT">
      <div class="grid justify-center gap-1 text-[13px]">
      <DitherPluralText :count="1" v-slot="{ count }">
        <span><b>{{ count }}</b> result found</span>
      </DitherPluralText>
      <DitherPluralText :count="7" class="text-muted-foreground" v-slot="{ count }">
        <span><b>{{ count }}</b> results found</span>
      </DitherPluralText>
    </div>
    </DemoCard>
    <PropsTable :rows="API.pluralText" />
  </section>

  <!-- Emoji -->
  <section id="emoji" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Emoji</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An emoji as an <b>image</b> with a real accessible name:
      <code class="text-foreground/80">role="img"</code> +
      <code class="text-foreground/80">aria-label</code> gives screen readers
      one predictable announcement instead of whatever the glyph's unicode
      name happens to be. Pass the character, pass what it means here.
    </p>
    <DemoCard :code="SNIPPET_EMOJI">
      <div class="flex items-center justify-center gap-3 text-lg">
      <DitherEmoji char="🚀" label="launch" />
      <DitherEmoji char="🔥" label="trending" />
      <DitherEmoji char="✨" label="new" />
      <DitherEmoji char="⚠️" label="warning" />
    </div>
    </DemoCard>
    <PropsTable :rows="API.emoji" />
  </section>
</template>
