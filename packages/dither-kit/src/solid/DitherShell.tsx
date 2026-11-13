import { children, type JSX, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"

/** App frame: topbar over an aside + content pair, optional statusbar under.
 * Regions render only when their slot is filled — the grid adapts. */
export type DitherShellProps = {
  /** true draws the embedded card chrome — border, rounding, clip. */
  frame?: boolean
  class?: string
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
    <div
      class={cn(
        "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-background text-foreground",
        props.frame && "overflow-hidden rounded-lg border border-border/60",
        props.class,
      )}
    >
      <Show when={topbar()} fallback={<div aria-hidden="true" />}>
        <header class="flex items-center border-b border-border/60">{topbar()}</header>
      </Show>
      <div class="grid min-h-0 grid-cols-[auto_minmax(0,1fr)]">
        {aside()}
        <main class={cn("min-h-0 min-w-0", !aside() && "col-span-2")}>{props.children}</main>
      </div>
      <Show when={statusbar()} fallback={<div aria-hidden="true" />}>
        <footer class="flex items-center border-t border-border/60">{statusbar()}</footer>
      </Show>
    </div>
  )
}
