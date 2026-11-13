// Generated from dither-kit/solid/ScrollReveal.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, Index, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import "dither-kit/solid/ScrollReveal.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
})

export type ScrollRevealProps = {
  text?: string
  class?: string
  xstyle?: StyleProp
}

export default function ScrollReveal(raw: ScrollRevealProps) {
  const props = mergeProps({ text: "Words reveal as you scroll into view" }, raw)

  const words = createMemo(() => props.text.split(/(\s+)/))
  let el: HTMLSpanElement | undefined
  const [progress, setProgress] = createSignal(0)
  let onScroll: (() => void) | null = null
  let pending = 0

  function update() {
    const e = el
    if (!e) return
    const r = e.getBoundingClientRect()
    const vh = window.innerHeight || 1
    // 0 when the block sits near the bottom of the viewport, 1 once it has risen
    // through the middle band.
    setProgress(Math.max(0, Math.min(1, 1 - (r.top - vh * 0.2) / (vh * 0.55))))
  }

  /** Measure once per frame at the latest: the initial call lands before first
   * paint (visually identical), and scrolling never forces layout more than once
   * per frame — a direct call during mount measured the whole document while
   * it was still dirty. */
  function schedule() {
    if (pending) return
    pending = requestAnimationFrame(() => {
      pending = 0
      update()
    })
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) {
      setProgress(1)
      return
    }
    onScroll = () => schedule()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    schedule()
  })
  onCleanup(() => {
    if (pending) cancelAnimationFrame(pending)
    if (onScroll) {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  })

  function reveal(i: number) {
    return Math.max(0.06, Math.min(1, progress() * words().length - i))
  }

  return (
    <span ref={(node) => (el = node)} class={cn(styles.text, props.xstyle, props.class)} aria-label={props.text}>
      <Index each={words()}>
        {(w, i) => (
          <span
            aria-hidden="true"
            class="dither-reveal-word"
            style={{
              opacity: reveal(i),
              filter: `blur(${(1 - reveal(i)) * 4}px)`,
              transform: `translateY(${(1 - reveal(i)) * 0.3}em)`,
            }}
          >
            {/^\s*$/.test(w()) ? "\u00a0" : w()}
          </span>
        )}
      </Index>
    </span>
  )
}
