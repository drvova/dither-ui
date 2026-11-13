// Generated from ../solid/MiddleEllipsis.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block", maxWidth: "100%", verticalAlign: "bottom" },
})

/** Center-ellipsis for identifiers: paths, keys, hashes — keeps both ends
 * where recognition happens. `head`/`tail` are character counts; the full
 * string lands in `title`. Pure text, so it never fights `truncate`. */
export type MiddleEllipsisProps = {
  text?: string
  head?: number
  tail?: number
  title?: boolean
  class?: string
  xstyle?: StyleProp
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
    <span title={titleAttr()} class={cn(styles.text, props.xstyle, props.class)}>
      {shown()}
    </span>
  )
}
