// Generated from ../solid/DitherSidebarGroup.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, Match, Switch, useContext } from "solid-js"
import { SIDEBAR_COLLAPSED } from "./DitherSidebar"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { marginTop: { default: "1rem", ":first-child": "0px" } },
  box2: {
    paddingInline: "0.625rem",
    paddingBottom: "0.375rem",
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  box3: {
    marginInline: "0.625rem",
    marginBottom: "0.375rem",
    height: "1px",
    backgroundColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  grid: { display: "grid", gap: "0.125rem" },
})

export type DitherSidebarGroupProps = { label?: string; children?: JSX.Element }

/** Labelled cluster of sidebar items. On the icon rail the label folds into
 * a hairline separator so the grouping survives the collapse. */
export default function DitherSidebarGroup(props: DitherSidebarGroupProps) {
  const collapsed = useContext(SIDEBAR_COLLAPSED)

  return (
    <div {...stylex.props(styles.box)} role="group" aria-label={props.label}>
      <Switch>
        <Match when={props.label && !collapsed()}>
          <div {...stylex.props(styles.box2)}>{props.label}</div>
        </Match>
        <Match when={props.label && collapsed()}>
          <div aria-hidden="true" {...stylex.props(styles.box3)} />
        </Match>
      </Switch>
      <div {...stylex.props(styles.grid)}>{props.children}</div>
    </div>
  )
}
