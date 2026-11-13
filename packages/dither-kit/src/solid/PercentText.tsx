import { createMemo, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type PercentTextProps = { value: number; decimals?: number; locale?: string; class?: string }

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

  return <span class={cn("tabular-nums", props.class)}>{text()}</span>
}
