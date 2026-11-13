import { mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

export type DividerProps = {
  orientation?: "horizontal" | "vertical"
  class?: string
}

/** Hairline rule. Horizontal renders a real `hr` (separator semantics come
 * for free); vertical is a flex-row citizen that stretches to the row height.
 * Both announce `role="separator"` with the right orientation. */
export default function Divider(raw: DividerProps) {
  const props = mergeProps({ orientation: "horizontal" as const }, raw)
  return (
    <Dynamic
      component={props.orientation === "vertical" ? "div" : "hr"}
      role="separator"
      aria-orientation={props.orientation}
      class={cn(
        props.orientation === "vertical" ? "w-px self-stretch bg-border/60" : "h-px w-full border-0 bg-border/60",
        props.class,
      )}
    />
  )
}
