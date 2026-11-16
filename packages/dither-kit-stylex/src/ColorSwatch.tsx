// Generated from @dither-ui/kit/solid/ColorSwatch.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    scale: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "105% 105%",
        "@media (prefers-reduced-motion: reduce)": { default: null, "@media (hover: hover)": "100% 100%" },
      },
    },
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  ring2: {
    boxShadow: "0 0 0 2px var(--background), 0 0 0 calc(2px + 2px) color-mix(in oklab, var(--accent) 70%, transparent)",
  },
})

type Own = {
  /** @docs string (css color) */
  color?: string
  /** @docs string (aria name)
   * @default the color */
  label?: string
  /** @docs boolean (ring)
   * @default false */
  selected?: boolean
  /** @docs number (px) */
  size?: number
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onSelect?: (color: string) => void
}
const OWN = [
  "color",
  "label",
  "selected",
  "size",
  "disabled",
  "class",
  "xstyle",
  "onSelect",
] as const satisfies readonly (keyof Own)[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type ColorSwatchProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

/** One color as a pickable chip: a real button with the color in its
 * accessible name, selected state ring, keyboard focus ring. Pure display
 * when no `select` listener is wired. */
export default function ColorSwatch(raw: ColorSwatchProps) {
  const merged = mergeProps({ color: "#5227FF", size: 24, disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  const name = createMemo(() => props.label ?? props.color)
  return (
    <button
      {...rest}
      type="button"
      aria-label={`Select ${name()}`}
      aria-pressed={props.selected}
      disabled={props.disabled}
      style={{ background: props.color, width: `${props.size}px`, height: `${props.size}px` }}
      class={cn(styles.button, props.selected && styles.ring2, props.xstyle, props.class)}
      // Its own listener, beside any `onClick` handed in with the rest.
      on:click={() => props.onSelect?.(props.color)}
    />
  )
}
