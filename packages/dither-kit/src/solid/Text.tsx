import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

/** Text primitive on the site's native type scale. `as` picks the element
 * (p default; span/h3/li/… for context), `tone` maps to the shadcn token
 * utilities (`faint` shares the muted ink: no text drops under AA), `size` to the 11–15px scale the docs use — anything else
 * (leading, tracking, weight) rides along in `class`. */
type Own = {
  /** @docs "p" | "span" | "h3" | "li" | … */
  as?: string
  tone?: "default" | "muted" | "faint"
  /** @docs "xs" | "sm" | "md" | "lg" (11–15px) */
  size?: "xs" | "sm" | "md" | "lg"
  class?: string
}
const OWN = ["as", "tone", "size", "class", "children"] as const satisfies readonly (keyof Own | "children")[]

/** Everything an element takes (an id, ARIA, listeners) reaches the element. */
export type TextProps = Own & Omit<JSX.HTMLAttributes<HTMLElement>, keyof Own>

const TONES = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  faint: "text-muted-foreground",
} as const

const SIZES = {
  xs: "text-[11px]",
  sm: "text-[12px]",
  md: "text-[13px]",
  lg: "text-[15px]",
} as const

export default function Text(raw: TextProps) {
  const merged = mergeProps({ as: "p", tone: "default" as const }, raw)
  const [props, rest] = splitProps(merged, OWN)

  const classes = createMemo(() => cn(props.size && SIZES[props.size], TONES[props.tone], props.class))

  return (
    <Dynamic component={props.as} {...rest} class={classes()}>
      {props.children}
    </Dynamic>
  )
}
