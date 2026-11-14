// Generated from @dither-ui/kit/solid/BlurText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, Index, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/BlurText.css"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
})

export type BlurTextProps = {
  text?: string
  by?: "words" | "chars"
  /** @docs number (ms) */
  stagger?: number
  /** @docs number (ms) */
  duration?: number
  class?: string
  xstyle?: StyleProp
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
    <span ref={(node) => (el = node)} class={cn(styles.text, props.xstyle, props.class)} aria-label={props.text}>
      <Index each={parts()}>
        {(p, i) => (
          <span
            aria-hidden="true"
            class={cn("dither-blur-part", shown() && "shown")}

            style={{ "transition-delay": `${i * props.stagger}ms`, "transition-duration": `${props.duration}ms` }}
          >
            {/^\s*$/.test(p()) ? " " : p()}
          </span>
        )}
      </Index>
    </span>
  )
}
