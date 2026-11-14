// An image frame: its address, words, pixel, focus and fade.
import { Range, Text } from "../ui/fields"
import type { WidgetPanelProps } from "./types"

export default function ImagePanel(props: WidgetPanelProps<"image">) {
  return (
    <section class="flex flex-col gap-3">
      <p class="micro text-muted-foreground">Image</p>
      <Text
        label="src"
        name="image-src"
        value={props.widget.src}
        set={(v) => (props.widget.src = v)}
        placeholder="https://…"
      />
      <Text label="alt" name="image-alt" value={props.widget.alt} set={(v) => (props.widget.alt = v)} />
      <Range
        label="pixel"
        name="image-cell"
        min={1}
        max={8}
        step={1}
        value={props.widget.cell}
        set={(v) => (props.widget.cell = v)}
      >
        {props.widget.cell}px
      </Range>
      <Range
        label="focus"
        name="image-focus"
        min={0}
        max={1}
        step={0.05}
        value={props.widget.focusY}
        set={(v) => (props.widget.focusY = v)}
      >
        {props.widget.focusY.toFixed(2)}
      </Range>
      <Range
        label="fade"
        name="image-fade"
        min={0}
        max={80}
        step={2}
        value={props.widget.fade}
        set={(v) => (props.widget.fade = v)}
      >
        {props.widget.fade}px
      </Range>
    </section>
  )
}
