// Generated from ../solid/NumberText.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})

export type NumberTextProps = {
  value: number
  decimals?: number
  locale?: string
  grouping?: boolean
  class?: string
  xstyle?: StyleProp
}

/** Locale-aware number rendering — grouping, decimals, locale through Intl,
 * defaults to the house register. */
export default function NumberText(raw: NumberTextProps) {
  const props = mergeProps({ locale: "en-US", grouping: true }, raw)

  const text = createMemo(() =>
    new Intl.NumberFormat(props.locale, {
      minimumFractionDigits: props.decimals,
      maximumFractionDigits: props.decimals,
      useGrouping: props.grouping,
    }).format(props.value),
  )

  return <span class={cn(styles.text, props.xstyle, props.class)}>{text()}</span>
}
