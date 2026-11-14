import { createMemo, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type DateTimeTextProps = {
  date?: Date | string | number
  locale?: string
  /** @default medium date + short time */
  options?: Intl.DateTimeFormatOptions
  class?: string
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
  return <span class={cn("tabular-nums", props.class)}>{text()}</span>
}
