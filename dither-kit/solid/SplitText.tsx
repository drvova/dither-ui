import { createMemo, For, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./SplitText.css"

export type SplitTextProps = {
  text?: string
  stagger?: number
  duration?: number
  replayToken?: number
  class?: string
}

export default function SplitText(raw: SplitTextProps) {
  const props = mergeProps({ text: "Split text", stagger: 40, duration: 600 }, raw)

  const chars = createMemo(() => [...props.text])
  // A key that changes on replay so the enter animation runs again.
  const runKey = createMemo(() => `${props.text}-${props.replayToken ?? 0}`)
  // A new element per key: what the key on the root did.
  const run = createMemo(() => {
    runKey()
    return (
      <span class={cn("inline-block", props.class)} aria-label={props.text}>
        <For each={chars()}>
          {(ch, i) => (
            <span
              aria-hidden="true"
              class="dither-split-char"
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
    )
  })

  return <>{run()}</>
}
