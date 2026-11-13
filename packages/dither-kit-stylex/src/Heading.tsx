// Generated from @dither-ui/kit/solid/Heading.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  levels1: { fontSize: "1.5rem", lineHeight: "calc(2 / 1.5)", fontWeight: "500", letterSpacing: "-0.025em" },
  levels2: {
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
    fontWeight: "500",
    letterSpacing: "-0.025em",
  },
  levels3: { fontSize: "1rem", lineHeight: "calc(1.5 / 1)", fontWeight: "500", letterSpacing: "-0.025em" },
  levels4: { fontSize: "0.875rem", lineHeight: "calc(1.25 / 0.875)", fontWeight: "500" },
  levels5: { fontSize: "13px", fontWeight: "500" },
  levels6: { fontSize: "12px", fontWeight: "500" },
})

export type HeadingProps = {
  level?: "1" | "2" | "3" | "4" | "5" | "6"
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

const LEVELS = {
  "1": styles.levels1,
  "2": styles.levels2,
  "3": styles.levels3,
  "4": styles.levels4,
  "5": styles.levels5,
  "6": styles.levels6,
} as const

/** Semantic heading with the site's scale baked in: h1–h6 pick their own
 * size/weight from the level, `class` overrides anything below. */
export default function Heading(raw: HeadingProps) {
  const props = mergeProps({ level: "2" as const }, raw)
  return (
    <Dynamic component={`h${props.level}`} class={cn(LEVELS[props.level], props.xstyle, props.class)}>
      {props.children}
    </Dynamic>
  )
}
