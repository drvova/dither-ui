import { For, mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { rgb } from "../engine/palette"
import { cn } from "../tailwind/lib"
import { chartLayer } from "./runtime/chart-layer"
import { useCommonChart } from "./runtime/common-context"

export type LegendProps = {
  isClickable?: boolean
  align?: "left" | "center" | "right"
}

export default function Legend(raw: LegendProps) {
  const props = mergeProps({ isClickable: false, align: "right" as const }, raw)

  const chart = useCommonChart()

  function dimmed(name: string): boolean {
    const emphasis = chart.selectedDataKey ?? chart.focusDataKey
    return emphasis !== null && emphasis !== name
  }

  return chartLayer(
    "dom",
    <div
      class={cn(
        "pointer-events-none absolute inset-x-0 top-0 flex flex-wrap gap-3 px-1",
        props.align === "right" && "justify-end",
        props.align === "center" && "justify-center",
        props.align === "left" && "justify-start",
      )}
    >
      {/* A key you can press is a button; a plain key is a label, never a
          disabled button. The padding pulled back by the margin gives the
          button a 24px target without moving a pixel. */}
      <For each={chart.names}>
        {(name) => (
          <Dynamic
            component={props.isClickable ? "button" : "span"}
            type={props.isClickable ? "button" : undefined}
            class={cn(
              "-my-1 flex items-center gap-1.5 py-1 font-mono text-[11px] text-muted-foreground transition-opacity",
              props.isClickable && "pointer-events-auto cursor-pointer hover:text-foreground",
              dimmed(name) && "opacity-40",
            )}
            onClick={() => props.isClickable && chart.selectDataKey(chart.selectedDataKey === name ? null : name)}
            onPointerEnter={() => chart.setFocusDataKey(name)}
            onPointerLeave={() => chart.setFocusDataKey(null)}
            onFocus={() => chart.setFocusDataKey(name)}
            onBlur={() => chart.setFocusDataKey(null)}
          >
            <span class="size-2 rounded-[1px]" style={{ "background-color": rgb(chart.seedOf(name).fill) }} />
            {chart.labelOf(name)}
          </Dynamic>
        )}
      </For>
    </div>,
  )
}
