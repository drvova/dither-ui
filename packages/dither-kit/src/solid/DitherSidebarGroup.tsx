import { type JSX, Match, Switch, useContext } from "solid-js"
import { SIDEBAR_COLLAPSED } from "./DitherSidebar"

export type DitherSidebarGroupProps = { label?: string; children?: JSX.Element }

/** Labelled cluster of sidebar items. On the icon rail the label folds into
 * a hairline separator so the grouping survives the collapse. */
export default function DitherSidebarGroup(props: DitherSidebarGroupProps) {
  const collapsed = useContext(SIDEBAR_COLLAPSED)

  return (
    <div class="mt-4 first:mt-0" role="group" aria-label={props.label}>
      <Switch>
        <Match when={props.label && !collapsed()}>
          <div class="px-2.5 pb-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{props.label}</div>
        </Match>
        <Match when={props.label && collapsed()}>
          <div aria-hidden="true" class="mx-2.5 mb-1.5 h-px bg-border/60" />
        </Match>
      </Switch>
      <div class="grid gap-0.5">{props.children}</div>
    </div>
  )
}
