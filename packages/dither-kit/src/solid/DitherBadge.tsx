import { createMemo, type JSX } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { labelFill, labelPaint, type LabelVariant } from "../engine/label-fill"
import { fillOf, type PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { LabelFill } from "./runtime/fill-layers"
import { useLabelMatrix } from "./runtime/screen"

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
    <span
      class={cn(
        "relative isolate inline-flex items-center overflow-hidden rounded px-2 py-0.5 font-mono text-[10px] text-foreground",
        label().darkInk && "text-black",
        props.class,
      )}
    >
      <LabelFill paint={paint} height={HEIGHT} />
      <span class="leading-4">{props.children}</span>
    </span>
  )
}
