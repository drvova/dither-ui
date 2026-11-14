// The pie layer: the slices' texture, all at once, and the hole.
import { createMemo } from "solid-js"
import type { VariantInput } from "@dither-ui/kit"
import { TextureField } from "@/shared/ui"
import { Range } from "../ui/fields"
import type { LayerPanelProps } from "./types"

export default function PiePanel(props: LayerPanelProps) {
  const pieVariant = createMemo<VariantInput>(() => props.chart.series[0]?.variant ?? "gradient")
  function setPieVariant(v: VariantInput) {
    props.chart.series.forEach((s) => (s.variant = v))
  }
  return (
    <>
      <TextureField modelValue={pieVariant()} onUpdateModelValue={setPieVariant} />
      <Range
        label="radius"
        name="pie-radius"
        min={0}
        max={0.85}
        step={0.05}
        value={props.chart.innerRadius}
        set={(v) => (props.chart.innerRadius = v)}
      >
        {props.chart.innerRadius.toFixed(2)}
      </Range>
    </>
  )
}
