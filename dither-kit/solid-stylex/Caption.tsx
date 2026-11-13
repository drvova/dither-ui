// Generated from ../solid/Caption.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "block", fontSize: "11px", color: "var(--muted-foreground)" },
})

export type CaptionProps = { tone?: "muted" | "faint"; class?: string; xstyle?: StyleProp; children?: JSX.Element }

/** Supporting text under a title or figure — the caption register of the
 * type scale (11px, muted). `faint` shares the muted ink: no text in the
 * kit drops under AA (4.5:1). */
export default function Caption(raw: CaptionProps) {
  const props = mergeProps({ tone: "muted" as const }, raw)
  return <span class={cn(styles.text, props.xstyle, props.class)}>{props.children}</span>
}
