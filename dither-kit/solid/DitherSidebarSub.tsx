import { children, createUniqueId, type JSX, mergeProps, Show, useContext } from "solid-js"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar"

export type DitherSidebarSubProps = {
  label: string
  /** Open state (with `onUpdateModelValue`). */
  modelValue?: boolean
  onUpdateModelValue?: (open: boolean) => void
  /** Leading icon; a small square without one. */
  icon?: JSX.Element
  children?: JSX.Element
}

/** Collapsible sub-menu: a parent row plus indented children behind a rail.
 * On the icon rail only the parent icon remains (children need the width). */
export default function DitherSidebarSub(raw: DitherSidebarSubProps) {
  const props = mergeProps({ modelValue: false }, raw)

  const icon = children(() => props.icon)
  const collapsed = useContext(SIDEBAR_COLLAPSED)
  const compact = useContext(SIDEBAR_COMPACT)
  const id = `dk-sidebar-sub-${createUniqueId()}`

  return (
    <div>
      <button
        type="button"
        aria-expanded={props.modelValue}
        aria-controls={id}
        title={collapsed() ? props.label : undefined}
        class={`flex w-full items-center rounded-md text-left font-mono text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground ${
          compact() ? "h-7 gap-2 px-2 text-[11px]" : "h-8 gap-2.5 px-2.5 text-[12px]"
        }`}
        onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
      >
        <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
          <Show when={icon()} fallback={<span class="size-1.5 rounded-[1px] bg-current opacity-70" />}>
            {icon()}
          </Show>
        </span>
        <Show when={!collapsed()}>
          <span class="min-w-0 flex-1 truncate">{props.label}</span>
          <span
            aria-hidden="true"
            class={`text-[11px] transition-transform duration-200 motion-reduce:transition-none ${
              props.modelValue ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
        </Show>
      </button>
      <Show when={!collapsed()}>
        <div
          id={id}
          class={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${
            props.modelValue ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div class="overflow-hidden" inert={!props.modelValue}>
            <div class="ml-4.5 grid gap-0.5 border-l border-border/60 py-0.5 pl-1.5">{props.children}</div>
          </div>
        </div>
      </Show>
    </div>
  )
}
