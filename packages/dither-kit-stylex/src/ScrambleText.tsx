// Generated from dither-kit/solid/ScrambleText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block", cursor: "default", fontFamily: "var(--font-mono)", whiteSpace: "pre" },
})

export type ScrambleTextProps = {
  text?: string
  speed?: number
  class?: string
  xstyle?: StyleProp
}

const CHARS = "!<>-_\\/[]{}=+*^?#$%&ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)]

export default function ScrambleText(raw: ScrambleTextProps) {
  const props = mergeProps({ text: "Hover to scramble", speed: 1 }, raw)

  const target = createMemo(() => props.text)
  const [display, setDisplay] = createSignal(props.text)
  let raf = 0
  let running = false

  // A hover burst: every char randomises, then settles left-to-right.
  function scramble() {
    if (pixelPrefersReducedMotion() || running) return
    running = true
    const t = target()
    const settleEvery = Math.max(1, Math.round(2 / Math.max(0.1, props.speed)))
    const total = t.length * settleEvery + 6
    let frame = 0
    const tick = () => {
      frame++
      const settled = Math.floor(frame / settleEvery)
      let out = ""
      for (let i = 0; i < t.length; i++) out += i < settled ? t[i] : t[i] === " " ? " " : rand()
      setDisplay(out)
      if (frame < total) raf = requestAnimationFrame(tick)
      else {
        setDisplay(t)
        running = false
      }
    }
    raf = requestAnimationFrame(tick)
  }

  onMount(() => {
    onCleanup(() => {
      if (raf) cancelAnimationFrame(raf)
    })
  })

  return (
    <span class={cn(styles.text, props.xstyle, props.class)} aria-label={props.text} onMouseEnter={scramble}>
      {display()}
    </span>
  )
}
