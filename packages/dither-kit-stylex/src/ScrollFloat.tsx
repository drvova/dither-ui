// Generated from @dither-ui/kit/solid/ScrollFloat.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, Index, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/ScrollFloat.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
})

export type ScrollFloatProps = {
  /** @default required */
  text?: string
  amount?: number
  class?: string
  xstyle?: StyleProp
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
      class={cn([styles.text, "dk-scroll-float"], props.xstyle, props.class)}
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
