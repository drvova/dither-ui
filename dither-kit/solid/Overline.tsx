import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"

/** The tiny uppercase eyebrow above section titles — 10px, open tracking,
 * muted; the editorial "OVERLINE" register. `faint` shares the muted ink:
 * no text in the kit drops under AA (4.5:1). */
export type OverlineProps = { tone?: "muted" | "faint"; class?: string; children?: JSX.Element }

export default function Overline(props: OverlineProps) {
  return (
    <span class={cn("block text-[10px] uppercase tracking-[0.2em] text-muted-foreground", props.class)}>
      {props.children}
    </span>
  )
}
