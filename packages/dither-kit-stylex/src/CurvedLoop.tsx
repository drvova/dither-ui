// Generated from @dither-ui/kit/solid/CurvedLoop.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createUniqueId, mergeProps, on, onCleanup, onMount } from "solid-js"
import { directedTime, isDirected, onSeek } from "@dither-ui/kit/engine/clock.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import { createInviewLoop } from "@dither-ui/kit/solid/runtime/in-view.ts"
import "@dither-ui/kit/solid/CurvedLoop.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  svg: { width: "100%" },
})

export type CurvedLoopProps = {
  /** @default "DITHER UI · CANVAS + BAYER ·" */
  text?: string
  /** @docs number (units/s) */
  speed?: number
  class?: string
  xstyle?: StyleProp
}

const d = "M -100 58 Q 25 18 150 58 T 400 58 T 650 58 T 900 58"

export default function CurvedLoop(raw: CurvedLoopProps) {
  const props = mergeProps({ text: "DITHER UI · CANVAS + BAYER · ", speed: 60 }, raw)

  const uid = `dither-curve-${createUniqueId()}`
  // Repeated enough to always cover the visible path plus one wrap unit.
  const content = () => props.text.repeat(10)

  let host: SVGSVGElement | undefined
  let measure: SVGTextElement | undefined
  let textPathEl: SVGTextPathElement | undefined
  let raf = 0
  let offset = 0
  let copyLen = 0
  let lastT = 0

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const el = textPathEl
    if (!el || !copyLen) return
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0
    lastT = now
    offset -= props.speed * dt
    while (offset <= -copyLen) offset += copyLen
    el.setAttribute("startOffset", String(offset))
  }

  function start() {
    if (raf || pixelPrefersReducedMotion()) return
    if (isDirected()) {
      seekTo(directedTime() ?? 0)
      return
    }
    raf = requestAnimationFrame(frame)
  }
  /** Directed (clock.ts): the scroll is a pure function of the moment. */
  function seekTo(ms: number) {
    stop()
    const el = textPathEl
    if (!el || !copyLen) return
    offset = -(((props.speed * ms) / 1000) % copyLen)
    el.setAttribute("startOffset", String(offset))
  }
  function stop() {
    if (!raf) return
    cancelAnimationFrame(raf)
    raf = 0
  }

  onMount(() => {
    onCleanup(onSeek((ms) => (ms === null ? start() : seekTo(ms))))
    // A new text is measured again; directed, the moment is set out anew.
    createEffect(
      on([() => props.text, () => props.speed], () => {
        copyLen = measure?.getComputedTextLength?.() || 0
        if (isDirected()) seekTo(directedTime() ?? 0)
      }),
    )
  })
  createInviewLoop(() => host, start, stop)

  return (
    <svg
      ref={(el) => (host = el)}
      viewBox="0 0 600 100"
      class={cn(styles.svg, props.xstyle, props.class)}
      aria-label={props.text}
    >
      <defs>
        <path id={uid} d={d} fill="none" />
      </defs>
      {/* hidden single copy, measured to wrap the scroll seamlessly */}
      <text ref={(el) => (measure = el)} class="dither-curve-text" x="-9999" y="-9999">
        {props.text}
      </text>
      <text class="dither-curve-text" aria-hidden="true">
        <textPath ref={(el) => (textPathEl = el)} href={`#${uid}`} startOffset="0">
          {content()}
        </textPath>
      </text>
    </svg>
  )
}
