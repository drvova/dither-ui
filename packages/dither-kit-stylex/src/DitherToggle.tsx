// Generated from @dither-ui/kit/solid/DitherToggle.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, Show, splitProps } from "solid-js"
import { kitFromSeed } from "@dither-ui/kit/engine/dither-paint.ts"
import { labelFill, labelPaint, type LabelPaint } from "@dither-ui/kit/engine/label-fill.ts"
import type { Rgb } from "@dither-ui/kit/engine/palette.ts"
import { BAYER4, fillOf, type PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import { LabelFill } from "./runtime/fill-layers"
import { useLabelMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "block", lineHeight: "18px" },
  button: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  borderTransparent: { borderColor: "transparent", color: "#000" },
  borderTransparent2: { borderColor: "transparent", color: "var(--foreground)" },
  borderBorder: {
    borderColor: "var(--border)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})

/** A toggle's fill inside its 1px border: its 18px line and 6px above and
 * below it. */
export const TOGGLE_HEIGHT = 30

/** DitherBadge's rest gradient fill behind the pressed label (the engine's
 * `labelPaint` at its `labelFill` tone): the hue laid over the page with the
 * density as alpha (a pastel on light, a glow on dark), so the theme's own
 * ink reads on it. Shared with DitherToggleGroup. */
export const togglePaint =
  (fill: Rgb, matrix: number[][] = BAYER4) =>
  (rows: number): LabelPaint[] => [labelPaint(fill, "gradient", "straight", matrix, rows)]

type Own = {
  modelValue: boolean
  onUpdateModelValue?: (value: boolean) => void
  /** @default "blue" */
  color?: PixelColor
  seed?: number
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
}
const OWN = [
  "modelValue",
  "onUpdateModelValue",
  "color",
  "seed",
  "disabled",
  "class",
  "xstyle",
  "children",
] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type DitherToggleProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function DitherToggle(raw: DitherToggleProps) {
  const merged = mergeProps({ disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const matrix = useLabelMatrix(() => props.seed)
  // A bright fill takes black ink: white on it would sink under AA.
  const darkInk = createMemo(() => labelFill(fillOf(color()), "gradient", "straight", matrix()).darkInk)

  return (
    <button
      {...rest}
      type="button"
      aria-pressed={props.modelValue}
      disabled={props.disabled}
      class={cn(
        styles.button,
        props.modelValue ? (darkInk() ? styles.borderTransparent : styles.borderTransparent2) : styles.borderBorder,
        props.xstyle,
        props.class,
      )}
      // Its own listener, beside any `onClick` handed in with the rest.
      on:click={() => props.onUpdateModelValue?.(!props.modelValue)}
    >
      <Show when={props.modelValue}>
        <LabelFill paint={togglePaint(fillOf(color()), matrix())} height={TOGGLE_HEIGHT} />
      </Show>
      <span {...stylex.props(styles.frame)}>{props.children}</span>
    </button>
  )
}
