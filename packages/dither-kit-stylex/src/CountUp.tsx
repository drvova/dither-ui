// Generated from @dither-ui/kit/solid/CountUp.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import { directedTime, isDirected, onSeek } from "@dither-ui/kit/engine/clock.ts"
import { formatFixed } from "@dither-ui/kit/engine/format-number.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { fontVariantNumeric: "   tabular-nums " },
})

export type CountUpProps = {
  to: number
  from?: number
  duration?: number
  decimals?: number
  class?: string
  xstyle?: StyleProp
}

export default function CountUp(raw: CountUpProps) {
  const props = mergeProps({ from: 0, duration: 1500, decimals: 0 }, raw)

  let el: HTMLSpanElement | undefined
  // How far into the count it is, ms: the count shown is read off it, so
  // new ends or a new length show at once.
  const [elapsed, setElapsed] = createSignal(0)
  let raf = 0
  let started = false
  const duration = () => Math.max(1, props.duration)
  /** The count at the moment (eased out). */
  const value = createMemo(() => {
    const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, elapsed() / duration())), 3)
    return props.from + (props.to - props.from) * e
  })

  function run() {
    if (started) return
    started = true
    if (pixelPrefersReducedMotion()) {
      setElapsed(Infinity)
      return
    }
    // Directed (clock.ts): the count is the moment's, no frames requested.
    if (isDirected()) {
      setElapsed(directedTime() ?? 0)
      return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      setElapsed(now - t0)
      if (now - t0 < duration() && !isDirected()) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }

  onMount(() => {
    const unseek = onSeek((ms) => {
      if (ms === null || !started) return
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      setElapsed(ms)
    })
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver === "undefined") run()
    else {
      io = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) run()
      })
      if (el) io.observe(el)
    }
    onCleanup(() => {
      unseek()
      if (raf) cancelAnimationFrame(raf)
      io?.disconnect()
    })
  })

  const display = createMemo(() => formatFixed(value(), props.decimals))

  return (
    <span ref={(node) => (el = node)} class={cn(styles.text, props.xstyle, props.class)}>
      {display()}
    </span>
  )
}
