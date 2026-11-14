// The tooltip layer: its look.
import { Segmented } from "@/shared/ui"
import type { LayerPanelProps } from "./types"

const TOOLTIP_VARIANTS = ["default", "frosted-glass"] as const

export default function TooltipPanel(props: LayerPanelProps) {
  return (
    <Segmented
      modelValue={props.chart.tooltip.variant}
      options={TOOLTIP_VARIANTS}
      label="variant"
      onUpdateModelValue={(v) => (props.chart.tooltip.variant = v)}
    />
  )
}
