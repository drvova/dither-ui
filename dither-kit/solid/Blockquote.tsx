import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"

export type BlockquoteProps = { class?: string; children?: JSX.Element }

/** Quoted aside: real `<blockquote>` semantics with the editorial treatment —
 * hairline left rule, muted register. Cite lives in the children (or the
 * `cite` attr). */
export default function Blockquote(props: BlockquoteProps) {
  return (
    <blockquote
      class={cn("border-l-2 border-border/60 pl-4 text-[13px] leading-relaxed text-muted-foreground", props.class)}
    >
      {props.children}
    </blockquote>
  )
}
