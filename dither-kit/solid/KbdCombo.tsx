import { createMemo, Index, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherKbd from "./DitherKbd"

export type KbdComboProps = { keys?: string[]; separator?: string; class?: string }

/** A key combo as one readable unit: `["⌘", "K"]` renders ⌘ + K with the
 * separators Kbd uses — single keys go through DitherKbd directly. */
export default function KbdCombo(raw: KbdComboProps) {
  const props = mergeProps({ keys: ["⌘", "K"], separator: "+" }, raw)

  const list = createMemo(() => props.keys.filter(Boolean))

  return (
    <span class={cn("inline-flex items-center gap-1", props.class)} aria-label="Keyboard shortcut">
      <Index each={list()}>
        {(k, i) => (
          <>
            <DitherKbd>{k()}</DitherKbd>
            <Show when={i < list().length - 1}>
              <span class="text-muted-foreground/70" aria-hidden="true">
                {props.separator}
              </span>
            </Show>
          </>
        )}
      </Index>
    </span>
  )
}
