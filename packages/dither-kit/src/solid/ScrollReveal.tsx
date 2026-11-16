import { createMemo, Index, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./ScrollReveal.css"

export type ScrollRevealProps = {
  /** @default required */
  text?: string
  /** @default undefined */
  class?: string
}

/** Words that sharpen and rise into place, one after another, as the block
 * rises through the page: a view timeline in CSS (`ScrollReveal.css`),
 * every word shown where the browser has none and under reduced motion. */
export default function ScrollReveal(raw: ScrollRevealProps) {
  const props = mergeProps({ text: "Words reveal as you scroll into view" }, raw)

  const words = createMemo(() => props.text.split(/(\s+)/))

  return (
    <span
      class={cn("dk-scroll-reveal inline-block", props.class)}
      style={{ "--dk-n": String(words().length) }}
      aria-label={props.text}
    >
      <Index each={words()}>
        {(w, i) => (
          <span aria-hidden="true" class="dither-reveal-word" style={{ "--dk-i": String(i) }}>
            {/^\s*$/.test(w()) ? " " : w()}
          </span>
        )}
      </Index>
    </span>
  )
}
