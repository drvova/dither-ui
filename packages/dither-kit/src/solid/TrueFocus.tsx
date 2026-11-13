import { createMemo, For, mergeProps } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { createKitTime } from "./runtime/kit-time"

export type TrueFocusProps = {
  text?: string
  interval?: number
  blur?: number
  class?: string
}

export default function TrueFocus(raw: TrueFocusProps) {
  const props = mergeProps({ text: "True focus mode", interval: 1400, blur: 5 }, raw)

  let host: HTMLSpanElement | undefined
  const words = createMemo(() => props.text.split(/\s+/).filter(Boolean))
  // The word in focus: the next one every `interval` of the kit clock.
  const { time } = createKitTime(() => host)
  const active = createMemo(() =>
    pixelPrefersReducedMotion() || words().length < 2
      ? 0
      : Math.floor(time() / Math.max(300, props.interval)) % words().length,
  )

  return (
    <span
      ref={(el) => (host = el)}
      class={cn("inline-flex flex-wrap gap-x-[0.35em] gap-y-1", props.class)}
      aria-label={props.text}
    >
      <For each={words()}>
        {(w, i) => (
          <span
            aria-hidden="true"
            class="dither-focus-word inline-block transition-[filter,opacity] duration-500"
            style={{
              filter: i() === active() ? "blur(0)" : `blur(${props.blur}px)`,
              opacity: i() === active() ? 1 : 0.5,
            }}
          >
            {w}
          </span>
        )}
      </For>
    </span>
  )
}
