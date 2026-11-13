import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

type Own = { lines?: 1 | 2 | 3 | 4 | 5 | 6; as?: string; class?: string }

export type LineClampProps = Own & Omit<JSX.HTMLAttributes<HTMLElement>, keyof Own>

// Literal classes so Tailwind ships every variant.
const CLAMPS = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
} as const

/** Clamped block with a real ellipsis after N lines (1–6). */
export default function LineClamp(raw: LineClampProps) {
  const merged = mergeProps({ lines: 3 as const, as: "p" }, raw)
  const [props, rest] = splitProps(merged, ["lines", "as", "class", "children"])
  const classes = createMemo(() => cn(CLAMPS[props.lines], props.class))
  return (
    <Dynamic component={props.as} {...rest} class={classes()}>
      {props.children}
    </Dynamic>
  )
}
