// Generated from @dither-ui/kit/solid/Portal.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, Show } from "solid-js"
import { Portal as Teleport } from "solid-js/web"

/** Teleport by name: renders the slot elsewhere in the DOM (dialogs, popovers,
 * toasts escaping `overflow: hidden`). Defaults to `body`; `disabled` renders
 * in place — the SSR/no-portal switch; `defer` waits for the rest of the
 * render, so the target may come later in the same template. */
export type PortalProps = {
  /** @docs string (selector) */
  to?: string
  disabled?: boolean
  /** Solid mounts a portal after the render it is in, so the target may
   * always come later: kept so a caller written for a deferred portal still types.
   * @docs boolean (the target may come later in the markup) */
  defer?: boolean
  /** @docs content */
  children?: JSX.Element
}

export default function Portal(raw: PortalProps) {
  const props = mergeProps({ to: "body", disabled: false, defer: false }, raw)
  return (
    <Show when={!props.disabled} fallback={props.children}>
      <Teleport mount={document.querySelector(props.to) ?? undefined}>{props.children}</Teleport>
    </Show>
  )
}
