// The y axis layer: its ticks' count and gap.
import { NumberField } from "@/shared/ui"
import type { LayerPanelProps } from "./types"

export default function YAxisPanel(props: LayerPanelProps) {
  return (
    <>
      <NumberField
        modelValue={props.chart.yAxis.tickCount}
        label="ticks"
        min={2}
        max={12}
        onUpdateModelValue={(v) => (props.chart.yAxis.tickCount = v)}
      />
      <NumberField
        modelValue={props.chart.yAxis.tickMargin}
        label="tick gap"
        min={0}
        onUpdateModelValue={(v) => (props.chart.yAxis.tickMargin = v)}
      />
    </>
  )
}
