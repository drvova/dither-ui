// Generated from dither-kit/solid/DitherRail.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  nav: {
    marginTop: "0.5rem",
    display: "grid",
    minHeight: "0px",
    flex: "1",
    alignContent: "flex-start",
    gap: "0.125rem",
    overflowY: "auto",
  },
  aside: {
    display: "flex",
    height: "100%",
    width: "3.5rem",
    flexShrink: "0",
    flexDirection: "column",
    padding: "0.5rem",
  },
  aside2: {
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
  },
  borderL: { borderLeftStyle: "solid", borderLeftWidth: "1px" },
  borderR: { borderRightStyle: "solid", borderRightWidth: "1px" },
})

export type DitherRailProps = {
  label?: string
  /** Which edge it sits on — flips the border. */
  side?: "left" | "right"
  class?: string
  xstyle?: StyleProp
  header?: JSX.Element
  footer?: JSX.Element
  children?: JSX.Element
}

/** Permanent icon rail — the whole nav in 56px. Provides the sidebar's
 * collapsed context, so DitherSidebarItem children fold their labels
 * automatically; wrap items in DitherTooltip to carry the labels. */
export default function DitherRail(raw: DitherRailProps) {
  const props = mergeProps({ label: "Rail", side: "left" as const }, raw)

  const edge = createMemo(() => (props.side === "right" ? styles.borderL : styles.borderR))

  return (
    <SIDEBAR_COLLAPSED.Provider value={() => true}>
      <SIDEBAR_COMPACT.Provider value={() => false}>
        <aside aria-label={props.label} class={cn(styles.aside, edge(), styles.aside2, props.xstyle, props.class)}>
          {props.header}
          <nav {...stylex.props(styles.nav)}>{props.children}</nav>
          {props.footer}
        </aside>
      </SIDEBAR_COMPACT.Provider>
    </SIDEBAR_COLLAPSED.Provider>
  )
}
