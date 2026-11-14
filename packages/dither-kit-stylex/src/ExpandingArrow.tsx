// Generated from @dither-ui/kit/solid/ExpandingArrow.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, splitProps } from "solid-js"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/ExpandingArrow.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", alignItems: "center" },
  text: {
    height: "3px",
    width: "0px",
    opacity: "0%",
    transitionProperty: { default: "width, opacity", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  grid: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    borderRadius: "var(--radius)",
    fontSize: "14px",
    color: "var(--background)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.75rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    paddingBlock: "0.375rem",
    paddingRight: "0.375rem",
    paddingLeft: "0.875rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
      ":focus-visible": "var(--foreground)",
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
})

/** An accent tile that expands into a dotted-arrow trail on hover or focus —
 * the trail is stamped by a repeating radial gradient in the accent hue and
 * the head tile nudges forward. Reduced motion reveals the trail instantly. */
type Own = {
  /** @docs PixelColor: tile and trail accent */
  color?: PixelColor
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  /** @docs label content
   * @default "Explore the kit" */
  children?: JSX.Element
}
const OWN = ["color", "disabled", "class", "xstyle", "children"] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type ExpandingArrowProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function ExpandingArrow(raw: ExpandingArrowProps) {
  const merged = mergeProps({ color: "blue" as PixelColor, disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  return (
    <button
      type="button"
      {...rest}
      disabled={props.disabled}
      class={cn([styles.button, "dk-arrow"], CONTROL_BUTTON, props.xstyle, props.class)}
    >
      {props.children ?? "Explore the kit"}
      <span aria-hidden="true" {...stylex.props(styles.row)}>
        <span
          class={cn(styles.text, "dk-arrow-trail")}
          style={{
            "background-image": `radial-gradient(circle, ${cssColor(props.color)} 1.5px, transparent 1.5px)`,
            "background-size": "6px 3px",
            "background-position": "center",
          }}
        />
        <span class={cn(styles.grid, "dk-arrow-head")} style={{ background: cssColor(props.color) }}>
          →
        </span>
      </span>
    </button>
  )
}
