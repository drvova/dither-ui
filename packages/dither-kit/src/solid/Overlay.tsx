import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"

type Own = {
  dim?: "none" | "soft" | "medium" | "strong"
  interactive?: boolean
  class?: string
}

/** Listeners (a dismissable scrim's click) and attributes reach the layer. */
export type OverlayProps = Own & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own>

const DIMS = {
  none: "",
  soft: "bg-background/20",
  medium: "bg-background/40",
  strong: "bg-background/60",
} as const

/** Full-cover layer primitive: fixed dim over the app (dialogs, drawers, busy
 * states). Decorative and click-transparent by default; flip `interactive` to
 * make it catch pointer events (dismissable scrims), which also lifts the
 * aria-hidden so its children stay reachable. */
export default function Overlay(raw: OverlayProps) {
  const merged = mergeProps({ dim: "soft" as const, interactive: false }, raw)
  const [props, rest] = splitProps(merged, ["dim", "interactive", "class", "children"])
  const classes = createMemo(() =>
    cn(
      "fixed inset-0 z-40",
      DIMS[props.dim],
      props.interactive ? "pointer-events-auto" : "pointer-events-none",
      props.class,
    ),
  )
  return (
    <div {...rest} class={classes()} aria-hidden={props.interactive ? undefined : "true"}>
      {props.children}
    </div>
  )
}
