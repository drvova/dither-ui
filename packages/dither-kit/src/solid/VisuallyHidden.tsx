import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"

/** Screen-reader-only content. `focusable` reveals it on keyboard focus with
 * skip-link styling — the pattern for "visible only to whom it matters", and
 * the a11y-floor alternative to `aria-label` when the label must also exist in
 * the reading order. */
type Own = {
  focusable?: boolean
  class?: string
}
const OWN = ["focusable", "class", "children"] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<span>` takes (a `tabindex`, listeners, ARIA) reaches it. */
export type VisuallyHiddenProps = Own & Omit<JSX.HTMLAttributes<HTMLSpanElement>, keyof Own>

export default function VisuallyHidden(raw: VisuallyHiddenProps) {
  const merged = mergeProps({ focusable: false }, raw)
  const [props, rest] = splitProps(merged, OWN)

  return (
    <span
      {...rest}
      class={cn(
        "sr-only",
        props.focusable &&
          "focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:border focus:bg-background focus:px-2 focus:py-1 focus:text-[11px] focus:text-foreground",
        props.class,
      )}
    >
      {props.children}
    </span>
  )
}
