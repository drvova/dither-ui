import { createMemo, type JSX, mergeProps, Show, splitProps } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { labelFill, labelPaint, type LabelPaint } from "../engine/label-fill"
import type { Rgb } from "../engine/palette"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { LabelFill } from "./runtime/fill-layers"
import { useLabelMatrix } from "./runtime/screen"

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
}
const OWN = [
  "modelValue",
  "onUpdateModelValue",
  "color",
  "seed",
  "disabled",
  "class",
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
        "relative isolate overflow-hidden rounded-md border px-2.5 py-1.5 font-mono text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        props.modelValue
          ? darkInk()
            ? "border-transparent text-black"
            : "border-transparent text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
        props.class,
      )}
      // Its own listener, beside any `onClick` handed in with the rest.
      on:click={() => props.onUpdateModelValue?.(!props.modelValue)}
    >
      <Show when={props.modelValue}>
        <LabelFill paint={togglePaint(fillOf(color()), matrix())} height={TOGGLE_HEIGHT} />
      </Show>
      <span class="relative block leading-[18px]">{props.children}</span>
    </button>
  )
}
