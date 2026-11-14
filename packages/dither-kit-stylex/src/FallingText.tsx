// Generated from @dither-ui/kit/solid/FallingText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/FallingText.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { display: "inline-block" },
})

export type FallingTextProps = {
  text?: string
  /** @docs number (ms) */
  stagger?: number
  /** @docs number (ms) */
  duration?: number
  /** @default 0 */
  replayToken?: number
  class?: string
  xstyle?: StyleProp
}

export default function FallingText(raw: FallingTextProps) {
  const props = mergeProps({ text: "Falling text", stagger: 45, duration: 700 }, raw)

  const chars = createMemo(() => [...props.text])
  const runKey = createMemo(() => `${props.text}-${props.replayToken ?? 0}`)

  // Keyed on the run: a new text or token makes the line anew, so it falls again.
  return (
    <Show when={runKey()} keyed>
      {(_run) => (
        <span class={cn(styles.text, props.xstyle, props.class)} aria-label={props.text}>
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
