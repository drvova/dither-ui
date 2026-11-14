import { createMemo, For, Index, mergeProps, Show } from "solid-js"
import { formatFixed } from "../engine/format-number"
import { cn } from "../tailwind/lib"

/** Odometer for live values — each digit rides a 0-9 column that rolls to the
 * new figure whenever `value` changes. Separators stay put. Reduced motion
 * snaps columns without the roll. */
export type NumberFlowProps = {
  /** @default required */
  value: number
  decimals?: number
  /** Roll time per change, ms.
   * @docs number (ms): roll time per change */
  duration?: number
  /** @default undefined */
  class?: string
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

export default function NumberFlow(raw: NumberFlowProps) {
  const props = mergeProps({ decimals: 0, duration: 600 }, raw)

  const chars = createMemo(() => formatFixed(props.value, props.decimals).split(""))

  // Columns are kept by place, and all made anew when the figure changes
  // length.
  return (
    <span class={cn("inline-flex tabular-nums", props.class)} aria-live="polite">
      <span class="sr-only">{chars().join("")}</span>
      <For each={[chars().length]}>
        {() => (
          <Index each={chars()}>
            {(c) => (
              <Show
                when={/\d/.test(c())}
                fallback={
                  <span aria-hidden="true" class="leading-none">
                    {c()}
                  </span>
                }
              >
                <span aria-hidden="true" class="inline-block h-[1em] overflow-hidden">
                  <span
                    class="grid transition-transform ease-out motion-reduce:transition-none"
                    style={{
                      transform: `translateY(-${Number(c())}em)`,
                      "transition-duration": `${props.duration}ms`,
                    }}
                  >
                    <For each={DIGITS}>{(d) => <span class="h-[1em] leading-none">{d}</span>}</For>
                  </span>
                </span>
              </Show>
            )}
          </Index>
        )}
      </For>
    </span>
  )
}
