// Generated from @dither-ui/kit/solid/DitherSidebarSub.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { children, createUniqueId, type JSX, mergeProps, Show, useContext } from "solid-js"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar"
import { cn } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid", width: "1rem", height: "1rem", flexShrink: "0", placeItems: "center" },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "1px",
    backgroundColor: "currentcolor",
    opacity: "70%",
  },
  text2: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  box: { overflow: "hidden" },
  grid2: {
    marginLeft: "1.125rem",
    display: "grid",
    gap: "0.125rem",
    borderLeftStyle: "solid",
    borderLeftWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingBlock: "0.125rem",
    paddingLeft: "0.375rem",
  },
  flex: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    borderRadius: "var(--radius)",
    textAlign: "left",
    fontFamily: "var(--font-mono)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
  h7: { height: "1.75rem", gap: "0.5rem", paddingInline: "0.5rem", fontSize: "11px" },
  h8: { height: "2rem", gap: "0.625rem", paddingInline: "0.625rem", fontSize: "12px" },
  text11px: {
    fontSize: "11px",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  rotate90: { rotate: "90deg" },
  grid3: {
    display: "grid",
    transitionProperty: { default: "grid-template-rows", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  gridRows1fr: { gridTemplateRows: "1fr" },
  gridRows0fr: { gridTemplateRows: "0fr" },
})

export type DitherSidebarSubProps = {
  /** Open state (with `onUpdateModelValue`).
   * @docs boolean (with onUpdateModelValue) */
  modelValue?: boolean
  label: string
  onUpdateModelValue?: (open: boolean) => void
  /** Leading icon; a small square without one. */
  icon?: JSX.Element
  /** @docs content */
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
        class={cn([styles.flex, compact() ? styles.h7 : styles.h8])}
        onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
      >
        <span {...stylex.props(styles.grid)} aria-hidden="true">
          <Show when={icon()} fallback={<span {...stylex.props(styles.text)} />}>
            {icon()}
          </Show>
        </span>
        <Show when={!collapsed()}>
          <span {...stylex.props(styles.text2)}>{props.label}</span>
          <span aria-hidden="true" class={cn([styles.text11px, props.modelValue ? styles.rotate90 : null])}>
            ›
          </span>
        </Show>
      </button>
      <Show when={!collapsed()}>
        <div id={id} class={cn([styles.grid3, props.modelValue ? styles.gridRows1fr : styles.gridRows0fr])}>
          <div {...stylex.props(styles.box)} inert={!props.modelValue}>
            <div {...stylex.props(styles.grid2)}>{props.children}</div>
          </div>
        </div>
      </Show>
    </div>
  )
}
