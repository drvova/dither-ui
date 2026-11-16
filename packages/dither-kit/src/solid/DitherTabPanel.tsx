import { createMemo, type JSX, onMount, useContext } from "solid-js"
import { cn } from "../tailwind/lib"
import { TABS_CTX } from "./DitherTabs"

export type DitherTabPanelProps = {
  /** @docs string (nests inside DitherTabs) */
  value: string
  class?: string
  /** @docs content */
  children?: JSX.Element
}

/** The panel half of the tabs pattern — id-linked to its tab, kept mounted
 * (hidden by `display`) so canvas-heavy content does not repaint on every
 * switch. */
export default function DitherTabPanel(props: DitherTabPanelProps) {
  const ctx = useContext(TABS_CTX) ?? null
  const active = createMemo(() => ctx?.active() === props.value)
  onMount(() => ctx?.hold(props.value))

  return (
    <div
      id={ctx ? `${ctx.idBase}-panel-${props.value}` : undefined}
      role="tabpanel"
      aria-labelledby={ctx ? `${ctx.idBase}-tab-${props.value}` : undefined}
      class={cn(props.class)}
      style={{ display: active() ? undefined : "none" }}
    >
      {props.children}
    </div>
  )
}
