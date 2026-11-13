// Generated from ../solid/BlurText.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, Index, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn, type StyleProp } from "./lib"
import "../solid/BlurText.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
})

export type BlurTextProps = {
  text?: string
  by?: "words" | "chars"
  stagger?: number
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
