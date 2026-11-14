import { children, createSignal, type JSX, mergeProps, onMount, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

/** App frame: topbar over an aside + content pair, optional statusbar under.
 * Regions render only when their slot is filled — the grid adapts. Its
 * content is the page's main; inside a page's own main (a docs preview, an
 * embedded frame) it is a plain block, the same nodes moved, never
 * remounted: a page holds one main. */
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
  const content = children(() => props.children)
  let root: HTMLDivElement | undefined
  const [nested, setNested] = createSignal(false)
  onMount(() => setNested(!!root?.parentElement?.closest("main,[role=main]")))

  return (
    <div
      ref={(el) => (root = el)}
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
        <Dynamic component={nested() ? "div" : "main"} class={cn("min-h-0 min-w-0", !aside() && "col-span-2")}>
          {content()}
        </Dynamic>
      </div>
      <Show when={statusbar()} fallback={<div aria-hidden="true" />}>
        <footer class="flex items-center border-t border-border/60">{statusbar()}</footer>
      </Show>
    </div>
  )
}
