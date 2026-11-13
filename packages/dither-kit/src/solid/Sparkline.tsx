import { createMemo, createSignal, mergeProps } from "solid-js"
import type { BloomInput } from "../engine/dither-paint"
import type { DitherColor } from "../engine/palette"
import { cn } from "../tailwind/lib"
import Area from "./Area"
import { AreaChart } from "./area-chart"
import type { VariantInput } from "./runtime/chart-context"

export type SparklineProps = {
  /** Plain numeric series — the common sparkline case. */
  data: number[]
  color: DitherColor
  variant?: VariantInput
  seed?: number
  markerIndex?: number | null
  /** Scrubbable: the pointer marks the nearest point with the chart's own
   * crosshair and `onHoverChange` reports its index (null on leave). The
   * chart is then a slider too: focus it and the arrow keys step through
   * the points (Home and End to the ends, Escape or leaving clears). */
  interactive?: boolean
  /** The slider's name for assistive technology, when interactive. */
  label?: string
  /** Brighten the fill while the pointer is over it. */
  hoverLift?: boolean
  /** The idle particle drift along the line; off, the chart holds still. */
  sparkles?: boolean
  hovered?: boolean
  bloom?: BloomInput
  bloomOnHover?: boolean
  animate?: boolean
  class?: string
  onHoverChange?: (index: number | null) => void
}

export default function Sparkline(raw: SparklineProps) {
  const props = mergeProps(
    {
      variant: "gradient" as VariantInput,
      markerIndex: null,
      interactive: false,
      label: "Series",
      hoverLift: true,
      sparkles: true,
      hovered: false,
      bloom: "off" as BloomInput,
      bloomOnHover: false,
      animate: false,
    },
    raw,
  )

  // The point the keyboard picked: the chart marks it like a hover.
  const [keyed, setKeyed] = createSignal<number | null>(null)
  const pick = (i: number | null) => {
    setKeyed(i)
    props.onHoverChange?.(i)
  }
  function onKey(e: KeyboardEvent) {
    const last = props.data.length - 1
    if (last < 0) return
    const at = keyed() ?? last
    const step: Record<string, number | null> = {
      ArrowLeft: Math.max(0, at - 1),
      ArrowDown: Math.max(0, at - 1),
      ArrowRight: Math.min(last, at + 1),
      ArrowUp: Math.min(last, at + 1),
      Home: 0,
      End: last,
      Escape: null,
    }
    if (!(e.key in step)) return
    e.preventDefault()
    pick(step[e.key] ?? null)
  }
  /** A point as a screen reader says it: the value, two decimals at most. */
  const spoken = (v: number | undefined) =>
    v === undefined ? "" : v.toLocaleString("en-US", { maximumFractionDigits: 2 })
  const onBlur = () => {
    if (keyed() !== null) pick(null)
  }

  const rows = createMemo(() => props.data.map((v) => ({ v })))
  const config = createMemo(() => ({ v: { color: props.color } }))

  return (
    <AreaChart
      data={rows()}
      config={config()}
      interactive={props.interactive}
      hoverLift={props.hoverLift}
      sparkles={props.sparkles}
      onHoverChange={(index: number | null) => props.onHoverChange?.(index)}
      animate={props.animate}
      seed={props.seed}
      markerIndex={keyed() ?? props.markerIndex}
      hovered={props.hovered}
      bloom={props.bloom}
      bloomOnHover={props.bloomOnHover}
      margins={{ top: 0, right: 0, bottom: 0, left: 0 }}
      class={cn(
        props.interactive && "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
        props.class,
      )}
      tabindex={props.interactive ? 0 : undefined}
      role={props.interactive ? "slider" : undefined}
      aria-label={props.interactive ? props.label : undefined}
      aria-valuemin={props.interactive ? 0 : undefined}
      aria-valuemax={props.interactive ? props.data.length - 1 : undefined}
      aria-valuenow={props.interactive ? (keyed() ?? props.data.length - 1) : undefined}
      aria-valuetext={props.interactive ? spoken(props.data[keyed() ?? props.data.length - 1]) : undefined}
      onKeyDown={(e) => props.interactive && onKey(e)}
      onBlur={() => props.interactive && onBlur()}
    >
      <Area dataKey="v" variant={props.variant} />
    </AreaChart>
  )
}
