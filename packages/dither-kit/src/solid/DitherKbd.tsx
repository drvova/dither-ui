import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"

export type DitherKbdProps = {
  /** @default undefined */
  class?: string
  /** @docs content */
  children?: JSX.Element
}

export default function DitherKbd(props: DitherKbdProps) {
  return (
    <kbd
      class={cn(
        "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground",
        props.class,
      )}
      style={{ "border-bottom-width": "2px" }}
    >
      {props.children}
    </kbd>
  )
}
