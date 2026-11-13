// Generated from dither-kit/solid/Overlay.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  fixed: { position: "fixed", inset: "0px", zIndex: "40" },
  pointerEventsAuto: { pointerEvents: "auto" },
  pointerEventsNone: { pointerEvents: "none" },
  dimsSoft: { backgroundColor: "color-mix(in oklab, var(--background) 20%, transparent)" },
  dimsMedium: { backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)" },
  dimsStrong: { backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)" },
})

type Own = {
  dim?: "none" | "soft" | "medium" | "strong"
  interactive?: boolean
  class?: string
  xstyle?: StyleProp
}

/** Listeners (a dismissable scrim's click) and attributes reach the layer. */
export type OverlayProps = Own & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own>

const DIMS = {
  none: null,
  soft: styles.dimsSoft,
  medium: styles.dimsMedium,
  strong: styles.dimsStrong,
} as const

/** Full-cover layer primitive: fixed dim over the app (dialogs, drawers, busy
 * states). Decorative and click-transparent by default; flip `interactive` to
 * make it catch pointer events (dismissable scrims), which also lifts the
 * aria-hidden so its children stay reachable. */
export default function Overlay(raw: OverlayProps) {
  const merged = mergeProps({ dim: "soft" as const, interactive: false }, raw)
  const [props, rest] = splitProps(merged, ["dim", "interactive", "class", "xstyle", "children"])
  const classes = createMemo(() =>
    cn(
      styles.fixed,
      DIMS[props.dim],
      props.interactive ? styles.pointerEventsAuto : styles.pointerEventsNone,
      props.xstyle,
      props.class,
    ),
  )
  return (
    <div {...rest} class={classes()} aria-hidden={props.interactive ? undefined : "true"}>
      {props.children}
    </div>
  )
}
