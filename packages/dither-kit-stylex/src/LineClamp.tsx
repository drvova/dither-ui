// Generated from @dither-ui/kit/solid/LineClamp.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  clamps1: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "1" },
  clamps2: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "2" },
  clamps3: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "3" },
  clamps4: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "4" },
  clamps5: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "5" },
  clamps6: { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: "6" },
})

type Own = { lines?: 1 | 2 | 3 | 4 | 5 | 6; as?: string; class?: string; xstyle?: StyleProp }

export type LineClampProps = Own & Omit<JSX.HTMLAttributes<HTMLElement>, keyof Own>

// Literal classes so Tailwind ships every variant.
const CLAMPS = {
  1: styles.clamps1,
  2: styles.clamps2,
  3: styles.clamps3,
  4: styles.clamps4,
  5: styles.clamps5,
  6: styles.clamps6,
} as const

/** Clamped block with a real ellipsis after N lines (1–6). */
export default function LineClamp(raw: LineClampProps) {
  const merged = mergeProps({ lines: 3 as const, as: "p" }, raw)
  const [props, rest] = splitProps(merged, ["lines", "as", "class", "xstyle", "children"])
  const classes = createMemo(() => cn(CLAMPS[props.lines], props.xstyle, props.class))
  return (
    <Dynamic component={props.as} {...rest} class={classes()}>
      {props.children}
    </Dynamic>
  )
}
