// The grid layer: which lines, their dash and how many.
import { NumberField, Toggle } from "@/shared/ui"
import { Text } from "../ui/fields"
import type { LayerPanelProps } from "./types"

export default function GridPanel(props: LayerPanelProps) {
  return (
    <>
      <div class="flex gap-4">
        <Toggle
          modelValue={props.chart.grid.horizontal}
          label="horizontal"
          onUpdateModelValue={(v) => (props.chart.grid.horizontal = v)}
        />
        <Toggle
          modelValue={props.chart.grid.vertical}
          label="vertical"
          onUpdateModelValue={(v) => (props.chart.grid.vertical = v)}
        />
      </div>
      <Text
        label="dash"
        name="grid-dash"
        value={props.chart.grid.dash}
        set={(v) => (props.chart.grid.dash = v)}
        placeholder="3 3"
      />
      <NumberField
        modelValue={props.chart.grid.tickCount}
        label="lines"
        min={1}
        max={12}
        onUpdateModelValue={(v) => (props.chart.grid.tickCount = v)}
      />
    </>
  )
}
