import { type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type CaptionProps = { tone?: "muted" | "faint"; class?: string; children?: JSX.Element }

/** Supporting text under a title or figure — the caption register of the
 * type scale (11px, muted). `faint` shares the muted ink: no text in the
 * kit drops under AA (4.5:1). */
export default function Caption(raw: CaptionProps) {
  const props = mergeProps({ tone: "muted" as const }, raw)
  return <span class={cn("block text-[11px] text-muted-foreground", props.class)}>{props.children}</span>
}
