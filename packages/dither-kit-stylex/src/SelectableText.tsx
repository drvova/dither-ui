// Generated from @dither-ui/kit/solid/SelectableText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  dynamic: { WebkitUserSelect: "all", userSelect: "all" },
})

export type SelectableTextProps = {
  as?: string
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

/** Text that selects itself on click (`user-select: all`) — license keys,
 * tokens, one-tap copy targets. Wraps any inline content. */
export default function SelectableText(raw: SelectableTextProps) {
  const props = mergeProps({ as: "span" }, raw)

  return (
    <Dynamic component={props.as} class={cn(styles.dynamic, props.xstyle, props.class)}>
      {props.children}
    </Dynamic>
  )
}
