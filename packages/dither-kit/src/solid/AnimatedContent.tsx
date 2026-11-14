import { createMemo, createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import "./AnimatedContent.css"
import { latestEntry } from "../engine/visibility"

export type AnimatedContentProps = {
  /** px (number) or any CSS length — `"4cqw"` measures the nearest query
   * container, making the reveal container-relative. */
  distance?: number | string
  direction?: "vertical" | "horizontal"
  reverse?: boolean
  duration?: number
  delay?: number
  class?: string
  children?: JSX.Element
}

export default function AnimatedContent(raw: AnimatedContentProps) {
  const props = mergeProps(
    { distance: 40 as number | string, direction: "vertical" as const, reverse: false, duration: 800, delay: 0 },
    raw,
  )

  let el: HTMLDivElement | undefined
  const [shown, setShown] = createSignal(false)

  /** Offsets are signed: numbers are px; strings pass through as CSS lengths
   * with the sign flipped for `reverse` (`"4cqh"` → `"-4cqh"`). */
  function offset(): string {
    const distance = props.distance
    if (typeof distance === "number") {
      return `${distance * (props.reverse ? -1 : 1)}px`
    }
    const negative = distance.startsWith("-") !== props.reverse
    const body = distance.startsWith("-") ? distance.slice(1) : distance
    return negative ? `-${body}` : body
  }

  const hidden = createMemo(() =>
    props.direction === "horizontal" ? `translateX(${offset()})` : `translateY(${offset()})`,
  )

  onMount(() => {
    if (pixelPrefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }
    let io: IntersectionObserver | null = new IntersectionObserver((entries) => {
      const entry = latestEntry(entries)
      if (entry?.isIntersecting) {
        setShown(true)
        io?.disconnect()
      }
    })
    if (el) io.observe(el)
    onCleanup(() => {
      io?.disconnect()
      io = null
    })
  })

  return (
    <div
      ref={(node) => (el = node)}
      class={cn("dither-animated-content", props.class)}
      style={{
        opacity: shown() ? 1 : 0,
        transform: shown() ? "none" : hidden(),
        "transition-duration": `${props.duration}ms`,
        "transition-delay": `${props.delay}ms`,
      }}
    >
      {props.children}
    </div>
  )
}
