import { createMemo, createSignal, Index, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import "./BlurText.css"
import { latestEntry } from "../engine/visibility"

export type BlurTextProps = {
  text?: string
  by?: "words" | "chars"
  /** @docs number (ms) */
  stagger?: number
  /** @docs number (ms) */
  duration?: number
  class?: string
}

export default function BlurText(raw: BlurTextProps) {
  const props = mergeProps({ text: "Blur into focus", by: "words" as const, stagger: 90, duration: 600 }, raw)

  const parts = createMemo(() => (props.by === "chars" ? [...props.text] : props.text.split(/(\s+)/)))
  let el: HTMLSpanElement | undefined
  const [shown, setShown] = createSignal(false)

  onMount(() => {
    if (pixelPrefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }
    const io = new IntersectionObserver((entries) => {
      const entry = latestEntry(entries)
      if (entry?.isIntersecting) {
        setShown(true)
        io.disconnect()
      }
    })
    if (el) io.observe(el)
    onCleanup(() => io.disconnect())
  })

  return (
    <span ref={(node) => (el = node)} class={cn("inline-block", props.class)} aria-label={props.text}>
      <Index each={parts()}>
        {(p, i) => (
          <span
            aria-hidden="true"
            class="dither-blur-part"
            classList={{ shown: shown() }}
            style={{ "transition-delay": `${i * props.stagger}ms`, "transition-duration": `${props.duration}ms` }}
          >
            {/^\s*$/.test(p()) ? " " : p()}
          </span>
        )}
      </Index>
    </span>
  )
}
