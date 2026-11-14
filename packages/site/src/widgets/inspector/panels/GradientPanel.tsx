// A gradient frame: its direction, pixel, opacity and one or two colours.
import { Show } from "solid-js"
import { BloomField, ColorField, Segmented, Toggle } from "@/shared/ui"
import { asFieldColor, Range } from "../ui/fields"
import type { WidgetPanelProps } from "./types"

const GRAD_DIRS = ["up", "down", "left", "right"] as const

export default function GradientPanel(props: WidgetPanelProps<"gradient">) {
  return (
    <section class="flex flex-col gap-3">
      <p class="micro text-muted-foreground">Gradient</p>
      <Segmented
        modelValue={props.widget.direction}
        options={GRAD_DIRS}
        label="direction"
        onUpdateModelValue={(v) => (props.widget.direction = v)}
      />
      <Range
        label="pixel"
        name="gradient-cell"
        min={1}
        max={8}
        step={1}
        value={props.widget.cell}
        set={(v) => (props.widget.cell = v)}
      >
        {props.widget.cell}px
      </Range>
      <Range
        label="opacity"
        name="gradient-opacity"
        min={0}
        max={1}
        step={0.05}
        value={props.widget.opacity}
        set={(v) => (props.widget.opacity = v)}
      >
        {props.widget.opacity.toFixed(2)}
      </Range>
      <div class="text-[11px] text-muted-foreground">
        <span class="mb-1 block">from</span>
        <ColorField modelValue={asFieldColor(props.widget.from)} onUpdateModelValue={(v) => (props.widget.from = v)} />
      </div>
      <Toggle
        modelValue={props.widget.twoTone}
        label="two-tone (blend into a colour)"
        onUpdateModelValue={(v) => (props.widget.twoTone = v)}
      />
      <Show when={props.widget.twoTone}>
        <div class="text-[11px] text-muted-foreground">
          <span class="mb-1 block">to</span>
          <ColorField modelValue={asFieldColor(props.widget.to)} onUpdateModelValue={(v) => (props.widget.to = v)} />
        </div>
      </Show>
      <BloomField modelValue={props.widget.bloom} onUpdateModelValue={(v) => (props.widget.bloom = v)} />
    </section>
  )
}
