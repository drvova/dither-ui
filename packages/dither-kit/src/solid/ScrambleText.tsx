import { createMemo, createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type ScrambleTextProps = {
  text?: string
  speed?: number
  class?: string
}

const CHARS = "!<>-_\\/[]{}=+*^?#$%&ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)]

export default function ScrambleText(raw: ScrambleTextProps) {
  const props = mergeProps({ text: "Hover to scramble", speed: 1 }, raw)

  const target = createMemo(() => props.text)
  // A burst's frame while one runs; the text itself the rest of the time.
  const [burst, setBurst] = createSignal<string | null>(null)
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
      if (frame < total) {
        setBurst(out)
        raf = requestAnimationFrame(tick)
      } else {
        setBurst(null)
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
    <span
      class={cn("inline-block cursor-default whitespace-pre font-mono", props.class)}
      aria-label={props.text}
      onMouseEnter={scramble}
    >
      {burst() ?? target()}
    </span>
  )
}
