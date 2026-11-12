import { createMemo, For, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import "./Shuffle.css"

export type ShuffleProps = {
  text?: string
  stagger?: number
  duration?: number
  replayToken?: number
  class?: string
}

// Deterministic per-character random offset so the shuffle is stable per render.
function seeded(i: number, salt: number) {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return s - Math.floor(s)
}

export default function Shuffle(raw: ShuffleProps) {
  const props = mergeProps({ text: "Shuffle in", stagger: 55, duration: 650 }, raw)

  const chars = createMemo(() =>
    [...props.text].map((ch, i) => ({
      ch: ch === " " ? " " : ch,
      dx: (seeded(i, 1) - 0.5) * 2, // -1..1 em
      dy: (seeded(i, 2) - 0.5) * 1.4,
      rot: (seeded(i, 3) - 0.5) * 40,
    })),
  )
  const runKey = createMemo(() => `${props.text}-${props.replayToken ?? 0}`)

  // Keyed on the run: a new text or token makes the line anew, so it shuffles in again.
  return (
    <Show when={runKey()} keyed>
      {(_run) => (
        <span class={cn("inline-block", props.class)} aria-label={props.text}>
          <For each={chars()}>
            {(c, i) => (
              <span
                aria-hidden="true"
                class="dither-shuffle-char"
                style={{
                  "animation-delay": `${i() * props.stagger}ms`,
                  "animation-duration": `${props.duration}ms`,
                  "--dx": `${c.dx}em`,
                  "--dy": `${c.dy}em`,
                  "--rot": `${c.rot}deg`,
                }}
              >
                {c.ch}
              </span>
            )}
          </For>
        </span>
      )}
    </Show>
  )
}
