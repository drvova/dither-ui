// Generated from @dither-ui/kit/solid/CurrencyText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})

export type CurrencyTextProps = {
  /** @default required */
  value: number
  /** @docs string (ISO 4217) */
  currency?: string
  locale?: string
  decimals?: number
  class?: string
  xstyle?: StyleProp
}

/** Money through Intl — currency decides symbol placement, locale decides
 * the grammar (both are the runtime's job, not ours). */
export default function CurrencyText(raw: CurrencyTextProps) {
  const props = mergeProps({ currency: "USD", locale: "en-US", decimals: 2 }, raw)
  const text = createMemo(() =>
    new Intl.NumberFormat(props.locale, {
      style: "currency",
      currency: props.currency,
      minimumFractionDigits: props.decimals,
      maximumFractionDigits: props.decimals,
    }).format(props.value),
  )
  return <span class={cn(styles.text, props.xstyle, props.class)}>{text()}</span>
}
