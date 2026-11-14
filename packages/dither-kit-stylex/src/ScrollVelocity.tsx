// Generated from @dither-ui/kit/solid/ScrollVelocity.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, For, mergeProps, on, onCleanup, onMount } from "solid-js"
import { isDirected } from "@dither-ui/kit/engine/clock.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import { createKitTime } from "@dither-ui/kit/solid/runtime/kit-time.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "inline-flex", willChange: "transform" },
  text: { paddingRight: "1.5rem" },
  box: { overflow: "hidden", whiteSpace: "nowrap" },
})

export type ScrollVelocityProps = {
  text?: string
  baseSpeed?: number
  class?: string
  xstyle?: StyleProp
}

/** The longest step the drift takes in one frame, ms. */
const MAX_STEP = 50

export default function ScrollVelocity(raw: ScrollVelocityProps) {
  const props = mergeProps({ text: "DITHER · UI · TOOLKIT · ", baseSpeed: 60 }, raw)

  // Two identical halves so wrapping by half-width is seamless.
  const repeated = createMemo(() => Array.from({ length: 8 }, () => props.text))
  let host: HTMLDivElement | undefined
  let track: HTMLDivElement | undefined
  // The drift runs on the kit clock; a scroll is the reader's hand, pushed
  // on top while it runs free and left out of a directed moment.
  const { time, running } = createKitTime(() => host)
  let x = 0
  let vel = 0
  let lastScroll = 0
  let last = 0
  let measured: string | undefined
  let half = 1

  function onScroll() {
    const y = window.scrollY
    // While the run stands (offscreen, directed) keep the baseline fresh but
    // never accrue velocity: a resume must not fire a stale scroll impulse.
    if (running()) vel += y - lastScroll
    lastScroll = y
  }

  function place(ms: number) {
    const el = track
    if (!el) return
    if (isDirected()) {
      x = -(props.baseSpeed * ms) / 1000
      // a release goes on from here with no step back to the run's time
      last = NaN
    } else {
      if (ms > last) {
        x -= ((props.baseSpeed + vel * 4) * Math.min(MAX_STEP, ms - last)) / 1000
        vel *= 0.9
      }
      last = ms
    }
    // the track's width is read once it moves, and again for a new text
    if (x !== 0 && measured !== props.text) {
      half = el.scrollWidth / 2 || 1
      measured = props.text
    }
    x %= half
    if (x > 0) x -= half
    el.style.transform = `translateX(${x}px)`
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    lastScroll = window.scrollY
    window.addEventListener("scroll", onScroll, { passive: true })
    onCleanup(() => window.removeEventListener("scroll", onScroll))
    createEffect(on(running, (r) => r || (vel = 0), { defer: true }))
    createEffect(() => place(time()))
  })

  return (
    <div ref={(el) => (host = el)} class={cn(styles.box, props.xstyle, props.class)} aria-label={props.text}>
      <div ref={(el) => (track = el)} {...stylex.props(styles.row)} aria-hidden="true">
        <For each={repeated()}>{(t) => <span {...stylex.props(styles.text)}>{t}</span>}</For>
      </div>
    </div>
  )
}
