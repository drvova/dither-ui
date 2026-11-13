import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"

/** Container-level focus highlight: wraps a control group and shows the ring
 * while anything inside holds focus (`focus-within`), so keyboard users can
 * see WHICH group is active — the individual control keeps the global
 * `:focus-visible` floor from styles.css. */
export type FocusRingProps = { class?: string; children?: JSX.Element }

export default function FocusRing(props: FocusRingProps) {
  return (
    <div
      class={cn(
        "rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}
