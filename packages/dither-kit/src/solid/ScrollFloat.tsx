import { createMemo, Index, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./ScrollFloat.css"

export type ScrollFloatProps = {
  /** @default required */
  text?: string
  amount?: number
  class?: string
}

/** Letters that float up into place as the line rises through the page,
 * each a little after the one before: a view timeline in CSS
 * (`ScrollFloat.css`), every letter in place where the browser has none and
 * under reduced motion. */
export default function ScrollFloat(raw: ScrollFloatProps) {
  const props = mergeProps({ text: "Scroll float", amount: 1 }, raw)

  const chars = createMemo(() => [...props.text])

  return (
    <span
      class={cn("dk-scroll-float inline-block", props.class)}
      style={{ "--dk-n": String(chars().length), "--dk-float": `${0.7 * props.amount}em` }}
      aria-label={props.text}
    >
      <Index each={chars()}>
        {(ch, i) => (
          <span aria-hidden="true" class="dither-float-char" style={{ "--dk-i": String(i) }}>
            {ch()}
          </span>
        )}
      </Index>
    </span>
  )
}
