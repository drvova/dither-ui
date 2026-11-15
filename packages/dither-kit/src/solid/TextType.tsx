import { createMemo, For, Index, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import "./TextType.css"

export type TextTypeProps = {
  /** @default ['Type this out.', 'Then this.'] */
  texts?: string[]
  /** @docs number (ms) */
  typingSpeed?: number
  /** @docs number (ms) */
  deletingSpeed?: number
  /** @docs number (ms) */
  pause?: number
  loop?: boolean
  cursor?: boolean
  class?: string
}

/** The wait before the first letter, ms. */
export const TYPE_LEAD = 300
/** The wait between a line deleted and the next one's first letter, ms. */
export const TYPE_GAP = 220

export type Typing = { texts: string[]; typingSpeed: number; deletingSpeed: number; pause: number; loop: boolean }

/** A letter's time on the page, ms into the run after the lead: shown from
 * `from` until `to`. */
export type TypedLetter = { char: string; from: number; to: number }

/** Every letter of every line with its time on the page, and the run's
 * period: a letter every `typingSpeed`, the line held `pause`, a letter
 * gone every `deletingSpeed` from the end, `TYPE_GAP`, the next line;
 * without a loop the last line stays. */
export function typedLetters(t: Typing): { lines: TypedLetter[][]; period: number } {
  const type = Math.max(1, t.typingSpeed)
  const del = Math.max(1, t.deletingSpeed)
  const pause = Math.max(0, t.pause)
  let start = 0
  const lines = t.texts.map((s, k) => {
    const chars = [...s]
    const stays = !t.loop && k === t.texts.length - 1
    const typed = chars.length * type + pause
    const line = chars.map((char, j) => ({
      char,
      from: start + j * type,
      to: stays ? Number.POSITIVE_INFINITY : start + typed + (chars.length - 1 - j) * del,
    }))
    start += stays ? chars.length * type : chars.length * (type + del) + pause + TYPE_GAP
    return line
  })
  return { lines, period: Math.max(1, start) }
}

/** Lines typed out, held, deleted and the next typed, in CSS: one clock on
 * the host (`TextType.css`) and every letter shown inside its own time, so
 * the kit clock holds it when directed. Reduced motion shows the first
 * line whole. */
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

  const list = createMemo(() => (props.texts.length ? props.texts : [""]))
  const run = createMemo(() =>
    typedLetters({
      texts: list(),
      typingSpeed: props.typingSpeed,
      deletingSpeed: props.deletingSpeed,
      pause: props.pause,
      loop: props.loop,
    }),
  )
  /** Where the first line stands whole, ms: what reduced motion shows. */
  const rest = createMemo(() => {
    const first = run().lines[0] ?? []
    return first.length ? first[first.length - 1]!.from : 0
  })

  return (
    <span
      class={cn("dk-text-type inline-block whitespace-pre", props.class)}
      style={{
        "--dk-type-period": `${run().period}ms`,
        "--dk-type-span": String(run().period),
        "--dk-type-rest": String(rest() / run().period),
        "--dk-type-lead": `${TYPE_LEAD}ms`,
        "--dk-type-loops": props.loop ? "infinite" : "1",
      }}
      aria-label={list().join(" ")}
    >
      <span aria-hidden="true">
        <For each={run().lines}>
          {(line) => (
            <Index each={line}>
              {(letter) => (
                <span
                  class="dk-type-char"
                  style={{
                    "--dk-from": String(letter().from),
                    "--dk-to": String(Number.isFinite(letter().to) ? letter().to : 1e9),
                  }}
                >
                  {letter().char}
                </span>
              )}
            </Index>
          )}
        </For>
      </span>
      <Show when={props.cursor}>
        <span class="dither-caret" aria-hidden="true">
          |
        </span>
      </Show>
    </span>
  )
}
