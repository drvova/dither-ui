import { createMemo, For, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import "./FallingText.css"

export type FallingTextProps = {
  text?: string
  /** @docs number (ms) */
  stagger?: number
  /** @docs number (ms) */
  duration?: number
  /** @default 0 */
  replayToken?: number
  class?: string
}

export default function FallingText(raw: FallingTextProps) {
  const props = mergeProps({ text: "Falling text", stagger: 45, duration: 700 }, raw)

  const chars = createMemo(() => [...props.text])
  const runKey = createMemo(() => `${props.text}-${props.replayToken ?? 0}`)

  // Keyed on the run: a new text or token makes the line anew, so it falls again.
  return (
    <Show when={runKey()} keyed>
      {(_run) => (
        <span class={cn("inline-block", props.class)} aria-label={props.text}>
          <For each={chars()}>
            {(ch, i) => (
              <span
                aria-hidden="true"
                class="dither-fall-char"
                style={{
                  "animation-delay": `${i() * props.stagger}ms`,
                  "animation-duration": `${props.duration}ms`,
                }}
              >
                {ch === " " ? " " : ch}
              </span>
            )}
          </For>
        </span>
      )}
    </Show>
  )
}
