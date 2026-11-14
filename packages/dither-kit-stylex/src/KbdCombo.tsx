// Generated from @dither-ui/kit/solid/KbdCombo.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, Index, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherKbd from "./DitherKbd"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)" },
  row: { display: "inline-flex", alignItems: "center", gap: "0.25rem" },
})

export type KbdComboProps = {
  /** @default ['⌘', 'K'] */
  keys?: string[]
  separator?: string
  class?: string
  xstyle?: StyleProp
}

/** A key combo as one readable unit: `["⌘", "K"]` renders ⌘ + K with the
 * separators Kbd uses — single keys go through DitherKbd directly. */
export default function KbdCombo(raw: KbdComboProps) {
  const props = mergeProps({ keys: ["⌘", "K"], separator: "+" }, raw)

  const list = createMemo(() => props.keys.filter(Boolean))

  return (
    <span class={cn(styles.row, props.xstyle, props.class)} aria-label="Keyboard shortcut">
      <Index each={list()}>
        {(k, i) => (
          <>
            <DitherKbd>{k()}</DitherKbd>
            <Show when={i < list().length - 1}>
              <span {...stylex.props(styles.text)} aria-hidden="true">
                {props.separator}
              </span>
            </Show>
          </>
        )}
      </Index>
    </span>
  )
}
