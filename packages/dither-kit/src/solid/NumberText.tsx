import { createMemo, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type NumberTextProps = {
  /** @default required */
  value: number
  /** @docs number (min = max)
   * @default natural */
  decimals?: number
  locale?: string
  grouping?: boolean
  class?: string
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

  return <span class={cn("tabular-nums", props.class)}>{text()}</span>
}
