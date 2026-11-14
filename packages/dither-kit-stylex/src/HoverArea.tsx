// Generated from @dither-ui/kit/solid/HoverArea.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, splitProps } from "solid-js"

/** Hover (and keyboard focus) state as scoped-slot data — no refs, no manual
 * listeners. Focus is tracked alongside the pointer so keyboard users get the
 * same reveal, which is the whole point of exposing the state at all.
 * `class` and other attrs fall through to the block untouched. */
export type HoverAreaScope = { readonly hovered: boolean; readonly focused: boolean }
export type HoverAreaProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  /** @docs ({ hovered, focused }) => JSX.Element */
  children?: (scope: HoverAreaScope) => JSX.Element
}

export default function HoverArea(raw: HoverAreaProps) {
  const [props, rest] = splitProps(raw, ["children"])
  const [hovered, setHovered] = createSignal(false)
  const [focused, setFocused] = createSignal(false)

  // Read through getters, so what the slot renders from them follows them.
  const scope: HoverAreaScope = {
    get hovered() {
      return hovered()
    },
    get focused() {
      return focused()
    },
  }

  // Its own listeners sit beside any the caller hands the block.
  return (
    <div
      {...rest}
      on:pointerenter={() => setHovered(true)}
      on:pointerleave={() => setHovered(false)}
      on:focusin={() => setFocused(true)}
      on:focusout={() => setFocused(false)}
    >
      {props.children?.(scope)}
    </div>
  )
}
