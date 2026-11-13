// Generated from ../solid/FadeContent.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn, type StyleProp } from "./lib"
import "../solid/FadeContent.css"

export type FadeContentProps = {
  duration?: number
  delay?: number
  blur?: boolean
  class?: string
  xstyle?: StyleProp
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
    const io = new IntersectionObserver(([entry]) => {
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
