// Generated from @dither-ui/kit/solid/DateTimeText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})

export type DateTimeTextProps = {
  date?: Date | string | number
  locale?: string
  options?: Intl.DateTimeFormatOptions
  class?: string
  xstyle?: StyleProp
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }

/** Date → localized text. Default is the medium date + short time register;
 * any Intl.DateTimeFormatOptions shape overrides it (pass `timeZone` inside
 * options for deterministic cross-machine rendering). An unparseable date
 * renders an em dash — visible, not silent. */
export default function DateTimeText(raw: DateTimeTextProps) {
  const props = mergeProps({ date: "" as Date | string | number, locale: "en-US" }, raw)
  const text = createMemo(() => {
    const d = new Date(props.date)
    if (Number.isNaN(d.getTime())) return "—"
    return d.toLocaleString(props.locale, props.options ?? DEFAULT_OPTIONS)
  })
  return <span class={cn(styles.text, props.xstyle, props.class)}>{text()}</span>
}
