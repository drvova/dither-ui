// Generated from @dither-ui/kit/solid/DitherBadge.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX } from "solid-js"
import { kitFromSeed } from "@dither-ui/kit/engine/dither-paint.ts"
import { labelFill, labelPaint, type LabelVariant } from "@dither-ui/kit/engine/label-fill.ts"
import { fillOf, type PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import { LabelFill } from "./runtime/fill-layers"
import { useLabelMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { lineHeight: "1rem" },
  row: {
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "0.25rem",
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--foreground)",
  },
  textBlack: { color: "#000" },
})

export type BadgeVariant = LabelVariant

/** The badge's height: its 16px line and 2px above and below it. */
const HEIGHT = 20

export type DitherBadgeProps = {
  /** @default "blue" */
  color?: PixelColor
  /** @docs "gradient" | "solid" | "dotted" | "hatched"
   * @default "gradient" */
  variant?: BadgeVariant
  seed?: number
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

export default function DitherBadge(props: DitherBadgeProps) {
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const matrix = useLabelMatrix(() => props.seed)
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const variant = createMemo<BadgeVariant>(() => props.variant ?? s()?.variant ?? "gradient")
  // The fill's tone and its label's ink, together at AA (a bright fill
  // takes black ink: the theme's would sink under AA), printed by tone
  // classes on the server.
  const label = createMemo(() => labelFill(fillOf(color()), variant(), "straight", matrix()))
  const paint = (rows: number) => [labelPaint(fillOf(color()), variant(), "straight", matrix(), rows)]

  return (
    <span class={cn(styles.row, label().darkInk && styles.textBlack, props.xstyle, props.class)}>
      <LabelFill paint={paint} height={HEIGHT} />
      <span {...stylex.props(styles.text)}>{props.children}</span>
    </span>
  )
}
