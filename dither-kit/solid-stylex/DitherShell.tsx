// Generated from ../solid/DitherShell.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { children, type JSX, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  header: {
    display: "flex",
    alignItems: "center",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  grid: { display: "grid", minHeight: "0px", gridTemplateColumns: "auto minmax(0,1fr)" },
  footer: {
    display: "flex",
    alignItems: "center",
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  grid2: {
    display: "grid",
    height: "100%",
    minHeight: "0px",
    gridTemplateRows: "auto minmax(0,1fr) auto",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  overflowHidden: {
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  main: { minHeight: "0px", minWidth: "0px" },
  colSpan2: { gridColumn: "span 2 / span 2" },
})

/** App frame: topbar over an aside + content pair, optional statusbar under.
 * Regions render only when their slot is filled — the grid adapts. */
export type DitherShellProps = {
  /** true draws the embedded card chrome — border, rounding, clip. */
  frame?: boolean
  class?: string
  xstyle?: StyleProp
  topbar?: JSX.Element
  aside?: JSX.Element
  statusbar?: JSX.Element
  children?: JSX.Element
}

export default function DitherShell(raw: DitherShellProps) {
  const props = mergeProps({ frame: false }, raw)
  const topbar = children(() => props.topbar)
  const aside = children(() => props.aside)
  const statusbar = children(() => props.statusbar)

  return (
    <div class={cn(styles.grid2, props.frame && styles.overflowHidden, props.xstyle, props.class)}>
      <Show when={topbar()} fallback={<div aria-hidden="true" />}>
        <header {...stylex.props(styles.header)}>{topbar()}</header>
      </Show>
      <div {...stylex.props(styles.grid)}>
        {aside()}
        <main class={cn(styles.main, !aside() && styles.colSpan2)}>{props.children}</main>
      </div>
      <Show when={statusbar()} fallback={<div aria-hidden="true" />}>
        <footer {...stylex.props(styles.footer)}>{statusbar()}</footer>
      </Show>
    </div>
  )
}
