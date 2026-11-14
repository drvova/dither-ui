// Generated from @dither-ui/kit/solid/DitherSidebar.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type Accessor, createContext, createMemo, type JSX, mergeProps, Show } from "solid-js"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import DitherGradient from "./DitherGradient"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  gradient: { zIndex: "-10" },
  nav: {
    marginTop: "0.5rem",
    display: "grid",
    minHeight: "0px",
    flex: "1",
    alignContent: "flex-start",
    gap: "0.125rem",
    overflowY: "auto",
  },
  button: {
    marginTop: "0.5rem",
    display: "flex",
    height: "2rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--card)" } },
  },
  text: { fontSize: "13px" },
  aside: {
    display: "flex",
    height: "100%",
    flexShrink: "0",
    flexDirection: "column",
    padding: "0.5rem",
    transitionProperty: { default: "width", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  width: { width: "0px", overflow: "hidden", borderColor: "transparent", padding: "0px" },
  width2: { width: "3.5rem" },
  width3: { width: "14rem" },
  chrome: {
    margin: "0.5rem",
    height: "calc(100% - 1rem)",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 50%, transparent)",
  },
  chrome2: { backgroundColor: "transparent" },
  chrome3: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  chrome4: {
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
  },
  borderL: { borderLeftStyle: "solid", borderLeftWidth: "1px" },
  borderR: { borderRightStyle: "solid", borderRightWidth: "1px" },
})

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
  xstyle?: StyleProp
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
    if (hidden()) return styles.width
    if (railCollapsed()) return styles.width2
    return styles.width3
  })

  const chrome = createMemo(() => {
    if (props.variant === "floating") return styles.chrome
    if (props.variant === "inset") return styles.chrome2
    const edge = props.side === "right" ? styles.borderL : styles.borderR
    if (props.variant === "washed") return [styles.chrome3, edge]
    return [edge, styles.chrome4]
  })

  return (
    <SIDEBAR_COLLAPSED.Provider value={railCollapsed}>
      <SIDEBAR_COMPACT.Provider value={compact}>
        <aside aria-label={props.label} class={cn(styles.aside, chrome(), width(), props.xstyle, props.class)}>
          <Show when={props.variant === "washed" && !hidden()}>
            <DitherGradient
              from={props.washColor}
              to="transparent"
              direction="up"
              opacity={0.12}
              cell={4}
              xstyle={styles.gradient}
            />
          </Show>
          {props.header}
          <nav aria-label={props.label} {...stylex.props(styles.nav)}>
            {props.children}
          </nav>
          {props.footer}
          <Show when={props.collapse === "rail" && props.toggle}>
            <button
              type="button"
              {...stylex.props(styles.button)}
              aria-label={railCollapsed() ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!railCollapsed()}
              onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
            >
              <span {...stylex.props(styles.text)} aria-hidden="true">
                {railCollapsed() ? (props.side === "right" ? "‹" : "›") : props.side === "right" ? "›" : "‹"}
              </span>
            </button>
          </Show>
        </aside>
      </SIDEBAR_COMPACT.Provider>
    </SIDEBAR_COLLAPSED.Provider>
  )
}
