import { createMemo, For, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./TrueFocus.css"

export type TrueFocusProps = {
  text?: string
  /** @docs number (ms) */
  interval?: number
  /** @docs number (px) */
  blur?: number
  class?: string
}

/** The crossfade from one word to the next, ms (at most half a slot). */
const FADE = 500

/** One word in focus at a time, the next every `interval`: the turn is a
 * CSS animation (`TrueFocus.css`) the kit clock holds when it is directed. */
export default function TrueFocus(raw: TrueFocusProps) {
  const props = mergeProps({ text: "True focus mode", interval: 1400, blur: 5 }, raw)

  const words = createMemo(() => props.text.split(/\s+/).filter(Boolean))
  const interval = () => Math.max(300, props.interval)

  return (
    <span
      class={cn("dk-true-focus inline-flex flex-wrap gap-x-[0.35em] gap-y-1", props.class)}
      style={{
        "--dk-n": String(Math.max(1, words().length)),
        "--dk-interval": `${interval()}ms`,
        "--dk-fade": String(Math.min(0.5, FADE / interval())),
        "--dk-blur": `${props.blur}px`,
      }}
      data-turn={words().length > 1 ? "" : undefined}
      aria-label={props.text}
    >
      <For each={words()}>
        {(w, i) => (
          <span aria-hidden="true" class="dk-true-focus-word inline-block" style={{ "--dk-i": String(i()) }}>
            {w}
          </span>
        )}
      </For>
    </span>
  )
}
