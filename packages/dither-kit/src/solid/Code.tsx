import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"

export type CodeProps = { class?: string; children?: JSX.Element }

/** Inline code — the `<code>` element in house chrome (small radius, card
 * fill). For the copyable, highlighted block see CodeBlock in the app layer. */
export default function Code(props: CodeProps) {
  return (
    <code
      class={cn(
        "rounded border border-border/60 bg-card/60 px-1 py-px font-mono text-[12px] text-foreground/90",
        props.class,
      )}
    >
      {props.children}
    </code>
  )
}
