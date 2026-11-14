// The legend layer: where it stands and whether a click hides a series.
import { Segmented, Toggle } from "@/shared/ui"
import type { LayerPanelProps } from "./types"

const LEGEND_ALIGNS = ["left", "center", "right"] as const

export default function LegendPanel(props: LayerPanelProps) {
  return (
    <>
      <Segmented
        modelValue={props.chart.legend.align}
        options={LEGEND_ALIGNS}
        label="align"
        onUpdateModelValue={(v) => (props.chart.legend.align = v)}
      />
      <Toggle
        modelValue={props.chart.legend.clickable}
        label="clickable"
        onUpdateModelValue={(v) => (props.chart.legend.clickable = v)}
      />
    </>
  )
}
