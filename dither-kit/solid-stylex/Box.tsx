// Generated from ../solid/Box.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, splitProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn, type StyleProp } from "./lib"

type Own = {
  as?: string
  class?: string
  xstyle?: StyleProp
}

/** Unknown attrs (id, data-*, aria-*) fall through to the element untouched. */
export type BoxProps = Own & Omit<JSX.HTMLAttributes<HTMLElement>, keyof Own>

/** Container primitive: one element, one job — `class` carries the rest of the
 * styling. `as` swaps the tag (div for blocks, span for inline contexts,
 * section/article for landmarks) without touching the children. Unknown attrs
 * (id, data-*, aria-*) fall through to the element untouched. */
export default function Box(raw: BoxProps) {
  const merged = mergeProps({ as: "div" }, raw)
  const [props, rest] = splitProps(merged, ["as", "class", "xstyle", "children"])
  return (
    <Dynamic component={props.as} {...rest} class={cn(null, props.xstyle, props.class)}>
      {props.children}
    </Dynamic>
  )
}
