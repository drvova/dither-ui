// Generated from ../solid/Truncate.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  dynamic: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
})

export type TruncateProps = { as?: string; title?: string; class?: string; xstyle?: StyleProp; children?: JSX.Element }

/** One-line ellipsis. Wraps any content in the `truncate` contract —
 * `title` rides through so native tooltips stay available. */
export default function Truncate(raw: TruncateProps) {
  const props = mergeProps({ as: "span" }, raw)
  return (
    <Dynamic component={props.as} title={props.title} class={cn(styles.dynamic, props.xstyle, props.class)}>
      {props.children}
    </Dynamic>
  )
}
