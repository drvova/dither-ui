import { createMemo, createSignal, Index, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import "./ScrollFloat.css"

export type ScrollFloatProps = {
  text?: string
  amount?: number
  class?: string
}

export default function ScrollFloat(raw: ScrollFloatProps) {
  const props = mergeProps({ text: "Scroll float", amount: 1 }, raw)

  const chars = createMemo(() => [...props.text])
  let el: HTMLSpanElement | undefined
  const [progress, setProgress] = createSignal(0)

  function update() {
    if (!el) return
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || 1
    setProgress(Math.max(0, Math.min(1, 1 - (r.top - vh * 0.2) / (vh * 0.55))))
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) {
      setProgress(1)
      return
    }
    const onScroll = () => update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()
    onCleanup(() => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    })
  })

  // Each char floats up from an offset as it is reached by the scroll progress.
  function floatStyle(i: number): JSX.CSSProperties {
    const t = Math.max(0, Math.min(1, progress() * chars().length - i * 0.5))
    return {
      opacity: 0.15 + 0.85 * t,
      transform: `translateY(${(1 - t) * 0.7 * props.amount}em)`,
    }
  }

  return (
    <span ref={(node) => (el = node)} class={cn("inline-block", props.class)} aria-label={props.text}>
      <Index each={chars()}>
        {(ch, i) => (
          <span aria-hidden="true" class="dither-float-char" style={floatStyle(i)}>
            {ch() === " " ? " " : ch()}
          </span>
        )}
      </Index>
    </span>
  )
}
