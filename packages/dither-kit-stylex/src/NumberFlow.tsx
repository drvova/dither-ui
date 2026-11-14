// Generated from @dither-ui/kit/solid/NumberFlow.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, Index, mergeProps, Show } from "solid-js"
import { formatFixed } from "@dither-ui/kit/engine/format-number.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  text2: { lineHeight: "1" },
  text3: { display: "inline-block", height: "1em", overflow: "hidden" },
  grid: {
    display: "grid",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text4: { height: "1em", lineHeight: "1" },
  row: { display: "inline-flex", fontVariantNumeric: "   tabular-nums " },
})

/** Odometer for live values — each digit rides a 0-9 column that rolls to the
 * new figure whenever `value` changes. Separators stay put. Reduced motion
 * snaps columns without the roll. */
export type NumberFlowProps = {
  value: number
  decimals?: number
  /** Roll time per change, ms. */
  duration?: number
  class?: string
  xstyle?: StyleProp
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

export default function NumberFlow(raw: NumberFlowProps) {
  const props = mergeProps({ decimals: 0, duration: 600 }, raw)

  const chars = createMemo(() => formatFixed(props.value, props.decimals).split(""))

  // Columns are kept by place, and all made anew when the figure changes
  // length.
  return (
    <span class={cn(styles.row, props.xstyle, props.class)} aria-live="polite">
      <span {...stylex.props(styles.text)}>{chars().join("")}</span>
      <For each={[chars().length]}>
        {() => (
          <Index each={chars()}>
            {(c) => (
              <Show
                when={/\d/.test(c())}
                fallback={
                  <span aria-hidden="true" {...stylex.props(styles.text2)}>
                    {c()}
                  </span>
                }
              >
                <span aria-hidden="true" {...stylex.props(styles.text3)}>
                  <span
                    {...stylex.props(styles.grid)}
                    style={{
                      transform: `translateY(-${Number(c())}em)`,
                      "transition-duration": `${props.duration}ms`,
                    }}
                  >
                    <For each={DIGITS}>{(d) => <span {...stylex.props(styles.text4)}>{d}</span>}</For>
                  </span>
                </span>
              </Show>
            )}
          </Index>
        )}
      </For>
    </span>
  )
}
