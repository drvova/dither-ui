// Generated from ../solid/FocusRing.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    borderRadius: "var(--radius)",
    boxShadow: {
      default: null,
      ":focus-within": "0 0 0 2px var(--background), 0 0 0 calc(2px + 2px) var(--ring)",
    },
  },
})

/** Container-level focus highlight: wraps a control group and shows the ring
 * while anything inside holds focus (`focus-within`), so keyboard users can
 * see WHICH group is active — the individual control keeps the global
 * `:focus-visible` floor from styles.css. */
export type FocusRingProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

export default function FocusRing(props: FocusRingProps) {
  return <div class={cn(styles.box, props.xstyle, props.class)}>{props.children}</div>
}
