import { createMemo, mergeProps, Show } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { createKitTime } from "./runtime/kit-time"
import "./TextType.css"

export type TextTypeProps = {
  texts?: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pause?: number
  loop?: boolean
  cursor?: boolean
  class?: string
}

/** The wait before the first letter, ms. */
const LEAD = 300
/** The wait between a line deleted and the next one's first letter, ms. */
const GAP = 220

type Typing = { texts: string[]; typingSpeed: number; deletingSpeed: number; pause: number; loop: boolean }

/** What is typed `ms` into the run: a letter every `typingSpeed`, the line
 * held `pause`, a letter gone every `deletingSpeed`, `GAP`, the next line;
 * without a loop the last line stays. */
function typedAt(t: Typing, ms: number): string {
  const type = Math.max(1, t.typingSpeed)
  const del = Math.max(1, t.deletingSpeed)
  const pause = Math.max(0, t.pause)
  const cycle = (s: string) => s.length * (type + del) + pause + GAP
  let u = ms - LEAD
  if (u < 0) return ""
  const period = t.texts.reduce((sum, s) => sum + cycle(s), 0)
  if (t.loop) u %= period
  for (let i = 0; i < t.texts.length; i++) {
    const s = t.texts[i]!
    const last = i === t.texts.length - 1
    if (!t.loop && last) return s.slice(0, Math.floor(u / type) + 1)
    if (u >= cycle(s)) {
      u -= cycle(s)
      continue
    }
    const typed = s.length * type + pause
    if (u < typed) return s.slice(0, Math.floor(u / type) + 1)
    return s.slice(0, Math.max(0, s.length - Math.floor((u - typed) / del) - 1))
  }
  return ""
}

export default function TextType(raw: TextTypeProps) {
  const props = mergeProps(
    {
      texts: ["Type this out.", "Then this."],
      typingSpeed: 60,
      deletingSpeed: 35,
      pause: 1400,
      loop: true,
      cursor: true,
    },
    raw,
  )

  let host: HTMLSpanElement | undefined
  const { time } = createKitTime(() => host)
  const list = createMemo(() => (props.texts.length ? props.texts : [""]))
  const shown = createMemo(() =>
    pixelPrefersReducedMotion()
      ? list()[0]!
      : typedAt(
          {
            texts: list(),
            typingSpeed: props.typingSpeed,
            deletingSpeed: props.deletingSpeed,
            pause: props.pause,
            loop: props.loop,
          },
          time(),
        ),
  )

  return (
    <span ref={(el) => (host = el)} class={cn("inline-block whitespace-pre", props.class)}>
      <span>{shown()}</span>
      <Show when={props.cursor}>
        <span class="dither-caret" aria-hidden="true">
          |
        </span>
      </Show>
    </span>
  )
}
