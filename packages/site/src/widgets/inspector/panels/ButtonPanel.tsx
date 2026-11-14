// A button frame: its label, look, pixel and colour.
import { BloomField, ColorField, Segmented } from "@/shared/ui"
import { asFieldColor, Range, Text } from "../ui/fields"
import type { WidgetPanelProps } from "./types"

const BUTTON_VARIANTS = ["gradient", "dotted", "hatched", "solid"] as const

export default function ButtonPanel(props: WidgetPanelProps<"button">) {
  return (
    <section class="flex flex-col gap-3">
      <p class="micro text-muted-foreground">Button</p>
      <Text label="label" name="button-label" value={props.widget.label} set={(v) => (props.widget.label = v)} />
      <Segmented
        modelValue={props.widget.variant}
        options={BUTTON_VARIANTS}
        label="variant"
        onUpdateModelValue={(v) => (props.widget.variant = v)}
      />
      <Range
        label="pixel"
        name="button-cell"
        min={1}
        max={6}
        step={1}
        value={props.widget.cell}
        set={(v) => (props.widget.cell = v)}
      >
        {props.widget.cell}px
      </Range>
      <div class="text-[11px] text-muted-foreground">
        <span class="mb-1 block">colour</span>
        <ColorField
          modelValue={asFieldColor(props.widget.color)}
          onUpdateModelValue={(v) => (props.widget.color = v)}
        />
      </div>
      <BloomField modelValue={props.widget.bloom} onUpdateModelValue={(v) => (props.widget.bloom = v)} />
    </section>
  )
}
