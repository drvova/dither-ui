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
} from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import headingProps from "virtual:dither-props/DitherHeading"
import labelProps from "virtual:dither-props/DitherLabel"
import captionProps from "virtual:dither-props/DitherCaption"
import overlineProps from "virtual:dither-props/DitherOverline"
import kbdComboProps from "virtual:dither-props/DitherKbdCombo"
import truncateProps from "virtual:dither-props/DitherTruncate"
import lineClampProps from "virtual:dither-props/DitherLineClamp"
import middleEllipsisProps from "virtual:dither-props/DitherMiddleEllipsis"
import ellipsisTooltipProps from "virtual:dither-props/DitherEllipsisTooltip"
import linkProps from "virtual:dither-props/DitherLink"
import externalLinkProps from "virtual:dither-props/DitherExternalLink"
import selectableTextProps from "virtual:dither-props/DitherSelectableText"
import copyableTextProps from "virtual:dither-props/DitherCopyableText"
import numberTextProps from "virtual:dither-props/DitherNumberText"
import currencyTextProps from "virtual:dither-props/DitherCurrencyText"
import percentTextProps from "virtual:dither-props/DitherPercentText"
import fileSizeTextProps from "virtual:dither-props/DitherFileSizeText"
import durationTextProps from "virtual:dither-props/DitherDurationText"
import relativeTimeProps from "virtual:dither-props/DitherRelativeTime"
import dateTimeTextProps from "virtual:dither-props/DitherDateTimeText"
import pluralTextProps from "virtual:dither-props/DitherPluralText"
import emojiProps from "virtual:dither-props/DitherEmoji"
import DocSection from "../DocSection"

const SNIPPET_HEADING = `<DitherHeading level="2">Section title</DitherHeading>
<DitherHeading level="3">Part title</DitherHeading>
<DitherHeading level="4" class="text-muted-foreground">Quiet subhead</DitherHeading>`

const SNIPPET_LABEL = `<DitherLabel for="email" required>Email</DitherLabel>
<DitherInput id="email" placeholder="you@example.com" />`

const SNIPPET_CAPTION = `<DitherCaption>Uploaded 3 minutes ago</DitherCaption>
<DitherCaption tone="faint">auto-saved</DitherCaption>`

const SNIPPET_OVERLINE = `<DitherOverline>Chapter 02</DitherOverline>
<DitherHeading level="2">The renderer</DitherHeading>`

const SNIPPET_CODE = `Run <DitherCode>npm run build</DitherCode> before shipping:
the <DitherCode>dist/</DitherCode> folder is the artifact.`

const SNIPPET_KBD_COMBO = `<DitherKbdCombo keys={['⌘', 'K']} />
<DitherKbdCombo keys={['Ctrl', 'Shift', 'P']} separator="›" />`

const SNIPPET_BLOCKQUOTE = `<DitherBlockquote>
  Dithering trades smooth gradients for a fixed threshold,
  and the threshold is the style.
</DitherBlockquote>`

const SNIPPET_HIGHLIGHT = `Matches are <DitherHighlight>highlighted inline</DitherHighlight>
without breaking the reading flow.`

const SNIPPET_TRUNCATE = `<div class="w-56">
  <DitherTruncate title="quarterly-report-final-v3-actually-final.xlsx">
    quarterly-report-final-v3-actually-final.xlsx
  </DitherTruncate>
</div>`

const SNIPPET_LINE_CLAMP = `<DitherLineClamp lines={2}>
  Long body copy that stops after two lines with an ellipsis…
</DitherLineClamp>`

const SNIPPET_MIDDLE_ELLIPSIS = `<DitherMiddleEllipsis text="packages/site/src/pages/docs/typography/TypographyDocs.tsx" />`

const SNIPPET_ELLIPSIS_TOOLTIP = `<DitherEllipsisTooltip>Full sentence that only shows a tooltip when it actually clips…</DitherEllipsisTooltip>`

const SNIPPET_LINK = `<DitherLink href="/docs">Docs home</DitherLink>`

const SNIPPET_EXTERNAL_LINK = `<DitherExternalLink href="https://docs.solidjs.com">Solid docs</DitherExternalLink>`

const SNIPPET_SELECTABLE_TEXT = `<DitherSelectableText>sk_live_51Nq…f9X</DitherSelectableText>`

const SNIPPET_COPYABLE_TEXT = `<DitherCopyableText value="npm i d3-scale d3-shape clsx tailwind-merge">
  copy install
</DitherCopyableText>`

const SNIPPET_NUMBER_TEXT = `<DitherNumberText value={1234567.5} decimals={2} />
<DitherNumberText value={1234567.5} locale="de-DE" />`

const SNIPPET_CURRENCY_TEXT = `<DitherCurrencyText value={1299.5} currency="USD" />
<DitherCurrencyText value={1299.5} currency="EUR" locale="de-DE" />`

const SNIPPET_PERCENT_TEXT = `<DitherPercentText value={0.42} />
<DitherPercentText value={0.4235} decimals={1} />`

const SNIPPET_FILE_SIZE_TEXT = `<DitherFileSizeText bytes={1536} />
<DitherFileSizeText bytes={8589934592} />`

const SNIPPET_DURATION_TEXT = `<DitherDurationText ms={45000} />
<DitherDurationText ms={80400000} />`

const SNIPPET_RELATIVE_TIME = `<DitherRelativeTime date={Date.now() - 90_000} />
<DitherRelativeTime date={new Date('2026-01-05')} auto={false} />`

const SNIPPET_DATE_TIME_TEXT = `<DitherDateTimeText date="2026-10-07T15:04:00Z"
  options={{ timeZone: 'UTC', dateStyle: 'long' }} />`

const SNIPPET_PLURAL_TEXT = `const [selected, setSelected] = createSignal(7)

<DitherPluralText count={selected()}>
  {(scope) => (
    <><b>{scope.count}</b> file{scope.count === 1 ? "" : "s"} selected</>
  )}
</DitherPluralText>`

const SNIPPET_EMOJI = `<DitherEmoji char="🚀" label="launch" />
<DitherEmoji char="🔥" label="trending" class="text-lg" />`

export const API: Record<string, PropRow[]> = {
  heading: kitTable(headingProps),
  label: kitTable(labelProps),
  caption: kitTable(captionProps),
  overline: kitTable(overlineProps),
  kbdCombo: kitTable(kbdComboProps),
  truncate: kitTable(truncateProps),
  lineClamp: kitTable(lineClampProps),
  middleEllipsis: kitTable(middleEllipsisProps),
  ellipsisTooltip: kitTable(ellipsisTooltipProps),
  link: kitTable(linkProps),
  externalLink: kitTable(externalLinkProps),
  selectableText: kitTable(selectableTextProps),
  copyableText: kitTable(copyableTextProps),
  numberText: kitTable(numberTextProps),
  currencyText: kitTable(currencyTextProps),
  percentText: kitTable(percentTextProps),
  fileSizeText: kitTable(fileSizeTextProps),
  durationText: kitTable(durationTextProps),
  relativeTime: kitTable(relativeTimeProps),
  dateTimeText: kitTable(dateTimeTextProps),
  pluralText: kitTable(pluralTextProps, { join: [["zero", "one", "two", "few", "many", "other", "children"]] }),
  emoji: kitTable(emojiProps),
}

export default function TypographyDocs() {
  return (
    <>
      {/* Heading */}
      <DocSection id="heading">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Semantic h1–h6 on the site's scale: level picks the size and weight,{" "}
          <code class="text-foreground/80">size</code> draws it at another step when the outline and the look part (a
          card's title under a section: level 3, size 4), <code class="text-foreground/80">class</code> overrides
          anything below.
        </p>
        <DemoCard code={SNIPPET_HEADING}>
          <div class="grid gap-2 text-left">
            <DitherHeading level="2">Section title</DitherHeading>
            <DitherHeading level="3">Part title</DitherHeading>
            <DitherHeading class="text-muted-foreground" level="4">
              Quiet subhead
            </DitherHeading>
          </div>
        </DemoCard>
        <PropsTable rows={API.heading} />
      </DocSection>
      {/* Label */}
      <DocSection id="label">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A real <code class="text-foreground/80">&lt;label&gt;</code> that pairs with controls through{" "}
          <code class="text-foreground/80">for</code> (or by nesting), which is the whole point over a styled span. A
          required marker adds an asterisk that screen readers skip.
        </p>
        <DemoCard code={SNIPPET_LABEL}>
          <div class="grid w-full max-w-xs gap-1.5 text-left">
            <DitherLabel required>Email</DitherLabel>
            <div class="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 text-[12px] text-muted-foreground">
              you@example.com
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.label} />
      </DocSection>
      {/* Caption */}
      <DocSection id="caption">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Supporting text in the caption register: 11px and muted, at AA contrast in either tone.
        </p>
        <DemoCard code={SNIPPET_CAPTION}>
          <div class="grid gap-1">
            <span class="text-[13px] text-foreground">release-2.4.0.tar.zst</span>
            <DitherCaption>Uploaded 3 minutes ago</DitherCaption>
            <DitherCaption tone="faint">auto-saved</DitherCaption>
          </div>
        </DemoCard>
        <PropsTable rows={API.caption} />
      </DocSection>
      {/* Overline */}
      <DocSection id="overline">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The tiny uppercase eyebrow above a section: 10px, open tracking, muted. Editorial structure without a
          heading's weight.
        </p>
        <DemoCard code={SNIPPET_OVERLINE}>
          <div class="text-left">
            <DitherOverline>Chapter 02</DitherOverline>
            <DitherHeading class="mt-1" level="2">
              The renderer
            </DitherHeading>
          </div>
        </DemoCard>
        <PropsTable rows={API.overline} />
      </DocSection>
      {/* Code */}
      <DocSection id="code">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Inline code: the <code class="text-foreground/80">&lt;code&gt;</code> element in house chrome. For the
          copyable block form, that's CodeBlock in the app layer; this one lives inside prose.
        </p>
        <DemoCard code={SNIPPET_CODE}>
          <p class="text-[13px] leading-relaxed text-muted-foreground">
            Run <DitherCode>npm run build</DitherCode> before shipping: the <DitherCode>dist/</DitherCode> folder is the
            artifact.
          </p>
        </DemoCard>
        {/* no props: the element or behavior is the API */}
      </DocSection>
      {/* KbdCombo */}
      <DocSection id="kbd-combo">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A shortcut as one readable unit: keys in Kbd chips with the separator between them. Single keys go through
          DitherKbd directly.
        </p>
        <DemoCard code={SNIPPET_KBD_COMBO}>
          <div class="flex flex-wrap items-center justify-center gap-4">
            <DitherKbdCombo keys={["⌘", "K"]} />
            <DitherKbdCombo keys={["Ctrl", "Shift", "P"]} separator="›" />
          </div>
        </DemoCard>
        <PropsTable rows={API.kbdCombo} />
      </DocSection>
      {/* Blockquote */}
      <DocSection id="blockquote">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Real <code class="text-foreground/80">&lt;blockquote&gt;</code> semantics with the editorial treatment:
          hairline left rule, muted register. Citations ride in the children.
        </p>
        <DemoCard code={SNIPPET_BLOCKQUOTE}>
          <DitherBlockquote class="mx-auto max-w-md">
            Dithering trades smooth gradients for a fixed threshold, and the threshold is the style.{" "}
            <span class="mt-2 block text-[11px] text-muted-foreground">From palette.ts</span>
          </DitherBlockquote>
        </DemoCard>
        {/* no props: the element or behavior is the API */}
      </DocSection>
      {/* Highlight */}
      <DocSection id="highlight">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The <code class="text-foreground/80">&lt;mark&gt;</code> element with a neutral token wash. Colored variants
          belong in <code class="text-foreground/80">class</code> because house color comes from palette seeds.
        </p>
        <DemoCard code={SNIPPET_HIGHLIGHT}>
          <p class="text-[13px] leading-relaxed text-muted-foreground">
            Matches are <DitherHighlight>highlighted inline</DitherHighlight> without breaking the reading flow.
          </p>
        </DemoCard>
        {/* no props: the element or behavior is the API */}
      </DocSection>
      {/* Truncate */}
      <DocSection id="truncate">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One-line ellipsis around any content. The native <code class="text-foreground/80">title</code> attr rides
          through, so native tooltips stay one attribute away.
        </p>
        <DemoCard code={SNIPPET_TRUNCATE}>
          <div class="mx-auto w-56">
            <DitherTruncate title="quarterly-report-final-v3-actually-final.xlsx">
              quarterly-report-final-v3-actually-final.xlsx
            </DitherTruncate>
          </div>
        </DemoCard>
        <PropsTable rows={API.truncate} />
      </DocSection>
      {/* LineClamp */}
      <DocSection id="line-clamp">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A block clamped after N lines (1–6) with a real ellipsis: excerpts, card bodies, previews that must not grow.
        </p>
        <DemoCard code={SNIPPET_LINE_CLAMP}>
          <div class="mx-auto w-full max-w-sm">
            <DitherLineClamp class="text-[13px] leading-relaxed text-muted-foreground" lines={2}>
              The kit is a folder, not a package: copy it, alias it, and every component keeps the same seed contract
              all the way down to the Bayer matrix that thresholds the fill. This sentence exists only to overflow the
              two-line clamp so the ellipsis earns its place in the demo.
            </DitherLineClamp>
          </div>
        </DemoCard>
        <PropsTable rows={API.lineClamp} />
      </DocSection>
      {/* MiddleEllipsis */}
      <DocSection id="middle-ellipsis">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Center-ellipsis for identifiers: paths, keys and hashes keep both ends, which is where recognition happens.
          The full string stays in <code class="text-foreground/80">title</code>.
        </p>
        <DemoCard code={SNIPPET_MIDDLE_ELLIPSIS}>
          <div class="grid gap-2 text-[12px]">
            <DitherMiddleEllipsis
              class="font-mono"
              text="packages/site/src/pages/docs/typography/TypographyDocs.tsx"
              head={14}
              tail={10}
            />
            <DitherMiddleEllipsis
              class="font-mono"
              text="sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
              head={10}
              tail={8}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.middleEllipsis} />
      </DocSection>
      {/* EllipsisTooltip */}
      <DocSection id="ellipsis-tooltip">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Truncation with a tooltip that only earns itself: observes its own overflow (ResizeObserver, zero forced
          reads) and publishes <code class="text-foreground/80">title</code> only while clipped. Unclipped content gets
          no tooltip, which is the point.
        </p>
        <DemoCard code={SNIPPET_ELLIPSIS_TOOLTIP}>
          <div class="mx-auto w-56">
            <DitherEllipsisTooltip class="text-[12px] text-muted-foreground">
              Full sentence that only shows a tooltip when it actually clips in this narrow box.
            </DitherEllipsisTooltip>
          </div>
        </DemoCard>
        <PropsTable rows={API.ellipsisTooltip} />
      </DocSection>
      {/* Link */}
      <DocSection id="link">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The anchor, dressed in house chrome: hairline underline that grows its offset and brightens on hover, color
          inherited from wherever it sits.
        </p>
        <DemoCard code={SNIPPET_LINK}>
          <p class="text-[13px]">
            Read the <DitherLink href="#link">Link</DitherLink> section, then keep going. The underline widens on hover
            and settles back.
          </p>
        </DemoCard>
        <PropsTable rows={API.link} />
      </DocSection>
      {/* ExternalLink */}
      <DocSection id="external-link">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          New-tab semantics done right: <code class="text-foreground/80">_blank</code> with{" "}
          <code class="text-foreground/80">rel=noreferrer</code>, plus the ExternalLink glyph after the label.
        </p>
        <DemoCard code={SNIPPET_EXTERNAL_LINK}>
          <p class="text-[13px]">
            <DitherExternalLink href="https://docs.solidjs.com">Solid docs</DitherExternalLink> and{" "}
            <DitherExternalLink href="https://tailwindcss.com">Tailwind docs</DitherExternalLink> ship the runtime this
            kit leans on.
          </p>
        </DemoCard>
        <PropsTable rows={API.externalLink} />
      </DocSection>
      {/* SelectableText */}
      <DocSection id="selectable-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Text that selects itself on click (<code class="text-foreground/80">user-select: all</code>) for license keys,
          tokens and one-tap copy targets. Wraps any inline content.
        </p>
        <DemoCard code={SNIPPET_SELECTABLE_TEXT}>
          <div class="grid gap-2 text-center text-[13px]">
            <span class="text-muted-foreground">Click the key and it all selects:</span>
            <DitherSelectableText class="font-mono">sk_live_51NqH2vKf9X</DitherSelectableText>
          </div>
        </DemoCard>
        <PropsTable rows={API.selectableText} />
      </DocSection>
      {/* CopyableText */}
      <DocSection id="copyable-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One-tap copy around a piece of text. The value goes through the shared Clipboard primitive (live region
          included); the trigger flips from Copy to Check.
        </p>
        <DemoCard code={SNIPPET_COPYABLE_TEXT}>
          <div class="flex justify-center">
            <DitherCopyableText value="npm i d3-scale d3-shape clsx tailwind-merge">copy install</DitherCopyableText>
          </div>
        </DemoCard>
        <PropsTable rows={API.copyableText} />
      </DocSection>
      {/* NumberText */}
      <DocSection id="number-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Locale-aware numbers: grouping, decimals and locale through Intl, and{" "}
          <code class="text-foreground/80">tabular-nums</code> so columns line up.
        </p>
        <DemoCard code={SNIPPET_NUMBER_TEXT}>
          <div class="grid justify-center gap-1 text-[13px]">
            <DitherNumberText value={1234567.5} decimals={2} />
            <DitherNumberText class="text-muted-foreground" value={1234567.5} locale="de-DE" />
            <DitherNumberText class="text-muted-foreground" value={98.76} locale="ja-JP" grouping={false} />
          </div>
        </DemoCard>
        <PropsTable rows={API.numberText} />
      </DocSection>
      {/* CurrencyText */}
      <DocSection id="currency-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Money through Intl. Symbol placement and grammar are the runtime's job; ours is picking currency, locale and
          decimals.
        </p>
        <DemoCard code={SNIPPET_CURRENCY_TEXT}>
          <div class="grid justify-center gap-1 text-[13px]">
            <DitherCurrencyText value={1299.5} />
            <DitherCurrencyText class="text-muted-foreground" value={1299.5} currency="EUR" locale="de-DE" />
            <DitherCurrencyText class="text-muted-foreground" value={49} currency="JPY" decimals={0} />
          </div>
        </DemoCard>
        <PropsTable rows={API.currencyText} />
      </DocSection>
      {/* PercentText */}
      <DocSection id="percent-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Ratio to percent. The input is the <b>fraction</b> (<code class="text-foreground/80">0.42</code> becomes 42%)
          because that is what Intl's percent style expects; decimals default to zero for the clean read.
        </p>
        <DemoCard code={SNIPPET_PERCENT_TEXT}>
          <div class="flex justify-center gap-4 text-[13px]">
            <DitherPercentText value={0.42} />
            <DitherPercentText class="text-muted-foreground" value={0.4235} decimals={1} />
            <DitherPercentText class="text-muted-foreground" value={1} />
          </div>
        </DemoCard>
        <PropsTable rows={API.percentText} />
      </DocSection>
      {/* FileSizeText */}
      <DocSection id="file-size-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Bytes to human units, 1024-based the way disk tools actually count. Sub-KB sizes stay whole numbers, signs
          survive.
        </p>
        <DemoCard code={SNIPPET_FILE_SIZE_TEXT}>
          <div class="grid justify-center gap-1 text-[13px]">
            <span>
              <DitherFileSizeText bytes={512} /> (raw)
            </span>
            <span>
              <DitherFileSizeText bytes={1536} /> (a small file)
            </span>
            <span class="text-muted-foreground">
              <DitherFileSizeText bytes={8589934592} /> (a game update)
            </span>
          </div>
        </DemoCard>
        <PropsTable rows={API.fileSizeText} />
      </DocSection>
      {/* DurationText */}
      <DocSection id="duration-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Milliseconds to a smart human duration: precision drops as magnitude grows. No zero-padding, no clutter.
        </p>
        <DemoCard code={SNIPPET_DURATION_TEXT}>
          <div class="grid justify-center gap-1 text-[13px]">
            <span>
              <DitherDurationText ms={500} /> (build sub-second)
            </span>
            <span>
              <DitherDurationText ms={125000} /> (a queue wait)
            </span>
            <span class="text-muted-foreground">
              <DitherDurationText ms={80400000} /> (a download)
            </span>
          </div>
        </DemoCard>
        <PropsTable rows={API.durationText} />
      </DocSection>
      {/* RelativeTime */}
      <DocSection id="relative-time">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          <code class="text-foreground/80">&lt;time&gt;</code> in the relative register: Intl.RelativeTimeFormat picks
          the largest sane unit and <code class="text-foreground/80">numeric: "auto"</code> turns zero into "now". It
          re-ticks on an interval so a live list stays honest; pass <code class="text-foreground/80">now</code> to
          freeze the clock.
        </p>
        <DemoCard code={SNIPPET_RELATIVE_TIME}>
          <div class="grid justify-center gap-1 text-[13px]">
            <DitherRelativeTime date={Date.now() - 90_000} />
            <DitherRelativeTime class="text-muted-foreground" date={Date.now() + 86_400_000 * 2} />
            <DitherRelativeTime class="text-muted-foreground" date={new Date("2026-01-05")} auto={false} />
          </div>
        </DemoCard>
        <PropsTable rows={API.relativeTime} />
      </DocSection>
      {/* DateTimeText */}
      <DocSection id="date-time-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Date to localized text with the medium-date + short-time register by default; any Intl.DateTimeFormatOptions
          shape overrides it (bring <code class="text-foreground/80">timeZone</code> in the options for deterministic
          rendering). An unparseable date renders an em dash: visible, not silent.
        </p>
        <DemoCard code={SNIPPET_DATE_TIME_TEXT}>
          <div class="grid justify-center gap-1 text-[13px]">
            <DitherDateTimeText date="2026-10-07T15:04:00Z" options={{ timeZone: "UTC" }} />
            <DitherDateTimeText
              class="text-muted-foreground"
              date="2026-10-07T15:04:00Z"
              options={{ timeZone: "UTC", dateStyle: "full" }}
            />
            <DitherDateTimeText class="text-muted-foreground" date="not a date" />
          </div>
        </DemoCard>
        <PropsTable rows={API.dateTimeText} />
      </DocSection>
      {/* PluralText */}
      <DocSection id="plural-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Intl.PluralRules as a prop switch: the plural category picks the prop, children is the fallback, and every one
          receives <code class="text-foreground/80">count</code>. Richer plural languages just get more named props. No
          conditionals in the caller.
        </p>
        <DemoCard code={SNIPPET_PLURAL_TEXT}>
          <div class="grid justify-center gap-1 text-[13px]">
            <DitherPluralText count={1}>
              {({ count }) => (
                <span>
                  <b>{count}</b> result found
                </span>
              )}
            </DitherPluralText>
            <DitherPluralText class="text-muted-foreground" count={7}>
              {({ count }) => (
                <span>
                  <b>{count}</b> results found
                </span>
              )}
            </DitherPluralText>
          </div>
        </DemoCard>
        <PropsTable rows={API.pluralText} />
      </DocSection>
      {/* Emoji */}
      <DocSection id="emoji">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An emoji as an <b>image</b> with a real accessible name: <code class="text-foreground/80">role="img"</code> +{" "}
          <code class="text-foreground/80">aria-label</code> gives screen readers one predictable announcement instead
          of whatever the glyph's unicode name happens to be. Pass the character, pass what it means here.
        </p>
        <DemoCard code={SNIPPET_EMOJI}>
          <div class="flex items-center justify-center gap-3 text-lg">
            <DitherEmoji char="🚀" label="launch" />
            <DitherEmoji char="🔥" label="trending" />
            <DitherEmoji char="✨" label="new" />
            <DitherEmoji char="⚠️" label="warning" />
          </div>
        </DemoCard>
        <PropsTable rows={API.emoji} />
      </DocSection>
    </>
  )
}
