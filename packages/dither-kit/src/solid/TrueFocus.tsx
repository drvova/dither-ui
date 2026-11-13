import { createMemo, createSignal, For, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type TrueFocusProps = {
  text?: string
  interval?: number
  blur?: number
  class?: string
}

export default function TrueFocus(raw: TrueFocusProps) {
  const props = mergeProps({ text: "True focus mode", interval: 1400, blur: 5 }, raw)

  const words = createMemo(() => props.text.split(/\s+/).filter(Boolean))
  const [active, setActive] = createSignal(0)
  let timer = 0

  onMount(() => {
    if (pixelPrefersReducedMotion() || words().length < 2) return
    timer = window.setInterval(
      () => {
        setActive((active() + 1) % words().length)
      },
      Math.max(300, props.interval),
    )
  })
  onCleanup(() => clearInterval(timer))

  return (
    <span class={cn("inline-flex flex-wrap gap-x-[0.35em] gap-y-1", props.class)} aria-label={props.text}>
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
