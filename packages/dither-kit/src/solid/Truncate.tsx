import { type JSX, mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

export type TruncateProps = {
  as?: string
  title?: string
  class?: string
  /** @docs content */
  children?: JSX.Element
}

/** One-line ellipsis. Wraps any content in the `truncate` contract —
 * `title` rides through so native tooltips stay available. */
export default function Truncate(raw: TruncateProps) {
  const props = mergeProps({ as: "span" }, raw)
  return (
    <Dynamic component={props.as} title={props.title} class={cn("block truncate", props.class)}>
      {props.children}
    </Dynamic>
  )
}
