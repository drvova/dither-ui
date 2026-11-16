import { DitherExternalLink } from "@dither-ui/kit"
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
import HeadingExample from "./examples/heading"
import headingCode from "./examples/heading.tsx?raw"
import CaptionExample from "./examples/caption"
import captionCode from "./examples/caption.tsx?raw"
import KbdComboExample from "./examples/kbd-combo"
import kbdComboCode from "./examples/kbd-combo.tsx?raw"
import ExternalLinkExample from "./examples/external-link"
import externalLinkCode from "./examples/external-link.tsx?raw"
import CopyableTextExample from "./examples/copyable-text"
import copyableTextCode from "./examples/copyable-text.tsx?raw"
import LabelExample from "./examples/label"
import labelCode from "./examples/label.tsx?raw"
import OverlineExample from "./examples/overline"
import overlineCode from "./examples/overline.tsx?raw"
import BlockquoteExample from "./examples/blockquote"
import blockquoteCode from "./examples/blockquote.tsx?raw"
import TruncateExample from "./examples/truncate"
import truncateCode from "./examples/truncate.tsx?raw"
import LineClampExample from "./examples/line-clamp"
import lineClampCode from "./examples/line-clamp.tsx?raw"
import MiddleEllipsisExample from "./examples/middle-ellipsis"
import middleEllipsisCode from "./examples/middle-ellipsis.tsx?raw"
import EllipsisTooltipExample from "./examples/ellipsis-tooltip"
import ellipsisTooltipCode from "./examples/ellipsis-tooltip.tsx?raw"
import LinkExample from "./examples/link"
import linkCode from "./examples/link.tsx?raw"
import SelectableTextExample from "./examples/selectable-text"
import selectableTextCode from "./examples/selectable-text.tsx?raw"
import NumberTextExample from "./examples/number-text"
import numberTextCode from "./examples/number-text.tsx?raw"
import CurrencyTextExample from "./examples/currency-text"
import currencyTextCode from "./examples/currency-text.tsx?raw"
import PercentTextExample from "./examples/percent-text"
import percentTextCode from "./examples/percent-text.tsx?raw"
import FileSizeTextExample from "./examples/file-size-text"
import fileSizeTextCode from "./examples/file-size-text.tsx?raw"
import DurationTextExample from "./examples/duration-text"
import durationTextCode from "./examples/duration-text.tsx?raw"
import RelativeTimeExample from "./examples/relative-time"
import relativeTimeCode from "./examples/relative-time.tsx?raw"
import DateTimeTextExample from "./examples/date-time-text"
import dateTimeTextCode from "./examples/date-time-text.tsx?raw"
import PluralTextExample from "./examples/plural-text"
import pluralTextCode from "./examples/plural-text.tsx?raw"
import CodeExample from "./examples/code"
import codeCode from "./examples/code.tsx?raw"
import HighlightExample from "./examples/highlight"
import highlightCode from "./examples/highlight.tsx?raw"
import EmojiExample from "./examples/emoji"
import emojiCode from "./examples/emoji.tsx?raw"

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
        <DemoCard code={headingCode}>
          <div class="grid gap-2 text-left">
            <HeadingExample />
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
        <DemoCard code={labelCode}>
          <LabelExample />
        </DemoCard>
        <PropsTable rows={API.label} />
      </DocSection>
      {/* Caption */}
      <DocSection id="caption">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Supporting text in the caption register: 11px and muted, at AA contrast in either tone.
        </p>
        <DemoCard code={captionCode}>
          <div class="grid gap-1">
            <span class="text-[13px] text-foreground">release-2.4.0.tar.zst</span>
            <CaptionExample />
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
        <DemoCard code={overlineCode}>
          <OverlineExample />
        </DemoCard>
        <PropsTable rows={API.overline} />
      </DocSection>
      {/* Code */}
      <DocSection id="code">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Inline code: the <code class="text-foreground/80">&lt;code&gt;</code> element in house chrome. For the
          copyable block form, that's CodeBlock in the app layer; this one lives inside prose.
        </p>
        <DemoCard code={codeCode}>
          <CodeExample />
        </DemoCard>
        {/* no props: the element or behavior is the API */}
      </DocSection>
      {/* KbdCombo */}
      <DocSection id="kbd-combo">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A shortcut as one readable unit: keys in Kbd chips with the separator between them. Single keys go through
          DitherKbd directly.
        </p>
        <DemoCard code={kbdComboCode}>
          <div class="flex flex-wrap items-center justify-center gap-4">
            <KbdComboExample />
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
        <DemoCard code={blockquoteCode}>
          <BlockquoteExample />
        </DemoCard>
        {/* no props: the element or behavior is the API */}
      </DocSection>
      {/* Highlight */}
      <DocSection id="highlight">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The <code class="text-foreground/80">&lt;mark&gt;</code> element with a neutral token wash. Colored variants
          belong in <code class="text-foreground/80">class</code> because house color comes from palette seeds.
        </p>
        <DemoCard code={highlightCode}>
          <HighlightExample />
        </DemoCard>
        {/* no props: the element or behavior is the API */}
      </DocSection>
      {/* Truncate */}
      <DocSection id="truncate">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One-line ellipsis around any content. The native <code class="text-foreground/80">title</code> attr rides
          through, so native tooltips stay one attribute away.
        </p>
        <DemoCard code={truncateCode}>
          <TruncateExample />
        </DemoCard>
        <PropsTable rows={API.truncate} />
      </DocSection>
      {/* LineClamp */}
      <DocSection id="line-clamp">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A block clamped after N lines (1–6) with a real ellipsis: excerpts, card bodies, previews that must not grow.
        </p>
        <DemoCard code={lineClampCode}>
          <LineClampExample />
        </DemoCard>
        <PropsTable rows={API.lineClamp} />
      </DocSection>
      {/* MiddleEllipsis */}
      <DocSection id="middle-ellipsis">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Center-ellipsis for identifiers: paths, keys and hashes keep both ends, which is where recognition happens.
          The full string stays in <code class="text-foreground/80">title</code>.
        </p>
        <DemoCard code={middleEllipsisCode}>
          <MiddleEllipsisExample />
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
        <DemoCard code={ellipsisTooltipCode}>
          <EllipsisTooltipExample />
        </DemoCard>
        <PropsTable rows={API.ellipsisTooltip} />
      </DocSection>
      {/* Link */}
      <DocSection id="link">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The anchor, dressed in house chrome: hairline underline that grows its offset and brightens on hover, color
          inherited from wherever it sits.
        </p>
        <DemoCard code={linkCode}>
          <LinkExample />
        </DemoCard>
        <PropsTable rows={API.link} />
      </DocSection>
      {/* ExternalLink */}
      <DocSection id="external-link">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          New-tab semantics done right: <code class="text-foreground/80">_blank</code> with{" "}
          <code class="text-foreground/80">rel=noreferrer</code>, plus the ExternalLink glyph after the label.
        </p>
        <DemoCard code={externalLinkCode}>
          <p class="text-[13px]">
            <ExternalLinkExample /> and{" "}
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
        <DemoCard code={selectableTextCode}>
          <SelectableTextExample />
        </DemoCard>
        <PropsTable rows={API.selectableText} />
      </DocSection>
      {/* CopyableText */}
      <DocSection id="copyable-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One-tap copy around a piece of text. The value goes through the shared Clipboard primitive (live region
          included); the trigger flips from Copy to Check.
        </p>
        <DemoCard code={copyableTextCode}>
          <div class="flex justify-center">
            <CopyableTextExample />
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
        <DemoCard code={numberTextCode}>
          <NumberTextExample />
        </DemoCard>
        <PropsTable rows={API.numberText} />
      </DocSection>
      {/* CurrencyText */}
      <DocSection id="currency-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Money through Intl. Symbol placement and grammar are the runtime's job; ours is picking currency, locale and
          decimals.
        </p>
        <DemoCard code={currencyTextCode}>
          <CurrencyTextExample />
        </DemoCard>
        <PropsTable rows={API.currencyText} />
      </DocSection>
      {/* PercentText */}
      <DocSection id="percent-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Ratio to percent. The input is the <b>fraction</b> (<code class="text-foreground/80">0.42</code> becomes 42%)
          because that is what Intl's percent style expects; decimals default to zero for the clean read.
        </p>
        <DemoCard code={percentTextCode}>
          <PercentTextExample />
        </DemoCard>
        <PropsTable rows={API.percentText} />
      </DocSection>
      {/* FileSizeText */}
      <DocSection id="file-size-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Bytes to human units, 1024-based the way disk tools actually count. Sub-KB sizes stay whole numbers, signs
          survive.
        </p>
        <DemoCard code={fileSizeTextCode}>
          <FileSizeTextExample />
        </DemoCard>
        <PropsTable rows={API.fileSizeText} />
      </DocSection>
      {/* DurationText */}
      <DocSection id="duration-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Milliseconds to a smart human duration: precision drops as magnitude grows. No zero-padding, no clutter.
        </p>
        <DemoCard code={durationTextCode}>
          <DurationTextExample />
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
        <DemoCard code={relativeTimeCode}>
          <RelativeTimeExample />
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
        <DemoCard code={dateTimeTextCode}>
          <DateTimeTextExample />
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
        <DemoCard code={pluralTextCode}>
          <PluralTextExample />
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
        <DemoCard code={emojiCode}>
          <EmojiExample />
        </DemoCard>
        <PropsTable rows={API.emoji} />
      </DocSection>
    </>
  )
}
