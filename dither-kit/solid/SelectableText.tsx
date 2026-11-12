import { type JSX, mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

export type SelectableTextProps = { as?: string; class?: string; children?: JSX.Element }

/** Text that selects itself on click (`user-select: all`) — license keys,
 * tokens, one-tap copy targets. Wraps any inline content. */
export default function SelectableText(raw: SelectableTextProps) {
  const props = mergeProps({ as: "span" }, raw)

  return (
    <Dynamic component={props.as} class={cn("select-all", props.class)}>
      {props.children}
    </Dynamic>
  )
}
