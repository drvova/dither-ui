// Generated from @dither-ui/kit/solid/Island.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps } from "solid-js"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.5rem",
    paddingInline: "0.875rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "12px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 40%, transparent)",
      },
    },
  },
  grid: {
    display: "grid",
    transitionProperty: { default: "grid-template-rows", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  box: { minHeight: "0px", overflow: "hidden" },
  box2: {
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
    paddingInline: "0.875rem",
    paddingBlock: "0.625rem",
    fontSize: "11px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
  },
  box3: {
    display: "inline-block",
    overflow: "hidden",
    borderRadius: "1rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 80%, transparent)",
    fontFamily: "var(--font-mono)",
  },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    flexShrink: "0",
    borderRadius: "calc(infinity * 1px)",
    animation: { default: null, "@media (prefers-reduced-motion: reduce)": "none" },
  },
  animatePulse: { animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
  text2: {
    marginLeft: "auto",
    paddingLeft: "0.75rem",
    fontSize: "10px",
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  rotate180: { rotate: "180deg" },
})

export type IslandProps = {
  /** Expanded state (with `onUpdateModelValue`).
   * @docs boolean (with onUpdateModelValue): expanded */
  modelValue?: boolean
  /** @docs string: compact row text */
  label?: string
  /** @docs PixelColor: status dot */
  color?: PixelColor
  /** Pulse the status dot while collapsed.
   * @docs boolean: pulse the dot while collapsed */
  live?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: boolean) => void
  /** The compact row's content, in place of `label`.
   * @docs JSX.Element (children: the detail panel) */
  compact?: JSX.Element
  /** @docs JSX.Element (children: the detail panel) */
  children?: JSX.Element
}

/** Morphing status pill — a compact row that stays visible while the detail
 * panel unfolds beneath it through the house 0fr -> 1fr grid trick. Escape
 * collapses; reduced motion snaps. */
export default function Island(raw: IslandProps) {
  const props = mergeProps({ modelValue: false, label: "Status", color: "green" as PixelColor, live: true }, raw)
  return (
    <div
      class={cn(styles.box3, props.xstyle, props.class)}
      onKeyDown={(e) => e.key === "Escape" && props.onUpdateModelValue?.(false)}
    >
      <button
        type="button"
        {...stylex.props(styles.button)}
        aria-expanded={props.modelValue}
        onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
      >
        <span
          aria-hidden="true"
          class={cn(styles.text, props.live && !props.modelValue ? styles.animatePulse : null)}
          style={{ background: cssColor(props.color) }}
        />
        {props.compact ?? props.label}
        <span aria-hidden="true" class={cn(styles.text2, props.modelValue ? styles.rotate180 : null)}>
          ▾
        </span>
      </button>
      <div {...stylex.props(styles.grid)} style={{ "grid-template-rows": props.modelValue ? "1fr" : "0fr" }}>
        <div {...stylex.props(styles.box)} inert={!props.modelValue}>
          <div {...stylex.props(styles.box2)}>{props.children}</div>
        </div>
      </div>
    </div>
  )
}
