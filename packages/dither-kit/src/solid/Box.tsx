import { type JSX, mergeProps, splitProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

type Own = {
  /** @docs "div" | "section" | "span" | "article" | … */
  as?: string
  class?: string
}

/** Unknown attrs (id, data-*, aria-*) fall through to the element untouched. */
export type BoxProps = Own & Omit<JSX.HTMLAttributes<HTMLElement>, keyof Own>

/** Container primitive: one element, one job — `class` carries the rest of the
 * styling. `as` swaps the tag (div for blocks, span for inline contexts,
 * section/article for landmarks) without touching the children. Unknown attrs
 * (id, data-*, aria-*) fall through to the element untouched. */
export default function Box(raw: BoxProps) {
  const merged = mergeProps({ as: "div" }, raw)
  const [props, rest] = splitProps(merged, ["as", "class", "children"])
  return (
    <Dynamic component={props.as} {...rest} class={cn("", props.class)}>
      {props.children}
    </Dynamic>
  )
}
