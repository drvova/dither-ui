// Generated from dither-kit/solid/Overline.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: {
    display: "block",
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
})

/** The tiny uppercase eyebrow above section titles — 10px, open tracking,
 * muted; the editorial "OVERLINE" register. `faint` shares the muted ink:
 * no text in the kit drops under AA (4.5:1). */
export type OverlineProps = { tone?: "muted" | "faint"; class?: string; xstyle?: StyleProp; children?: JSX.Element }

export default function Overline(props: OverlineProps) {
  return <span class={cn(styles.text, props.xstyle, props.class)}>{props.children}</span>
}
