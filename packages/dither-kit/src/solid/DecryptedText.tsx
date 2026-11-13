import { createMemo, createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import { directedTime, isDirected, onSeek } from "../engine/clock"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type DecryptedTextProps = {
  text?: string
  speed?: number
  trigger?: "view" | "hover"
  class?: string
}

const CHARS = "!<>-_\\/[]{}=+*^?#ABCDEF0123456789"

const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)]
/** A directed render must repeat: the glyph is a hash of (frame, slot). */
const seededChar = (frame: number, i: number) =>
  CHARS[((Math.imul(frame + 1, 2654435761) ^ Math.imul(i + 1, 40503)) >>> 0) % CHARS.length]

export default function DecryptedText(raw: DecryptedTextProps) {
  const props = mergeProps({ text: "DECRYPTED", speed: 1, trigger: "view" as const }, raw)

  const target = createMemo(() => props.text)
  const [display, setDisplay] = createSignal("")
  let el: HTMLSpanElement | undefined
  let raf = 0
  let running = false

  /** The text at a decrypt frame, or null once the reveal is complete. */
  function frameText(frame: number, seeded: boolean): string | null {
    const t = target()
    const revealEvery = Math.max(1, Math.round(3 / Math.max(0.1, props.speed)))
    if (frame >= t.length * revealEvery + 8) return null
    const revealed = Math.floor(frame / revealEvery)
    let out = ""
    for (let i = 0; i < t.length; i++)
      out += i < revealed ? t[i] : t[i] === " " ? " " : seeded ? seededChar(frame, i) : rand()
    return out
  }

  function scramble() {
    if (running) return
    running = true
    let frame = 0
    const tick = () => {
      const out = frameText(++frame, false)
      if (out === null || isDirected()) {
        setDisplay(target())
        running = false
        return
      }
      setDisplay(out)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }

  // Directed (clock.ts): the reveal runs at 60 frames per second of the moment.
  function seekTo(ms: number) {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    running = false
    setDisplay(frameText(Math.floor(ms / (1000 / 60)), true) ?? target())
  }

  onMount(() => {
    const unseek = onSeek((ms) => (ms === null ? scramble() : seekTo(ms)))
    let io: IntersectionObserver | null = null
    onCleanup(() => {
      unseek()
      if (raf) cancelAnimationFrame(raf)
      io?.disconnect()
    })
    setDisplay(target().replace(/[^ ]/g, "?"))
    if (pixelPrefersReducedMotion()) {
      setDisplay(target())
      return
    }
    if (props.trigger === "hover") {
      setDisplay(target())
      return
    }
    if (isDirected()) {
      seekTo(directedTime() ?? 0)
      return
    }
    if (typeof IntersectionObserver === "undefined") {
      scramble()
      return
    }
    io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        scramble()
        io?.disconnect()
      }
    })
    if (el) io.observe(el)
  })

  return (
    <span
      ref={(node) => (el = node)}
      class={cn("inline-block whitespace-pre font-mono", props.class)}
      aria-label={props.text}
      onMouseEnter={() => props.trigger === "hover" && scramble()}
    >
      {display()}
    </span>
  )
}
