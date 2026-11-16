// Generated from @dither-ui/kit/solid/FadeContent.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/FadeContent.css"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"

export type FadeContentProps = {
  /** @docs number (ms) */
  duration?: number
  /** @docs number (ms) */
  delay?: number
  blur?: boolean
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

export default function FadeContent(raw: FadeContentProps) {
  const props = mergeProps({ duration: 1000, delay: 0, blur: false }, raw)

  let el: HTMLDivElement | undefined
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
    <div
      ref={(node) => (el = node)}
      class={cn("dither-fade-content", props.xstyle, props.class)}
      style={{
        opacity: shown() ? 1 : 0,
        filter: props.blur && !shown() ? "blur(10px)" : "blur(0)",
        "transition-duration": `${props.duration}ms`,
        "transition-delay": `${props.delay}ms`,
      }}
    >
      {props.children}
    </div>
  )
}
