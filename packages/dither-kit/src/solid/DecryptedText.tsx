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
  // Where the reveal stands, the text shown read off it, so a new text or
  // speed shows at once: before it (every glyph a "?"), at a frame, or done.
  const [state, setState] = createSignal<"masked" | "done" | { frame: number; seeded: boolean }>(
    props.trigger === "hover" ? "done" : "masked",
  )
  let el: HTMLSpanElement | undefined
  let raf = 0
  let running = false

  const revealEvery = () => Math.max(1, Math.round(3 / Math.max(0.1, props.speed)))
  /** Whether the reveal is complete at a decrypt frame. */
  const ended = (frame: number) => frame >= target().length * revealEvery() + 8

  /** The text at a decrypt frame. */
  function frameText(frame: number, seeded: boolean): string {
    const t = target()
    const revealed = Math.floor(frame / revealEvery())
    let out = ""
    for (let i = 0; i < t.length; i++)
      out += i < revealed ? t[i] : t[i] === " " ? " " : seeded ? seededChar(frame, i) : rand()
    return out
  }

  const display = createMemo(() => {
    const s = state()
    if (s === "masked") return target().replace(/[^ ]/g, "?")
    return s === "done" || ended(s.frame) ? target() : frameText(s.frame, s.seeded)
  })

  function scramble() {
    if (running) return
    running = true
    let frame = 0
    const tick = () => {
      if (ended(++frame) || isDirected()) {
        setState("done")
        running = false
        return
      }
      setState({ frame, seeded: false })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }

  // Directed (clock.ts): the reveal runs at 60 frames per second of the moment.
  function seekTo(ms: number) {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    running = false
    setState({ frame: Math.floor(ms / (1000 / 60)), seeded: true })
  }

  onMount(() => {
    const unseek = onSeek((ms) => (ms === null ? scramble() : seekTo(ms)))
    let io: IntersectionObserver | null = null
    onCleanup(() => {
      unseek()
      if (raf) cancelAnimationFrame(raf)
      io?.disconnect()
    })
    if (pixelPrefersReducedMotion() || props.trigger === "hover") {
      setState("done")
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
