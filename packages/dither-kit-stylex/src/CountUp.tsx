// Generated from dither-kit/solid/CountUp.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import { directedTime, isDirected, onSeek } from "dither-kit/engine/clock.ts"
import { formatFixed } from "dither-kit/engine/format-number.ts"
import { pixelPrefersReducedMotion } from "dither-kit/engine/pixel.ts"
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
  const [value, setValue] = createSignal(props.from)
  let raf = 0
  let started = false

  /** The count at progress p (eased out). */
  const at = (p: number) => {
    const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3)
    setValue(props.from + (props.to - props.from) * e)
  }
  const duration = () => Math.max(1, props.duration)

  function run() {
    if (started) return
    started = true
    if (pixelPrefersReducedMotion()) {
      setValue(props.to)
      return
    }
    // Directed (clock.ts): the count is the moment's, no frames requested.
    if (isDirected()) {
      at((directedTime() ?? 0) / duration())
      return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration())
      at(p)
      if (p < 1 && !isDirected()) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }

  onMount(() => {
    const unseek = onSeek((ms) => {
      if (ms === null || !started) return
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      at(ms / duration())
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
