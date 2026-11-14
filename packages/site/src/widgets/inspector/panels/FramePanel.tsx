// The frame itself: its name and box, then its chart's rows or its widget's panel.
import { Show } from "solid-js"
import { NumberField } from "@/shared/ui"
import { Text } from "../ui/fields"
import ChartPanel from "./ChartPanel"
import type { LayerPanelProps } from "./types"
import WidgetPanel from "./WidgetPanel"

export default function FramePanel(props: LayerPanelProps) {
  return (
    <>
      <Text label="name" name="artboard-name" value={props.artboard.name} set={(v) => (props.artboard.name = v)} />
      <div class="prop-pairs">
        <NumberField modelValue={props.artboard.x} label="X" onUpdateModelValue={(v) => (props.artboard.x = v)} />
        <NumberField modelValue={props.artboard.y} label="Y" onUpdateModelValue={(v) => (props.artboard.y = v)} />
        <NumberField
          modelValue={props.artboard.w}
          label="W"
          min={260}
          onUpdateModelValue={(v) => (props.artboard.w = v)}
        />
        <NumberField
          modelValue={props.artboard.h}
          label="H"
          min={200}
          onUpdateModelValue={(v) => (props.artboard.h = v)}
        />
      </div>
      <Show when={props.artboard.widget} fallback={<ChartPanel chart={props.chart} />}>
        {(widget) => <WidgetPanel artboard={props.artboard} widget={widget()} />}
      </Show>
    </>
  )
}
