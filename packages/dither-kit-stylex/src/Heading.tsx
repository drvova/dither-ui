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

type Level = "1" | "2" | "3" | "4" | "5" | "6"

export type HeadingProps = {
  /** Its place in the page's outline: h1 to h6.
   * @docs 1 | 2 | 3 | 4 | 5 | 6
   * @default 2 */
  level?: Level
  /** The step of the scale it is drawn at, when that is not its level's (a
   * card's title under a section's h2: level 3, drawn at 4).
   * @docs 1 | 2 | 3 | 4 | 5 | 6
   * @default level */
  size?: Level
  class?: string
  xstyle?: StyleProp
  /** @docs content */
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
 * size/weight from the level (or from `size`, so the outline and the look
 * part), `class` overrides anything below. */
export default function Heading(raw: HeadingProps) {
  const props = mergeProps({ level: "2" as const }, raw)
  return (
    <Dynamic component={`h${props.level}`} class={cn(LEVELS[props.size ?? props.level], props.xstyle, props.class)}>
      {props.children}
    </Dynamic>
  )
}
