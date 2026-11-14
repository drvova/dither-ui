import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar"

export type DitherRailProps = {
  /** @docs string (aria-label for the nav landmark) */
  label?: string
  /** Which edge it sits on — flips the border.
   * @docs "left" | "right" (flips the border edge) */
  side?: "left" | "right"
  class?: string
  /** @docs JSX.Element (children: items, labels fold automatically) */
  header?: JSX.Element
  /** @docs JSX.Element (children: items, labels fold automatically) */
  footer?: JSX.Element
  /** @docs JSX.Element (children: items, labels fold automatically) */
  children?: JSX.Element
}

/** Permanent icon rail — the whole nav in 56px. Provides the sidebar's
 * collapsed context, so DitherSidebarItem children fold their labels
 * automatically; wrap items in DitherTooltip to carry the labels. */
export default function DitherRail(raw: DitherRailProps) {
  const props = mergeProps({ label: "Rail", side: "left" as const }, raw)

  const edge = createMemo(() => (props.side === "right" ? "border-l" : "border-r"))

  return (
    <SIDEBAR_COLLAPSED.Provider value={() => true}>
      <SIDEBAR_COMPACT.Provider value={() => false}>
        <aside
          aria-label={props.label}
          class={cn("flex h-full w-14 shrink-0 flex-col p-2", edge(), "border-border/60 bg-background/40", props.class)}
        >
          {props.header}
          <nav aria-label={props.label} class="mt-2 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto">
            {props.children}
          </nav>
          {props.footer}
        </aside>
      </SIDEBAR_COMPACT.Provider>
    </SIDEBAR_COLLAPSED.Provider>
  )
}
