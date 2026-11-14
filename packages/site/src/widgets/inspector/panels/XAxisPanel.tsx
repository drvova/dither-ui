// The x axis layer: its ticks' gap and count.
import { NumberField } from "@/shared/ui"
import type { LayerPanelProps } from "./types"

export default function XAxisPanel(props: LayerPanelProps) {
  return (
    <>
      <NumberField
        modelValue={props.chart.xAxis.tickMargin}
        label="tick gap"
        min={0}
        onUpdateModelValue={(v) => (props.chart.xAxis.tickMargin = v)}
      />
      <NumberField
        modelValue={props.chart.xAxis.maxTicks}
        label="max ticks"
        min={1}
        max={20}
        onUpdateModelValue={(v) => (props.chart.xAxis.maxTicks = v)}
      />
    </>
  )
}
