// Generated from dither-kit/solid/ClickOutside.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { cn, type StyleProp } from "./lib"

/** Fires `outside` when a primary pointer press lands anywhere outside the
 * wrapped content — dropdowns, popovers, dismissing scrims. Listens on
 * `pointerdown` in the capture phase so presses inside nested scroll
 * containers still count; `enabled` gates it without tearing down the node. */
export type ClickOutsideProps = {
  enabled?: boolean
  class?: string
  xstyle?: StyleProp
  onOutside?: (event: Event) => void
  children?: JSX.Element
}

export default function ClickOutside(raw: ClickOutsideProps) {
  const props = mergeProps({ enabled: true }, raw)
  let root: HTMLDivElement | undefined

  function onPointerDown(event: Event) {
    if (!props.enabled || !root) return
    const target = event.target
    if (target instanceof Node && root.contains(target)) return
    props.onOutside?.(event)
  }

  onMount(() => {
    document.addEventListener("pointerdown", onPointerDown, true)
    onCleanup(() => document.removeEventListener("pointerdown", onPointerDown, true))
  })

  return (
    <div ref={(el) => (root = el)} class={cn(null, props.xstyle, props.class)}>
      {props.children}
    </div>
  )
}
