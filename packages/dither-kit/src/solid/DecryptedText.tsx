import { createMemo, createSignal, Index, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { latestEntry } from "../engine/visibility"
import { cn } from "../tailwind/lib"
import "./DecryptedText.css"

export type DecryptedTextProps = {
  text?: string
  speed?: number
  trigger?: "view" | "hover"
  /** The glyphs a letter runs through before it settles.
   * @docs string: the glyphs a letter runs through */
  chars?: string
  class?: string
}

const CHARS = "!<>-_\\/[]{}=+*^?#ABCDEF0123456789"
/** The decrypt's frame, ms: a glyph a frame at 60 a second. */
const FRAME = 1000 / 60

/** The glyph at a frame of a slot: a hash, so every run prints the same. */
const glyphAt = (chars: string, frame: number, i: number) =>
  chars[((Math.imul(frame + 1, 2654435761) ^ Math.imul(i + 1, 40503)) >>> 0) % chars.length]

/** A letter's column: "?" (the masked rest), a glyph every frame until it
 * settles, then the letter itself. */
export function glyphColumn(chars: string, letter: string, i: number, frames: number): string {
  const rows = ["?"]
  for (let f = 1; f <= frames; f++) rows.push(glyphAt(chars, f, i) ?? "?")
  rows.push(letter)
  return rows.join("\n")
}

/** Letters that run through glyphs and settle left to right, in CSS: each
 * letter a column of its glyphs that steps up a row a frame
 * (`DecryptedText.css`), so the kit clock holds it when directed. On
 * `view` the text waits masked until it is seen; on `hover` it rests
 * whole and runs while the pointer is on it. Reduced motion shows it whole. */
export default function DecryptedText(raw: DecryptedTextProps) {
  const props = mergeProps({ text: "DECRYPTED", speed: 1, trigger: "view" as const, chars: CHARS }, raw)

  const [state, setState] = createSignal<"masked" | "run">("masked")
  let el: HTMLSpanElement | undefined

  /** Frames between one letter settling and the next. */
  const every = createMemo(() => Math.max(1, Math.round(3 / Math.max(0.1, props.speed))))
  const letters = createMemo(() => [...props.text])

  onMount(() => {
    if (props.trigger === "hover" || pixelPrefersReducedMotion()) return
    if (typeof IntersectionObserver === "undefined") return void setState("run")
    const io = new IntersectionObserver((entries) => {
      if (!latestEntry(entries)?.isIntersecting) return
      setState("run")
      io.disconnect()
    })
    if (el) io.observe(el)
    onCleanup(() => io.disconnect())
  })

  return (
    <span
      ref={(node) => (el = node)}
      class={cn("dk-decrypt inline-block whitespace-pre font-mono", props.class)}
      data-decrypt={props.trigger === "hover" ? "hover" : state()}
      aria-label={props.text}
    >
      <Index each={letters()}>
        {(letter, i) => {
          // a letter settles once its frames are run: one more slot each
          const frames = () => (i + 1) * every()
          return letter() === " " ? (
            <span aria-hidden="true"> </span>
          ) : (
            <span
              aria-hidden="true"
              class="dk-decrypt-cell"
              style={{ "--dk-rows": String(frames() + 1), "--dk-dur": `${(frames() + 1) * FRAME}ms` }}
            >
              <span class="dk-decrypt-column">{glyphColumn(props.chars, letter(), i, frames())}</span>
            </span>
          )
        }}
      </Index>
    </span>
  )
}
