// Generated from @dither-ui/kit/solid/RotatingText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, Index, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/RotatingText.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
})

export type RotatingTextProps = {
  /** @default ['Solid', 'canvas', 'dither'] */
  texts?: string[]
  /** @docs number (ms) */
  interval?: number
  /** @default undefined */
  class?: string
  xstyle?: StyleProp
}

/** The rise from one word to the next, ms (at most half a slot). */
const RISE = 300

/** The next word every `interval`, rising in as the last rises out: the turn
 * is a CSS animation (`RotatingText.css`) the kit clock holds when it is
 * directed. Every word stands in the page, so the box is the widest. */
export default function RotatingText(raw: RotatingTextProps) {
  const props = mergeProps({ texts: ["Solid", "canvas", "dither"], interval: 2000 }, raw)

  const list = createMemo(() => (props.texts.length ? props.texts : [""]))
  const interval = () => Math.max(300, props.interval)

  return (
    <span
      class={cn("dither-rotating", props.xstyle, props.class)}
      style={{
        "--dk-n": String(list().length),
        "--dk-interval": `${interval()}ms`,
        "--dk-fade": String(Math.min(0.5, RISE / interval())),
      }}
      data-turn={list().length > 1 ? "" : undefined}
    >
      <Index each={list()}>
        {(word, i) => (
          <span
            class={cn(styles.text, "dither-rot-word")}
            style={{ "--dk-i": String(i) }}
            aria-hidden={i > 0 || undefined}
          >
            {word()}
          </span>
        )}
      </Index>
    </span>
  )
}
