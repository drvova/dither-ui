// Generated from @dither-ui/kit/solid/TrueFocus.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/TrueFocus.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
  row: { display: "inline-flex", flexWrap: "wrap", columnGap: "0.35em", rowGap: "0.25rem" },
})

export type TrueFocusProps = {
  text?: string
  /** @docs number (ms) */
  interval?: number
  /** @docs number (px) */
  blur?: number
  class?: string
  xstyle?: StyleProp
}

/** The crossfade from one word to the next, ms (at most half a slot). */
const FADE = 500

/** One word in focus at a time, the next every `interval`: the turn is a
 * CSS animation (`TrueFocus.css`) the kit clock holds when it is directed. */
export default function TrueFocus(raw: TrueFocusProps) {
  const props = mergeProps({ text: "True focus mode", interval: 1400, blur: 5 }, raw)

  const words = createMemo(() => props.text.split(/\s+/).filter(Boolean))
  const interval = () => Math.max(300, props.interval)

  return (
    <span
      class={cn([styles.row, "dk-true-focus"], props.xstyle, props.class)}
      style={{
        "--dk-n": String(Math.max(1, words().length)),
        "--dk-interval": `${interval()}ms`,
        "--dk-fade": String(Math.min(0.5, FADE / interval())),
        "--dk-blur": `${props.blur}px`,
      }}
      data-turn={words().length > 1 ? "" : undefined}
      aria-label={props.text}
    >
      <For each={words()}>
        {(w, i) => (
          <span aria-hidden="true" class={cn(styles.text, "dk-true-focus-word")} style={{ "--dk-i": String(i()) }}>
            {w}
          </span>
        )}
      </For>
    </span>
  )
}
