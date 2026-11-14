// Generated from @dither-ui/kit/solid/PercentText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})

export type PercentTextProps = { value: number; decimals?: number; locale?: string; class?: string; xstyle?: StyleProp }

/** Ratio → percent. Input is the FRACTION (0.42 → 42%) because that is what
 * Intl's percent style expects; decimals default to zero for the clean read. */
export default function PercentText(raw: PercentTextProps) {
  const props = mergeProps({ decimals: 0, locale: "en-US" }, raw)

  const text = createMemo(() =>
    new Intl.NumberFormat(props.locale, {
      style: "percent",
      minimumFractionDigits: props.decimals,
      maximumFractionDigits: props.decimals,
    }).format(props.value),
  )

  return <span class={cn(styles.text, props.xstyle, props.class)}>{text()}</span>
}
