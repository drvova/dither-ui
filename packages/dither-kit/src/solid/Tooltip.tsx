import { createMemo, For, mergeProps, Show } from "solid-js"
import { rgb } from "../engine/palette"
import { cn } from "../tailwind/lib"
import { chartLayer } from "./runtime/chart-layer"
import { useCommonChart } from "./runtime/common-context"
import { Presence } from "./runtime/presence"
import "./Tooltip.css"

export type TooltipVariant = "default" | "frosted-glass"

export type TooltipProps = {
  labelKey?: string
  valueFormatter?: (value: number, name: string) => string
  variant?: TooltipVariant
}

const VARIANT: Record<TooltipVariant, string> = {
  default: "bg-popover",
  "frosted-glass": "bg-popover/70 backdrop-blur-sm",
}

export default function Tooltip(raw: TooltipProps) {
  const props = mergeProps({ variant: "default" as TooltipVariant }, raw)

  const chart = useCommonChart()
  const show = createMemo(() => chart.ready && chart.hoverIndex != null)

  // Retain the last hovered index so the card keeps its content while fading out.
  const index = createMemo<number>((last) => chart.hoverIndex ?? last, 0)
  const heading = createMemo(() => chart.heading(index(), props.labelKey))
  const items = createMemo(() => chart.itemsAt(index()))

  return chartLayer(
    "dom",
    <Presence when={show() && items().length > 0} name="dk-tooltip">
      <div
        class={cn(
          "dk-tooltip-card pointer-events-none absolute z-10 rounded-md border px-2 py-1 shadow-sm",
          VARIANT[props.variant],
        )}
        style={{
          top: `${chart.tooltipTop}px`,
          left: `${chart.tooltipLeft}px`,
          transform: "translate(-50%, -115%)",
        }}
      >
        <Show when={heading()}>
          <div class="mb-0.5 font-mono text-[10px] text-muted-foreground">{heading()}</div>
        </Show>
        <div class="flex flex-col gap-0.5">
          <For each={items()}>
            {(item) => (
              <div
                class="flex items-center gap-1.5 font-mono text-[11px] text-popover-foreground tabular-nums"
                style={{ opacity: item.dimmed ? 0.4 : 1 }}
              >
                <span class="size-2 rounded-[1px]" style={{ "background-color": rgb(item.seed.fill) }} />
                <span class="text-muted-foreground">{item.label}</span>
                <span class="ml-auto pl-2 text-foreground">
                  {props.valueFormatter ? props.valueFormatter(item.value, item.name) : item.value.toLocaleString()}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </Presence>,
  )
}
