import { createMemo, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

/** Center-ellipsis for identifiers: paths, keys, hashes — keeps both ends
 * where recognition happens. `head`/`tail` are character counts; the full
 * string lands in `title`. Pure text, so it never fights `truncate`. */
export type MiddleEllipsisProps = {
  /** @default "…" */
  text?: string
  /** @docs number (chars) */
  head?: number
  /** @docs number (chars) */
  tail?: number
  title?: boolean
  class?: string
}

export default function MiddleEllipsis(raw: MiddleEllipsisProps) {
  const props = mergeProps({ text: "", head: 8, tail: 6, title: true }, raw)

  const shown = createMemo(() => {
    const t = props.text
    if (t.length <= props.head + props.tail + 1) return t
    return `${t.slice(0, props.head)}…${t.slice(-props.tail)}`
  })
  const titleAttr = createMemo(() => (props.title ? props.text : undefined))

  return (
    <span title={titleAttr()} class={cn("inline-block max-w-full align-bottom", props.class)}>
      {shown()}
    </span>
  )
}
