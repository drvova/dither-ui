import { type JSX, mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

type Level = "1" | "2" | "3" | "4" | "5" | "6"

export type HeadingProps = {
  /** Its place in the page's outline: h1 to h6. */
  level?: Level
  /** The step of the scale it is drawn at, when that is not its level's (a
   * card's title under a section's h2: level 3, drawn at 4). */
  size?: Level
  class?: string
  children?: JSX.Element
}

const LEVELS = {
  "1": "text-2xl tracking-tight font-medium",
  "2": "text-lg tracking-tight font-medium",
  "3": "text-base tracking-tight font-medium",
  "4": "text-sm font-medium",
  "5": "text-[13px] font-medium",
  "6": "text-[12px] font-medium",
} as const

/** Semantic heading with the site's scale baked in: h1–h6 pick their own
 * size/weight from the level (or from `size`, so the outline and the look
 * part), `class` overrides anything below. */
export default function Heading(raw: HeadingProps) {
  const props = mergeProps({ level: "2" as const }, raw)
  return (
    <Dynamic component={`h${props.level}`} class={cn(LEVELS[props.size ?? props.level], props.class)}>
      {props.children}
    </Dynamic>
  )
}
