import { type Accessor, createContext, createMemo, type JSX, mergeProps, Show } from "solid-js"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import DitherGradient from "./DitherGradient"

export type SidebarVariant = "default" | "floating" | "inset" | "washed"
export type SidebarCollapse = "rail" | "hide" | "none"
export type SidebarDensity = "default" | "compact"

/** True while the sidebar is showing its icon rail — items fold their labels. */
export const SIDEBAR_COLLAPSED = createContext<Accessor<boolean>>(() => false)
/** True when the sidebar asked its items for compact rows. */
export const SIDEBAR_COMPACT = createContext<Accessor<boolean>>(() => false)

export type DitherSidebarProps = {
  /** Collapsed state (with `onUpdateModelValue`). Meaning depends on `collapse` mode. */
  modelValue?: boolean
  onUpdateModelValue?: (collapsed: boolean) => void
  label?: string
  /** default: edge panel · floating: detached card · inset: bare · washed: dither gradient chrome. */
  variant?: SidebarVariant
  /** Which edge it sits on — flips the border. */
  side?: "left" | "right"
  /** rail: folds to icons · hide: folds away entirely · none: no toggle. */
  collapse?: SidebarCollapse
  /** compact tightens rows — dense trees, inspector panels. */
  density?: SidebarDensity
  /** Hide the built-in rail toggle (permanent rail: collapse="rail" + modelValue). */
  toggle?: boolean
  /** Wash color for variant="washed". */
  washColor?: PixelColor
  class?: string
  header?: JSX.Element
  footer?: JSX.Element
  children?: JSX.Element
}

export default function DitherSidebar(raw: DitherSidebarProps) {
  const props = mergeProps(
    {
      modelValue: false,
      label: "Sidebar",
      variant: "default" as SidebarVariant,
      side: "left" as const,
      collapse: "rail" as SidebarCollapse,
      density: "default" as SidebarDensity,
      toggle: true,
      washColor: "blue" as PixelColor,
    },
    raw,
  )

  /** Items only fold labels in rail mode — a hidden sidebar keeps full labels. */
  const railCollapsed = createMemo(() => props.collapse === "rail" && props.modelValue)
  const compact = createMemo(() => props.density === "compact")

  const hidden = createMemo(() => props.collapse === "hide" && props.modelValue)

  const width = createMemo(() => {
    if (hidden()) return "w-0 overflow-hidden border-transparent p-0"
    if (railCollapsed()) return "w-14"
    return "w-56"
  })

  const chrome = createMemo(() => {
    if (props.variant === "floating") return "m-2 h-[calc(100%-1rem)] rounded-lg border border-border/60 bg-card/50"
    if (props.variant === "inset") return "bg-transparent"
    const edge = props.side === "right" ? "border-l" : "border-r"
    if (props.variant === "washed") return ["relative isolate overflow-hidden border-border/60", edge]
    return [edge, "border-border/60 bg-background/40"]
  })

  return (
    <SIDEBAR_COLLAPSED.Provider value={railCollapsed}>
      <SIDEBAR_COMPACT.Provider value={compact}>
        <aside
          aria-label={props.label}
          class={cn(
            "flex h-full shrink-0 flex-col p-2 transition-[width] duration-200 motion-reduce:transition-none",
            chrome(),
            width(),
            props.class,
          )}
        >
          <Show when={props.variant === "washed" && !hidden()}>
            <DitherGradient
              from={props.washColor}
              to="transparent"
              direction="up"
              opacity={0.12}
              cell={4}
              class="-z-10"
            />
          </Show>
          {props.header}
          <nav aria-label={props.label} class="mt-2 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto">
            {props.children}
          </nav>
          {props.footer}
          <Show when={props.collapse === "rail" && props.toggle}>
            <button
              type="button"
              class="mt-2 flex h-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              aria-label={railCollapsed() ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!railCollapsed()}
              onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
            >
              <span class="text-[13px]" aria-hidden="true">
                {railCollapsed() ? (props.side === "right" ? "‹" : "›") : props.side === "right" ? "›" : "‹"}
              </span>
            </button>
          </Show>
        </aside>
      </SIDEBAR_COMPACT.Provider>
    </SIDEBAR_COLLAPSED.Provider>
  )
}
