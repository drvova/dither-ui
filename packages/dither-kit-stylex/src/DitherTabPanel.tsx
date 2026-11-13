// Generated from @dither-ui/kit/solid/DitherTabPanel.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, useContext } from "solid-js"
import { cn, type StyleProp } from "./lib"
import { TABS_CTX } from "./DitherTabs"

export type DitherTabPanelProps = { value: string; class?: string; xstyle?: StyleProp; children?: JSX.Element }

/** The panel half of the tabs pattern — id-linked to its tab, kept mounted
 * (hidden by `display`) so canvas-heavy content does not repaint on every
 * switch. */
export default function DitherTabPanel(props: DitherTabPanelProps) {
  const ctx = useContext(TABS_CTX) ?? null
  const active = createMemo(() => ctx?.active() === props.value)

  return (
    <div
      id={ctx ? `${ctx.idBase}-panel-${props.value}` : undefined}
      role="tabpanel"
      aria-labelledby={ctx ? `${ctx.idBase}-tab-${props.value}` : undefined}
      class={cn(props.xstyle, props.class)}
      style={{ display: active() ? undefined : "none" }}
    >
      {props.children}
    </div>
  )
}
