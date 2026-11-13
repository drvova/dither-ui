import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"

/** Inline highlight: the `<mark>` element with a neutral token wash (the
 * colored variants ride in `class`). Neutral because house color comes from
 * palette seeds, not hardcoded accents. */
export type HighlightProps = { class?: string; children?: JSX.Element }

export default function Highlight(props: HighlightProps) {
  return <mark class={cn("rounded-sm bg-foreground/10 px-0.5 text-inherit", props.class)}>{props.children}</mark>
}
